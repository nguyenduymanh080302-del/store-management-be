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
import { CustomerService } from './customer.service';
import { ApiResponse } from 'src/types';
import {
    CreateCustomerBodyDto,
    DeleteCustomerParamDto,
    GetCustomerParamDto,
    UpdateCustomerBodyDto,
    UpdateCustomerParamDto,
} from 'common/dto/customer.dto';
import { CustomerEntity } from 'common/entities/customer.entity';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';

@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    // CREATE
    @UseGuards(JwtAccessGuard)
    @Post()
    async createCustomer(
        @Body() data: CreateCustomerBodyDto,
    ): Promise<ApiResponse<CustomerEntity>> {
        const result = await this.customerService.createCustomer(data);

        return {
            status: HttpStatus.CREATED,
            message: 'message.customer.created',
            data: result,
        };
    }

    // READ ALL
    @Get()
    async findAllCustomer(): Promise<ApiResponse<CustomerEntity[]>> {
        const result = await this.customerService.findAllCustomer();

        return {
            status: HttpStatus.OK,
            message: 'message.customer.success',
            data: result,
        };
    }

    // READ ONE
    @Get(':id')
    async findCustomerById(
        @Param() params: GetCustomerParamDto,
    ): Promise<ApiResponse<CustomerEntity>> {
        const result = await this.customerService.findCustomerById(params.id);

        return {
            status: HttpStatus.OK,
            message: 'message.customer.success',
            data: result,
        };
    }

    // UPDATE
    @UseGuards(JwtAccessGuard)
    @Patch(':id')
    async updateCustomer(
        @Param() params: UpdateCustomerParamDto,
        @Body() data: UpdateCustomerBodyDto,
    ): Promise<ApiResponse<CustomerEntity>> {
        if (!Object.keys(data).length) {
            throw new BadRequestException('message.customer.missing-data');
        }

        const result = await this.customerService.updateCustomer(params.id, data);

        return {
            status: HttpStatus.OK,
            message: 'message.customer.updated',
            data: result,
        };
    }

    // DELETE
    @UseGuards(JwtAccessGuard)
    @Delete(':id')
    async removeCustomer(
        @Param() params: DeleteCustomerParamDto,
    ): Promise<ApiResponse<null>> {
        await this.customerService.removeCustomer(params.id);

        return {
            status: HttpStatus.OK,
            message: 'message.customer.deleted',
        };
    }
}
