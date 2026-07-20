import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import {
    CreateOrderBodyDto,
    GetOrdersQueryDto,
    OrderProductItemDto,
    UpdateOrderBodyDto,
} from 'common/dto/order.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class OrderService {
    constructor(private readonly prisma: PrismaService) { }

    private readonly orderInclude = {
        createdBy: {
            select: {
                id: true, name: true, username: true, email: true, phone: true,
                address: true, avatar: true, role: true,
            },
        },
        customer: true,
        delivery: true,
        products: {
            include: {
                warehouse: true,
                productUnit: {
                    include: {
                        product: { include: { images: true, category: true } },
                        unit: true,
                    },
                },
            },
            orderBy: { id: 'asc' as const },
        },
    };

    private async validateRelations(customerId?: number, deliveryId?: number) {
        const [customer, delivery] = await Promise.all([
            customerId ? this.prisma.customer.findUnique({ where: { id: customerId } }) : Promise.resolve(null),
            deliveryId ? this.prisma.delivery.findUnique({ where: { id: deliveryId } }) : Promise.resolve(null),
        ]);

        if (customerId && !customer) throw new NotFoundException('message.order.customer-not-found');
        if (deliveryId && !delivery) throw new NotFoundException('message.order.delivery-not-found');
    }

    private async validateAndReduceStock(tx: Prisma.TransactionClient, products: OrderProductItemDto[]) {
        const keys = new Set<string>();
        const warehouseIds = new Set<number>();

        for (const item of products) {
            const key = `${item.warehouseId}-${item.productId}-${item.unitId}`;
            if (keys.has(key)) throw new BadRequestException('message.order.product-duplicated');
            keys.add(key);
            warehouseIds.add(item.warehouseId);
        }

        const [warehouses, productUnits] = await Promise.all([
            tx.warehouse.findMany({ where: { id: { in: [...warehouseIds] } }, select: { id: true } }),
            tx.productUnit.findMany({
                where: { OR: products.map(({ productId, unitId }) => ({ productId, unitId })) },
                select: { productId: true, unitId: true },
            }),
        ]);

        if (warehouses.length !== warehouseIds.size) throw new NotFoundException('message.order.warehouse-not-found');
        if (productUnits.length !== products.length) throw new NotFoundException('message.order.product-not-found');

        for (const item of products) {
            const result = await tx.warehouseProduct.updateMany({
                where: {
                    warehouseId: item.warehouseId,
                    productId: item.productId,
                    unitId: item.unitId,
                    quantity: { gte: item.quantity },
                },
                data: { quantity: { decrement: item.quantity } },
            });

            if (result.count === 0) throw new BadRequestException('message.order.product-insufficient-stock');
        }
    }

    private async restoreStock(tx: Prisma.TransactionClient, products: Array<{ warehouseId: number | null; productId: number; unitId: number; quantity: number }>) {
        for (const item of products) {
            if (!item.warehouseId) continue;
            await tx.warehouseProduct.updateMany({
                where: { warehouseId: item.warehouseId, productId: item.productId, unitId: item.unitId },
                data: { quantity: { increment: item.quantity } },
            });
        }
    }

    private buildOrderProducts(products: OrderProductItemDto[]) {
        return products.map((item) => ({
            warehouseId: item.warehouseId,
            productId: item.productId,
            unitId: item.unitId,
            quantity: item.quantity,
            sellPrice: item.sellPrice,
            extraPrice: item.extraPrice ?? 0,
            vatPercent: item.vatPercent,
        }));
    }

    async createOrder(dto: CreateOrderBodyDto, creatorId: number) {
        const { products, customerId, deliveryId, ...orderData } = dto;
        const existingOrder = await this.prisma.order.findUnique({ where: { orderCode: dto.orderCode } });
        if (existingOrder) throw new ConflictException('message.order.order-code-duplicated');

        await this.validateRelations(customerId, deliveryId);
        return this.prisma.$transaction(async (tx) => {
            await this.validateAndReduceStock(tx, products);
            return tx.order.create({
                data: {
                    ...orderData,
                    customerId,
                    deliveryId,
                    creatorId,
                    products: { create: this.buildOrderProducts(products) },
                },
                include: this.orderInclude,
            });
        });
    }

    async findAllOrder(query: GetOrdersQueryDto) {
        const trimmedSearch = query.search?.trim();
        const { page = 1, limit = 10, status } = query;
        const skip = (page - 1) * limit;
        const where = {
            ...(status ? { status } : {}),
            ...(trimmedSearch ? {
                OR: [
                    { orderCode: { contains: trimmedSearch, mode: 'insensitive' as const } },
                    { customerName: { contains: trimmedSearch, mode: 'insensitive' as const } },
                    { customerPhone: { contains: trimmedSearch, mode: 'insensitive' as const } },
                ],
            } : {}),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({ where, include: this.orderInclude, orderBy: { createdAt: 'desc' }, skip, take: limit }),
            this.prisma.order.count({ where }),
        ]);
        return { items, pagination: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) } };
    }

    async findOrderById(id: number) {
        const order = await this.prisma.order.findUnique({ where: { id }, include: this.orderInclude });
        if (!order) throw new NotFoundException('message.order.not-found');
        return order;
    }

    async updateOrder(id: number, dto: UpdateOrderBodyDto) {
        const currentOrder = await this.prisma.order.findUnique({
            where: { id }, select: { customerId: true, deliveryId: true, products: true },
        });
        if (!currentOrder) throw new NotFoundException('message.order.not-found');
        const { products, customerId, deliveryId, ...orderData } = dto;

        if (dto.orderCode) {
            const existingOrder = await this.prisma.order.findFirst({ where: { orderCode: dto.orderCode, NOT: { id } } });
            if (existingOrder) throw new ConflictException('message.order.order-code-duplicated');
        }

        await this.validateRelations(
            customerId === undefined ? currentOrder.customerId ?? undefined : customerId,
            deliveryId === undefined ? currentOrder.deliveryId ?? undefined : deliveryId,
        );

        return this.prisma.$transaction(async (tx) => {
            if (products) {
                await this.restoreStock(tx, currentOrder.products);
                await this.validateAndReduceStock(tx, products);
                await tx.orderProduct.deleteMany({ where: { orderId: id } });
                await tx.orderProduct.createMany({ data: this.buildOrderProducts(products).map((item) => ({ ...item, orderId: id })) });
            }

            return tx.order.update({
                where: { id },
                data: { ...orderData, ...(customerId !== undefined ? { customerId } : {}), ...(deliveryId !== undefined ? { deliveryId } : {}) },
                include: this.orderInclude,
            });
        });
    }

    async removeOrder(id: number) {
        const order = await this.prisma.order.findUnique({ where: { id }, select: { products: true } });
        if (!order) throw new NotFoundException('message.order.not-found');
        return this.prisma.$transaction(async (tx) => {
            await this.restoreStock(tx, order.products);
            await tx.orderProduct.deleteMany({ where: { orderId: id } });
            return tx.order.delete({ where: { id } });
        });
    }
}
