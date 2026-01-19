import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    CreateDeliveryBodyDto,
    UpdateDeliveryBodyDto,
} from 'common/dto/delivery.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeliveryService {
    constructor(private readonly prisma: PrismaService) { }

    // CREATE
    async createDelivery(data: CreateDeliveryBodyDto) {
        if (data.phone) {
            const exists = await this.prisma.delivery.findUnique({
                where: { phone: data.phone }
            })

            if (exists) {
                throw new ConflictException('message.delivery.phone-duplicated');
            }
        }

        return this.prisma.delivery.create({
            data,
        });
    }

    // READ ALL
    async findAllDelivery() {
        return this.prisma.delivery.findMany({
            orderBy: { name: 'desc' },
        });
    }

    // READ ONE
    async findDeliveryById(id: number) {
        const delivery = await this.prisma.delivery.findUnique({
            where: { id },
        });

        if (!delivery) {
            throw new NotFoundException('message.delivery.not-found');
        }

        return delivery;
    }

    // UPDATE
    async updateDelivery(
        id: number,
        data: UpdateDeliveryBodyDto,
    ) {
        await this.findDeliveryById(id);

        // Check email duplication if email is being updated
        if (data.email) {
            const exists = await this.prisma.delivery.findUnique({
                where: { email: data.email },
            });

            if (exists && exists.id !== id) {
                throw new ConflictException('message.delivery.email-duplicated');
            }
        }

        return this.prisma.delivery.update({
            where: { id },
            data,
        });
    }

    // DELETE
    async removeDelivery(id: number) {
        await this.findDeliveryById(id);

        return this.prisma.delivery.delete({
            where: { id },
        });
    }
}
