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
    Query,
    UseGuards,
} from '@nestjs/common';
import { GetUser } from 'common/decorators/account.decorator';
import { Permissions } from 'common/decorators/permission.decorator';
import {
    CreateOrderBodyDto,
    DeleteOrderParamDto,
    GetOrderParamDto,
    GetOrdersQueryDto,
    UpdateOrderBodyDto,
    UpdateOrderParamDto,
} from 'common/dto/order.dto';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';
import { PermissionGuard } from 'common/guards/permission.guard';
import { ApiResponse } from 'src/types';
import { Permission } from 'utils/enum';
import { OrderService } from './order.service';

@Controller('order')
@UseGuards(JwtAccessGuard, PermissionGuard)
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
    ) { }

    @Permissions(Permission.MANAGE_SALES)
    @Post()
    async createOrder(
        @Body() data: CreateOrderBodyDto,
        @GetUser('accountId') accountId: number,
    ): Promise<ApiResponse<any>> {
        const result = await this.orderService.createOrder(
            data,
            accountId,
        );

        return {
            status: HttpStatus.CREATED,
            message: 'message.order.created',
            data: result,
        };
    }

    @Permissions(Permission.MANAGE_SALES)
    @Get()
    async findAllOrder(
        @Query() query: GetOrdersQueryDto,
    ): Promise<ApiResponse<any>> {
        const result = await this.orderService.findAllOrder(query);

        return {
            status: HttpStatus.OK,
            message: 'message.order.success',
            data: result,
        };
    }

    @Permissions(Permission.MANAGE_SALES)
    @Get(':id')
    async findOrderById(
        @Param() params: GetOrderParamDto,
    ): Promise<ApiResponse<any>> {
        const result = await this.orderService.findOrderById(
            params.id,
        );

        return {
            status: HttpStatus.OK,
            message: 'message.order.success',
            data: result,
        };
    }

    @Permissions(Permission.MANAGE_SALES)
    @Patch(':id')
    async updateOrder(
        @Param() params: UpdateOrderParamDto,
        @Body() data: UpdateOrderBodyDto,
    ): Promise<ApiResponse<any>> {
        if (!Object.keys(data).length) {
            throw new BadRequestException(
                'message.order.missing-data',
            );
        }

        const result = await this.orderService.updateOrder(
            params.id,
            data,
        );

        return {
            status: HttpStatus.OK,
            message: 'message.order.updated',
            data: result,
        };
    }

    @Permissions(Permission.MANAGE_SALES)
    @Delete(':id')
    async removeOrder(
        @Param() params: DeleteOrderParamDto,
    ): Promise<ApiResponse<null>> {
        await this.orderService.removeOrder(params.id);

        return {
            status: HttpStatus.OK,
            message: 'message.order.deleted',
        };
    }
}
