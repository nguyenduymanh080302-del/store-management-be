import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    CreateWarehouseBodyDto,
    UpdateWarehouseBodyDto,
} from 'common/dto/warehouse.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WarehouseService {
    constructor(private readonly prisma: PrismaService) { }

    async createWarehouse(data: CreateWarehouseBodyDto) {
        const exists = await this.prisma.warehouse.findUnique({
            where: { name: data.name },
        });

        if (exists) {
            throw new ConflictException('message.warehouse.name-duplicated');
        }

        return this.prisma.warehouse.create({ data });
    }

    async findAllWarehouse() {
        return this.prisma.warehouse.findMany({
            include: {
                products: {
                    select: {
                        productId: true,
                        unitId: true,
                        quantity: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findWarehouseById(id: number) {
        const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });

        if (!warehouse) {
            throw new NotFoundException('message.warehouse.not-found');
        }

        return warehouse;
    }

    async updateWarehouse(id: number, data: UpdateWarehouseBodyDto) {
        await this.findWarehouseById(id);

        if (data.name) {
            const exists = await this.prisma.warehouse.findUnique({
                where: { name: data.name },
            });

            if (exists && exists.id !== id) {
                throw new ConflictException('message.warehouse.name-duplicated');
            }
        }

        return this.prisma.warehouse.update({
            where: { id },
            data,
        });
    }

    async removeWarehouse(id: number) {
        await this.findWarehouseById(id);

        return this.prisma.warehouse.delete({ where: { id } });
    }
}
