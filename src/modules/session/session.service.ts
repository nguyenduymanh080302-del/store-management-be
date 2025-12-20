import { Injectable, ForbiddenException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { hashData, compareHash } from 'common/helper/hash.helper';
import dayjs from 'dayjs';
import { Request } from 'express';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class SessionService {
    constructor(private prisma: PrismaService) { }

    // ---------------- GET SESSION ----------------
    async getSessionById(sessionId: number) {
        return this.prisma.session.findUnique({
            where: { id: sessionId },
        });
    }

    // ---------------- CREATE EMPTY SESSION ----------------
    async createEmptySession(accountId: number, req: Request) {
        return this.prisma.session.create({
            data: {
                accountId,
                refreshToken: '',
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                expiresAt: dayjs().add(30, 'day').toDate(), // absolute
                lastUsedAt: new Date(),                    // idle start
                revoked: false,
            },
        });
    }

    // ---------------- ATTACH / ROTATE REFRESH TOKEN ----------------
    async attachRefreshToken(sessionId: number, refreshToken: string) {
        return this.prisma.session.update({
            where: { id: sessionId },
            data: {
                refreshToken: await hashData(refreshToken),
                lastUsedAt: new Date(),
            },
        });
    }

    // ---------------- VALIDATE SESSION FOR REFRESH ----------------
    async validateSessionForRefresh(
        sessionId: number,
        refreshToken: string,
    ) {
        const now = new Date();

        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.revoked) {
            throw new ForbiddenException('Access denied');
        }

        // absolute expiry (30 days)
        if (now > session.expiresAt) {
            await this.revokeSession(sessionId);
            throw new ForbiddenException('Session expired');
        }

        // idle timeout (10 days)
        if (dayjs(now).diff(session.lastUsedAt, 'day') >= 10) {
            await this.revokeSession(sessionId);
            throw new ForbiddenException('Session inactive');
        }

        const tokenMatched = await compareHash(
            refreshToken,
            session.refreshToken,
        );

        if (!tokenMatched) {
            // refresh-token reuse protection
            await this.revokeSession(sessionId);
            throw new ForbiddenException('Access denied');
        }

        return session;
    }

    // ---------------- REVOKE SESSION ----------------
    async revokeSession(sessionId: number) {
        await this.prisma.session.update({
            where: { id: sessionId },
            data: { revoked: true },
        });
    }

    // ---------------- CLEANUP JOB ----------------
    // chạy mỗi ngày 03:00 sáng
    @Cron('0 3 * * *')
    async cleanupSessions() {
        const now = new Date();

        await this.prisma.session.deleteMany({
            where: {
                OR: [
                    // revoked session
                    { revoked: true },

                    // absolute expired
                    {
                        expiresAt: {
                            lt: now,
                        },
                    },

                    // idle timeout (10 days)
                    {
                        lastUsedAt: {
                            lt: dayjs(now).subtract(10, 'day').toDate(),
                        },
                    },
                ],
            },
        });
    }
}
