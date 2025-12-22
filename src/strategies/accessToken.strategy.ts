import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('ACCESS_TOKEN_SECRET') || "store-management-access-token-secret",
        });
    }

    validate(payload: any) {
        return {
            accountId: payload.sub,
            sessionId: payload.sessionId,
            role: payload.role,
            permissions: payload.permissions,
        };
    }
}
