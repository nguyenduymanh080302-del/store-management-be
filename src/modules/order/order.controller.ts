import { Controller, Get, HttpStatus, UseGuards } from "@nestjs/common";
import { Permissions } from "common/decorators/permission.decorator";
import { JwtAccessGuard } from "common/guards/jwt-access.guard";
import { ApiResponse } from "src/types";
import { Permission } from "utils/enum";

@UseGuards(JwtAccessGuard)
@Controller('order')
export class OrderController {
    constructor() {

    }

    @Permissions(Permission.MANAGE_SALES)
    @Get("")
    async getOrderList(): Promise<ApiResponse<any>> {
        return {
            status: HttpStatus.OK,
            message: 'message.order.ok',
        };
    }
}