import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountDto } from 'common/dto/account.dto';
import { RoleDto } from 'common/dto/role.dto';
import { compareHash, hashData } from 'common/helper/hash.helper';
import { Request } from 'express';
import { SessionService } from 'modules/session/session.service';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private config: ConfigService, private jwtService: JwtService, private sessionService: SessionService) { }

    async getAccountById(accountId: number) {
        return this.prisma.account.findUnique({
            where: { id: accountId },
            include: {
                role: true
            }
        })
    }

    async getAccountByUsername(username: string) {
        return this.prisma.account.findUnique({
            where: { username: username },
            include: {
                role: true
            }
        })
    }

    async getTokens(accountId: number, sessionId: number, role: RoleDto, permissions: string[]) {
        const payload = {
            sub: accountId,
            sessionId,
            role: role,
            permissions: permissions
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.config.get('ACCESS_TOKEN_SECRET'),
                expiresIn: '1d',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.config.get('REFRESH_TOKEN_SECRET'),
                expiresIn: '30d',
            }),
        ]);

        return { accessToken, refreshToken };
    }


    async signup(payload: Omit<AccountDto, "id">) {

        const checkExistAccount = await this.getAccountByUsername(payload.username)
        if (checkExistAccount) {
            throw new ConflictException('message.account.duplicated');
        }

        const hashedPassword = await hashData(payload.password);
        const newAccount = await this.prisma.account.create({
            data: {
                name: payload.name,
                username: payload.username,
                password: hashedPassword,
                roleId: payload.roleId,
                email: payload.email,
                avatar: payload.avatar,
                phone: payload.phone,
                address: payload.address,
            }
        });
        return { accountId: newAccount.id }
    }

    async signin(payload: Pick<AccountDto, "username" | "password">, req: Request) {
        const { username, password } = payload;

        const account = await this.getAccountByUsername(username)
        if (!account) {
            throw new ForbiddenException('message.account.invalid-credentials');
        }

        const passwordMatched = await compareHash(password, account.password);
        if (!passwordMatched) {
            throw new ForbiddenException('message.account.invalid-credentials');
        }

        const session = await this.sessionService.createEmptySession(
            account.id,
            req,
        );
        const tokens = await this.getTokens(account.id, session.id, { id: account.role.id, name: account.role.name }, account.role.permissions);
        await this.sessionService.attachRefreshToken(
            session.id,
            tokens.refreshToken,
        );

        return tokens;
    }


    async logout(sessionId: number) {
        await this.prisma.session.update({
            where: { id: sessionId },
            data: { revoked: true },
        });
    }


    async refresh(
        accountId: number,
        sessionId: number,
        refreshToken: string,
    ) {
        await this.sessionService.validateSessionForRefresh(
            sessionId,
            refreshToken,
        );
        const account = await this.getAccountById(accountId)
        if (!account)
            throw new UnauthorizedException("message.account.unauthorized")

        const tokens = await this.getTokens(accountId, sessionId, { id: account.role.id, name: account.role.name }, account.role.permissions);
        await this.sessionService.attachRefreshToken(
            sessionId,
            tokens.refreshToken,
        );

        return tokens;
    }

}
