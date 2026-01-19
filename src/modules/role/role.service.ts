import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
    CreateRoleBodyDto,
    UpdateRoleBodyDto,
} from 'common/dto/role.dto';

@Injectable()
export class RoleService {
    constructor(private prisma: PrismaService) { }

    /* ==================== CREATE ==================== */
    async createRole(payload: CreateRoleBodyDto) {
        // Check duplicate code
        const existedByCode = await this.prisma.role.findUnique({
            where: { code: payload.code },
        });

        if (existedByCode) {
            throw new ConflictException(
                'message.role.code.duplicated',
            );
        }

        // Check duplicate name
        const existedByName = await this.prisma.role.findUnique({
            where: { name: payload.name },
        });

        if (existedByName) {
            throw new ConflictException(
                'message.role.name.duplicated',
            );
        }

        return this.prisma.role.create({
            data: {
                code: payload.code,
                name: payload.name,
                permissions: payload.permissions ?? [],
            },
        });
    }

    /* ==================== READ ALL ==================== */
    async findAllRole() {
        return this.prisma.role.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    /* ==================== READ ONE ==================== */
    async findRoleById(id: number) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });

        if (!role || !role.isActive) {
            throw new NotFoundException(
                'message.role.not-found',
            );
        }

        return role;
    }

    /* ==================== UPDATE ==================== */
    async updateRole(id: number, payload: UpdateRoleBodyDto) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });

        if (!role || !role.isActive) {
            throw new NotFoundException(
                'message.role.not-found',
            );
        }

        // Check duplicate code
        if (payload.code) {
            const existedCode = await this.prisma.role.findFirst({
                where: {
                    code: payload.code,
                    NOT: { id },
                },
            });

            if (existedCode) {
                throw new ConflictException(
                    'message.role.code.duplicated',
                );
            }
        }

        return this.prisma.role.update({
            where: { id },
            data: {
                ...payload,
            },
        });
    }

    /* ==================== DELETE (SOFT) ==================== */
    async removeRole(id: number) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });

        if (!role || !role.isActive) {
            throw new NotFoundException(
                'message.role.not-found',
            );
        }

        // Check role is being used
        const usedCount = await this.prisma.account.count({
            where: { roleId: id },
        });

        if (usedCount > 0) {
            throw new BadRequestException(
                'message.role.in-use',
            );
        }

        await this.prisma.role.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
