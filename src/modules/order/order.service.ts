import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
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
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                address: true,
                avatar: true,
                role: true,
            },
        },
        customer: true,
        delivery: true,
        paymentMethod: true,
        products: {
            include: {
                productUnit: {
                    include: {
                        product: {
                            include: {
                                images: true,
                                category: true,
                            },
                        },
                        unit: true,
                    },
                },
            },
            orderBy: { id: 'asc' as const },
        },
    };

    private async validateRelations(
        paymentMethodId: number,
        warehouseId: number,
        customerId?: number,
        deliveryId?: number,
    ) {
        const [paymentMethod, warehouse, customer, delivery] =
            await Promise.all([
                this.prisma.paymentMethod.findUnique({
                    where: { id: paymentMethodId },
                }),
                this.prisma.warehouse.findUnique({
                    where: { id: warehouseId },
                }),
                customerId
                    ? this.prisma.customer.findUnique({
                        where: { id: customerId },
                    })
                    : Promise.resolve(null),
                deliveryId
                    ? this.prisma.delivery.findUnique({
                        where: { id: deliveryId },
                    })
                    : Promise.resolve(null),
            ]);

        if (!paymentMethod) {
            throw new NotFoundException(
                'message.order.payment-method-not-found',
            );
        }

        if (!warehouse) {
            throw new NotFoundException(
                'message.order.warehouse-not-found',
            );
        }

        if (customerId && !customer) {
            throw new NotFoundException(
                'message.order.customer-not-found',
            );
        }

        if (deliveryId && !delivery) {
            throw new NotFoundException(
                'message.order.delivery-not-found',
            );
        }
    }

    private async validateProducts(products: OrderProductItemDto[]) {
        const productKeys = new Set<string>();

        for (const item of products) {
            const key = `${item.productId}-${item.unitId}`;

            if (productKeys.has(key)) {
                throw new BadRequestException(
                    'message.order.product-duplicated',
                );
            }

            productKeys.add(key);
        }

        const productUnits = await this.prisma.$transaction(
            products.map((item) =>
                this.prisma.productUnit.findUnique({
                    where: {
                        productId_unitId: {
                            productId: item.productId,
                            unitId: item.unitId,
                        },
                    },
                }),
            ),
        );

        const missingItem = productUnits.findIndex((productUnit) => !productUnit);

        if (missingItem !== -1) {
            throw new NotFoundException(
                'message.order.product-not-found',
            );
        }
    }

    private buildOrderProducts(products: OrderProductItemDto[]) {
        return products.map((item) => ({
            productId: item.productId,
            unitId: item.unitId,
            quantity: item.quantity,
            sellPrice: item.sellPrice,
            extraPrice: item.extraPrice ?? 0,
            vatPercent: item.vatPercent,
        }));
    }

    async createOrder(
        dto: CreateOrderBodyDto,
        creatorId: number,
    ) {
        const {
            products,
            customerId,
            deliveryId,
            paymentMethodId,
            warehouseId,
            ...orderData
        } = dto;

        const existingOrder = await this.prisma.order.findUnique({
            where: { orderCode: dto.orderCode },
        });

        if (existingOrder) {
            throw new ConflictException(
                'message.order.order-code-duplicated',
            );
        }

        await this.validateRelations(
            paymentMethodId,
            warehouseId,
            customerId,
            deliveryId,
        );
        await this.validateProducts(products);

        return this.prisma.order.create({
            data: {
                ...orderData,
                customerId,
                deliveryId,
                paymentMethodId,
                warehouseId,
                creatorId,
                products: {
                    create: this.buildOrderProducts(products),
                },
            },
            include: this.orderInclude,
        });
    }

    async findAllOrder(query: GetOrdersQueryDto) {
        const trimmedSearch = query.search?.trim();
        const { page = 1, limit = 10, status } = query;
        const skip = (page - 1) * limit;
        const where = {
            ...(status ? { status } : {}),
            ...(trimmedSearch
                ? {
                    OR: [
                        {
                            orderCode: {
                                contains: trimmedSearch,
                                mode: 'insensitive' as const,
                            },
                        },
                        {
                            customerName: {
                                contains: trimmedSearch,
                                mode: 'insensitive' as const,
                            },
                        },
                        {
                            customerPhone: {
                                contains: trimmedSearch,
                                mode: 'insensitive' as const,
                            },
                        },
                    ],
                }
                : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include: this.orderInclude,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: total === 0 ? 0 : Math.ceil(total / limit),
            },
        };
    }

    async findOrderById(id: number) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: this.orderInclude,
        });

        if (!order) {
            throw new NotFoundException('message.order.not-found');
        }

        return order;
    }

    async updateOrder(
        id: number,
        dto: UpdateOrderBodyDto,
    ) {
        await this.findOrderById(id);

        const {
            products,
            customerId,
            deliveryId,
            paymentMethodId,
            warehouseId,
            ...orderData
        } = dto;

        if (dto.orderCode) {
            const existingOrder = await this.prisma.order.findFirst({
                where: {
                    orderCode: dto.orderCode,
                    NOT: { id },
                },
            });

            if (existingOrder) {
                throw new ConflictException(
                    'message.order.order-code-duplicated',
                );
            }
        }

        if (
            paymentMethodId !== undefined ||
            warehouseId !== undefined ||
            customerId !== undefined ||
            deliveryId !== undefined
        ) {
            const currentOrder = await this.prisma.order.findUnique({
                where: { id },
                select: {
                    paymentMethodId: true,
                    warehouseId: true,
                    customerId: true,
                    deliveryId: true,
                },
            });

            if (!currentOrder) {
                throw new NotFoundException('message.order.not-found');
            }

            await this.validateRelations(
                paymentMethodId ?? currentOrder.paymentMethodId,
                warehouseId ?? currentOrder.warehouseId,
                customerId === undefined
                    ? currentOrder.customerId ?? undefined
                    : customerId,
                deliveryId === undefined
                    ? currentOrder.deliveryId ?? undefined
                    : deliveryId,
            );
        }

        if (products) {
            await this.validateProducts(products);
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id },
                data: {
                    ...orderData,
                    ...(customerId !== undefined ? { customerId } : {}),
                    ...(deliveryId !== undefined ? { deliveryId } : {}),
                    ...(paymentMethodId !== undefined
                        ? { paymentMethodId }
                        : {}),
                    ...(warehouseId !== undefined ? { warehouseId } : {}),
                },
            });

            if (products) {
                await tx.orderProduct.deleteMany({
                    where: { orderId: id },
                });

                await tx.orderProduct.createMany({
                    data: this.buildOrderProducts(products).map((item) => ({
                        ...item,
                        orderId: id,
                    })),
                });
            }

            return tx.order.findUnique({
                where: { id },
                include: this.orderInclude,
            });
        });
    }

    async removeOrder(id: number) {
        await this.findOrderById(id);

        return this.prisma.$transaction(async (tx) => {
            await tx.orderProduct.deleteMany({
                where: { orderId: id },
            });

            await tx.order.delete({
                where: { id },
            });
        });
    }
}
