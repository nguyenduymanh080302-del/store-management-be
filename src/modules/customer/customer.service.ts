import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    CreateCustomerBodyDto,
    UpdateCustomerBodyDto,
} from 'common/dto/customer.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CustomerService {
    constructor(private readonly prisma: PrismaService) { }

    // CREATE
    async createCustomer(data: CreateCustomerBodyDto) {
        const exists = await this.prisma.customer.findUnique({
            where: { email: data.email },
        });

        if (exists) {
            throw new ConflictException('message.customer.email-duplicated');
        }

        return this.prisma.customer.create({
            data,
        });
    }

    // READ ALL
    async findAllCustomer() {
        return this.prisma.customer.findMany({
            orderBy: { name: 'desc' },
        });
    }

    // READ ONE
    async findCustomerById(id: number) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
        });

        if (!customer) {
            throw new NotFoundException('message.customer.not-found');
        }

        return customer;
    }

    // UPDATE
    async updateCustomer(
        id: number,
        data: UpdateCustomerBodyDto,
    ) {
        await this.findCustomerById(id);

        // Check email duplication if email is updated
        if (data.email) {
            const exists = await this.prisma.customer.findUnique({
                where: { email: data.email },
            });

            if (exists && exists.id !== id) {
                throw new ConflictException('message.customer.email-duplicated');
            }
        }

        return this.prisma.customer.update({
            where: { id },
            data,
        });
    }

    // DELETE
    async removeCustomer(id: number) {
        await this.findCustomerById(id);

        return this.prisma.customer.delete({
            where: { id },
        });
    }
}
