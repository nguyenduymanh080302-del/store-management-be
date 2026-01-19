import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSupplierBodyDto,
  UpdateSupplierBodyDto,
} from 'common/dto/supplier.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) { }

  // CREATE
  async createSupplier(data: CreateSupplierBodyDto) {
    const exists = await this.prisma.supplier.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new ConflictException('message.supplier.email-duplicated');
    }

    const newSupplier = await this.prisma.supplier.create({
      data,
    });

    return newSupplier;
  }

  // READ ALL
  async findAllSupplier() {
    return await this.prisma.supplier.findMany({
      orderBy: { name: 'desc' },
    });
  }

  // READ ONE
  async findSupplierById(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('message.supplier.not-found');
    }

    return supplier;
  }

  // UPDATE
  async updateSupplier(
    id: number,
    data: UpdateSupplierBodyDto,
  ) {
    await this.findSupplierById(id);

    // Check email duplication if email is being updated
    if (data.email) {
      const exists = await this.prisma.supplier.findUnique({
        where: { email: data.email },
      });

      if (exists && exists.id !== id) {
        throw new ConflictException('message.supplier.email-duplicated');
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  // DELETE
  async removeSupplier(id: number) {
    await this.findSupplierById(id);

    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
