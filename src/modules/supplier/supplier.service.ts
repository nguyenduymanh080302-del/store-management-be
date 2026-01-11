import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { CreateUnitBodyDto, UpdateUnitBodyDto } from 'common/dto/unit.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) { }

  // CREATE
  async createUnit(
    data: CreateUnitBodyDto,
  ) {
    const exists = await this.prisma.unit.findUnique({
      where: { name: data.name },
    });

    if (exists) {
      throw new ConflictException("message.unit.name-duplicated");
    }

    const newUnit = await this.prisma.unit.create({ data });
    return newUnit
  }

  // READ ALL
  async findAllUnit() {
    return await this.prisma.unit.findMany({
      orderBy: { name: 'desc' },
    });
  }

  // READ ONE
  async findUnitById(id: number) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
    });

    if (!unit) {
      throw new NotFoundException('message.unit.not-found');
    }

    return unit;
  }

  // UPDATE
  async updateUnit(
    id: number,
    data: UpdateUnitBodyDto,
  ) {
    await this.findUnitById(id);

    return this.prisma.unit.update({
      where: { id },
      data,
    });
  }

  // DELETE
  async removeUnit(id: number) {
    await this.findUnitById(id);

    return this.prisma.unit.delete({
      where: { id },
    });
  }
}
