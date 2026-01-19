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
import { RoleService } from './role.service';
import { ApiResponse } from 'src/types';
import {
    CreateRoleBodyDto,
    DeleteRoleParamDto,
    GetRoleParamDto,
    UpdateRoleBodyDto,
    UpdateRoleParamDto,
} from 'common/dto/role.dto';
import { RoleEntity } from 'common/entities/role.entity';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';
import { PermissionGuard } from 'common/guards/permission.guard';
import { Permissions } from 'common/decorators/permission.decorator';
import { Permission } from 'utils/enum';

@Controller('role')
export class RoleController {
    constructor(private readonly roleService: RoleService) { }

    /* ---------- CREATE ---------- */
    @UseGuards(JwtAccessGuard, PermissionGuard)
    @Permissions(Permission.MANAGE_ACCOUNT)
    @Post()
    async createRole(
        @Body() data: CreateRoleBodyDto,
    ): Promise<ApiResponse<RoleEntity>> {
        const result = await this.roleService.createRole(data);

        return {
            status: HttpStatus.CREATED,
            message: 'message.role.created',
            data: result,
        };
    }

    /* ---------- READ ALL ---------- */
    @Get()
    async findAllRole(): Promise<ApiResponse<RoleEntity[]>> {
        const result = await this.roleService.findAllRole();

        return {
            status: HttpStatus.OK,
            message: 'message.role.success',
            data: result,
        };
    }

    /* ---------- READ ONE ---------- */
    @Get(':id')
    async findRoleById(
        @Param() params: GetRoleParamDto,
    ): Promise<ApiResponse<RoleEntity>> {
        const result = await this.roleService.findRoleById(params.id);

        return {
            status: HttpStatus.OK,
            message: 'message.role.success',
            data: result,
        };
    }

    /* ---------- UPDATE ---------- */
    @UseGuards(JwtAccessGuard, PermissionGuard)
    @Permissions(Permission.MANAGE_ACCOUNT)
    @Patch(':id')
    async updateRole(
        @Param() params: UpdateRoleParamDto,
        @Body() data: UpdateRoleBodyDto,
    ): Promise<ApiResponse<RoleEntity>> {
        if (!Object.keys(data).length) {
            throw new BadRequestException(
                'message.role.missing-data',
            );
        }

        const result = await this.roleService.updateRole(
            params.id,
            data,
        );

        return {
            status: HttpStatus.OK,
            message: 'message.role.updated',
            data: result,
        };
    }

    /* ---------- DELETE ---------- */
    @UseGuards(JwtAccessGuard, PermissionGuard)
    @Permissions(Permission.MANAGE_ACCOUNT)
    @Delete(':id')
    async removeRole(
        @Param() params: DeleteRoleParamDto,
    ): Promise<ApiResponse<null>> {
        await this.roleService.removeRole(params.id);

        return {
            status: HttpStatus.OK,
            message: 'message.role.deleted',
        };
    }
}
