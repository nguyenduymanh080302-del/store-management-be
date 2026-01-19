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
import { SupplierService } from './supplier.service';
import { ApiResponse } from 'src/types';
import {
  CreateSupplierBodyDto,
  DeleteSupplierParamDto,
  GetSupplierParamDto,
  UpdateSupplierBodyDto,
  UpdateSupplierParamDto,
} from 'common/dto/supplier.dto';
import { SupplierEntity } from 'common/entities/supplier.entity';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';

@Controller('supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) { }

  // CREATE
  @UseGuards(JwtAccessGuard)
  @Post()
  async createSupplier(
    @Body() data: CreateSupplierBodyDto,
  ): Promise<ApiResponse<SupplierEntity>> {
    const result = await this.supplierService.createSupplier(data);

    return {
      status: HttpStatus.CREATED,
      message: 'message.supplier.created',
      data: result,
    };
  }

  // READ ALL
  @Get()
  async findAllSupplier(): Promise<ApiResponse<SupplierEntity[]>> {
    const result = await this.supplierService.findAllSupplier();

    return {
      status: HttpStatus.OK,
      message: 'message.supplier.success',
      data: result,
    };
  }

  // READ ONE
  @Get(':id')
  async findSupplierById(
    @Param() params: GetSupplierParamDto,
  ): Promise<ApiResponse<SupplierEntity>> {
    const result = await this.supplierService.findSupplierById(params.id);

    return {
      status: HttpStatus.OK,
      message: 'message.supplier.success',
      data: result,
    };
  }

  // UPDATE
  @UseGuards(JwtAccessGuard)
  @Patch(':id')
  async updateSupplier(
    @Param() params: UpdateSupplierParamDto,
    @Body() data: UpdateSupplierBodyDto,
  ): Promise<ApiResponse<SupplierEntity>> {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('message.supplier.missing-data');
    }

    const result = await this.supplierService.updateSupplier(
      params.id,
      data,
    );

    return {
      status: HttpStatus.OK,
      message: 'message.supplier.updated',
      data: result,
    };
  }

  // DELETE
  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  async removeSupplier(
    @Param() params: DeleteSupplierParamDto,
  ): Promise<ApiResponse<null>> {
    await this.supplierService.removeSupplier(params.id);

    return {
      status: HttpStatus.OK,
      message: 'message.supplier.deleted',
    };
  }
}
