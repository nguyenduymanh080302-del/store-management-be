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
import { PaymentMethodService } from './payment-method.service';
import { ApiResponse } from 'src/types';
import {
    CreatePaymentMethodBodyDto,
    DeletePaymentMethodParamDto,
    GetPaymentMethodParamDto,
    UpdatePaymentMethodBodyDto,
    UpdatePaymentMethodParamDto
} from "common/dto/payment-method"
import { PaymentMethodEntity } from 'common/entities/payment-method.entity';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';

@Controller('payment-method')
export class PaymentMethodController {
    constructor(
        private readonly paymentMethodService: PaymentMethodService,
    ) { }

    /* =========================
       CREATE
    ========================= */

    @UseGuards(JwtAccessGuard)
    @Post()
    async createPaymentMethod(
        @Body() data: CreatePaymentMethodBodyDto,
    ): Promise<ApiResponse<PaymentMethodEntity>> {
        const result =
            await this.paymentMethodService.createPaymentMethod(data);

        return {
            status: HttpStatus.CREATED,
            message: 'message.payment-method.created',
            data: result,
        };
    }

    /* =========================
       READ ALL
    ========================= */

    @Get()
    async findAllPaymentMethod(): Promise<
        ApiResponse<PaymentMethodEntity[]>
    > {
        const result =
            await this.paymentMethodService.findAllPaymentMethod();

        return {
            status: HttpStatus.OK,
            message: 'message.payment-method.success',
            data: result,
        };
    }

    /* =========================
       READ ONE
    ========================= */

    @Get(':id')
    async findPaymentMethodById(
        @Param() params: GetPaymentMethodParamDto,
    ): Promise<ApiResponse<PaymentMethodEntity>> {
        const result =
            await this.paymentMethodService.findPaymentMethodById(
                params.id,
            );

        return {
            status: HttpStatus.OK,
            message: 'message.payment-method.success',
            data: result,
        };
    }

    /* =========================
       UPDATE
    ========================= */

    @UseGuards(JwtAccessGuard)
    @Patch(':id')
    async updatePaymentMethod(
        @Param() params: UpdatePaymentMethodParamDto,
        @Body() data: UpdatePaymentMethodBodyDto,
    ): Promise<ApiResponse<PaymentMethodEntity>> {
        if (data.name === undefined && data.isActive === undefined) {
            throw new BadRequestException(
                'message.payment-method.missing-data',
            );
        }

        const result =
            await this.paymentMethodService.updatePaymentMethod(
                params.id,
                data,
            );

        return {
            status: HttpStatus.OK,
            message: 'message.payment-method.updated',
            data: result,
        };
    }

    /* =========================
       DELETE
    ========================= */

    @UseGuards(JwtAccessGuard)
    @Delete(':id')
    async removePaymentMethod(
        @Param() params: DeletePaymentMethodParamDto,
    ): Promise<ApiResponse<null>> {
        await this.paymentMethodService.removePaymentMethod(
            params.id,
        );

        return {
            status: HttpStatus.OK,
            message: 'message.payment-method.deleted',
        };
    }
}
