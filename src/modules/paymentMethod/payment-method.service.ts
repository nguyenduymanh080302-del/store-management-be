import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreatePaymentMethodBodyDto, UpdatePaymentMethodBodyDto } from 'common/dto/payment-method';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentMethodService {
    constructor(private readonly prisma: PrismaService) { }

    /* =========================
       CREATE
    ========================= */

    async createPaymentMethod(
        data: CreatePaymentMethodBodyDto,
    ) {
        const exists = await this.prisma.paymentMethod.findUnique({
            where: { name: data.name },
        });

        if (exists) {
            throw new ConflictException(
                'message.payment-method.name-duplicated',
            );
        }

        const paymentMethod = await this.prisma.paymentMethod.create({
            data: {
                name: data.name,
                isActive: data.isActive ?? true,
            },
        });

        return paymentMethod;
    }

    /* =========================
       READ ALL
    ========================= */

    async findAllPaymentMethod() {
        return this.prisma.paymentMethod.findMany({
            orderBy: { name: 'asc' },
        });
    }

    /* =========================
       READ ONE
    ========================= */

    async findPaymentMethodById(id: number) {
        const paymentMethod =
            await this.prisma.paymentMethod.findUnique({
                where: { id },
            });

        if (!paymentMethod) {
            throw new NotFoundException(
                'message.payment-method.not-found',
            );
        }

        return paymentMethod;
    }

    /* =========================
       UPDATE
    ========================= */

    async updatePaymentMethod(
        id: number,
        data: UpdatePaymentMethodBodyDto,
    ) {
        await this.findPaymentMethodById(id);

        // Optional: check duplicate name when updating
        if (data.name) {
            const exists = await this.prisma.paymentMethod.findFirst({
                where: {
                    name: data.name,
                    NOT: { id },
                },
            });

            if (exists) {
                throw new ConflictException(
                    'message.payment-method.name-duplicated',
                );
            }
        }

        return this.prisma.paymentMethod.update({
            where: { id },
            data,
        });
    }

    /* =========================
       DELETE
    ========================= */

    async removePaymentMethod(id: number) {
        await this.findPaymentMethodById(id);

        return this.prisma.paymentMethod.delete({
            where: { id },
        });
    }
}
