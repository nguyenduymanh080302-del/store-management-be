import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiResponse } from 'src/types';
import { CreateCategoryBodyDto, DeleteCategoryParamDto, GetCategoryParamDto, UpdateCategoryBodyDto, UpdateCategoryParamDto } from 'common/dto/category.dto';
import { CategoryEntity } from 'common/entities/category.entity';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  // CREATE
  @UseGuards(JwtAccessGuard)
  @Post()
  async createCategory(@Body() data: CreateCategoryBodyDto): Promise<ApiResponse<CategoryEntity>> {
    const result = await this.categoryService.createCategory(data);

    return {
      status: HttpStatus.CREATED,
      message: 'message.category.created',
      data: result,
    };
  }

  // READ ALL
  @Get()
  async findAllCategory(): Promise<ApiResponse<CategoryEntity[]>> {
    const result = await this.categoryService.findAllCategory();

    return {
      status: HttpStatus.OK,
      message: 'message.category.success',
      data: result,
    };
  }

  // READ ONE
  @Get(':id')
  async findCategoryById(@Param() params: GetCategoryParamDto): Promise<ApiResponse<CategoryEntity>> {
    const result = await this.categoryService.findCategoryById(params.id);

    return {
      status: HttpStatus.OK,
      message: 'message.category.success',
      data: result,
    };
  }

  // UPDATE
  @UseGuards(JwtAccessGuard)
  @Patch(':id')
  async updateCategory(@Param() params: UpdateCategoryParamDto, @Body() data: UpdateCategoryBodyDto,): Promise<ApiResponse<CategoryEntity>> {
    if (!data.name && !data.slug) {
      throw new BadRequestException("message.category.missing-data")
    }

    const result = await this.categoryService.updateCategory(params.id, data);

    return {
      status: HttpStatus.OK,
      message: 'message.category.updated',
      data: result,
    };
  }

  // DELETE
  @Delete(':id')
  async removeCategory(@Param() params: DeleteCategoryParamDto): Promise<ApiResponse<null>> {
    await this.categoryService.removeCategory(params.id);

    return {
      status: HttpStatus.OK,
      message: 'message.category.deleted',
    };
  }
}
