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
import { DeliveryService } from './delivery.service';
import { ApiResponse } from 'src/types';
import {
    CreateDeliveryBodyDto,
    DeleteDeliveryParamDto,
    GetDeliveryParamDto,
    UpdateDeliveryBodyDto,
    UpdateDeliveryParamDto,
} from 'common/dto/delivery.dto';
import { DeliveryEntity } from 'common/entities/delivery.entity';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';

@Controller('delivery')
export class DeliveryController {
    constructor(private readonly deliveryService: DeliveryService) { }

    // CREATE
    @UseGuards(JwtAccessGuard)
    @Post()
    async createDelivery(
        @Body() data: CreateDeliveryBodyDto,
    ): Promise<ApiResponse<DeliveryEntity>> {
        const result = await this.deliveryService.createDelivery(data);

        return {
            status: HttpStatus.CREATED,
            message: 'message.delivery.created',
            data: result,
        };
    }

    // READ ALL
    @Get()
    async findAllDelivery(): Promise<ApiResponse<DeliveryEntity[]>> {
        const result = await this.deliveryService.findAllDelivery();

        return {
            status: HttpStatus.OK,
            message: 'message.delivery.success',
            data: result,
        };
    }

    // READ ONE
    @Get(':id')
    async findDeliveryById(
        @Param() params: GetDeliveryParamDto,
    ): Promise<ApiResponse<DeliveryEntity>> {
        const result = await this.deliveryService.findDeliveryById(params.id);

        return {
            status: HttpStatus.OK,
            message: 'message.delivery.success',
            data: result,
        };
    }

    // UPDATE
    @UseGuards(JwtAccessGuard)
    @Patch(':id')
    async updateDelivery(
        @Param() params: UpdateDeliveryParamDto,
        @Body() data: UpdateDeliveryBodyDto,
    ): Promise<ApiResponse<DeliveryEntity>> {
        if (!Object.keys(data).length) {
            throw new BadRequestException('message.delivery.missing-data');
        }

        const result = await this.deliveryService.updateDelivery(
            params.id,
            data,
        );

        return {
            status: HttpStatus.OK,
            message: 'message.delivery.updated',
            data: result,
        };
    }

    // DELETE
    @UseGuards(JwtAccessGuard)
    @Delete(':id')
    async removeDelivery(
        @Param() params: DeleteDeliveryParamDto,
    ): Promise<ApiResponse<null>> {
        await this.deliveryService.removeDelivery(params.id);

        return {
            status: HttpStatus.OK,
            message: 'message.delivery.deleted',
        };
    }
}
