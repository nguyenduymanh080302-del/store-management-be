import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from 'common/dto/auth.dto';
import { hashData } from 'common/helper/hash.helper';
import { ApiResponse } from 'common/types';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    async getTokens(userId: number, email: string) {
        const payload = { sub: userId, email };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.ACCESS_TOKEN_SECRET,
                expiresIn: '1d',
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.REFRESH_TOKEN_SECRET,
                expiresIn: '30d',
            }),
        ]);
        return { accessToken, refreshToken };
    }

    async signup(payload: SignupDto): Promise<ApiResponse<any>> {

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
        return {
            status: 201,
            message: 'api.message.account.created',
            data: { accountId: newAccount.id },
        };
    }
    signin() { }
    logout() { }
    refresh() { }
}
