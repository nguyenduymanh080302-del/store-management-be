import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SigninDto, SignupDto } from 'common/dto/auth.dto';
import { compareHash, hashData } from 'common/helper/hash.helper';
import { Request } from 'express';
import { SessionService } from 'modules/session/session.service';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private config: ConfigService, private jwtService: JwtService, private sessionService: SessionService) { }

    async getAccount(username: string) {
        return this.prisma.account.findUnique({
            where: { username: username }
        })
    }

    async getTokens(accountId: number, sessionId: number) {
        const payload = {
            sub: accountId,
            sessionId,
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


    async signup(payload: SignupDto) {

        const checkExistAccount = await this.getAccount(payload.username)
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

    async signin(payload: SigninDto, req: Request) {
        const { username, password } = payload;

        const account = await this.prisma.account.findUnique({
            where: { username },
        });
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
        const tokens = await this.getTokens(account.id, session.id);
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

        const tokens = await this.getTokens(accountId, sessionId);

        await this.sessionService.attachRefreshToken(
            sessionId,
            tokens.refreshToken,
        );

        return tokens;
    }

}
