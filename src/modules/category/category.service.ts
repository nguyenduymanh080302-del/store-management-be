import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { CreateCategoryBodyDto, UpdateCategoryBodyDto } from 'common/dto/category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) { }

  // CREATE
  async createCategory(
    data: CreateCategoryBodyDto,
  ) {
    const exists = await this.prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (exists) {
      throw new ConflictException("message.category.slug-duplicated");
    }

    const newCategory = await this.prisma.category.create({ data });
    return newCategory
  }

  // READ ALL
  async findAllCategory() {
    return await this.prisma.category.findMany({
      orderBy: { slug: 'asc' },
    });
  }

  // READ ONE
  async findCategoryById(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('message.category.not-found');
    }

    return category;
  }

  // UPDATE
  async updateCategory(
    id: number,
    data: UpdateCategoryBodyDto,
  ) {
    await this.findCategoryById(id);

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  // DELETE
  async removeCategory(id: number) {
    await this.findCategoryById(id);

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
