// common/guards/permission.guard.ts
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'common/decorators/permission.decorator';
import { Permission } from 'utils/enum';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions =
            this.reflector.getAllAndOverride<Permission[]>(
                PERMISSIONS_KEY,
                [context.getHandler(), context.getClass()],
            );

        // No permission required → allow
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !Array.isArray(user.permissions)) {
            throw new ForbiddenException('Permission denied');
        }

        const hasPermission = requiredPermissions.some(permission =>
            user.permissions.includes(permission),
        );

        if (!hasPermission) {
            throw new ForbiddenException('Permission denied');
        }

        return true;
    }
}
