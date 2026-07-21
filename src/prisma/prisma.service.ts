import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    /**
     * Initializes the Prisma database client with a PostgreSQL adapter.
     *
     * @param config The NestJS ConfigService instance used to retrieve environment variables such as DATABASE_URL.
     */
    constructor(config: ConfigService) {

        const adapter = new PrismaPg({
            connectionString: config.get('DATABASE_URL'),
        })
        super({ adapter });
    }

    /**
     * NestJS module initialization lifecycle hook that connects to the database.
     */
    async onModuleInit() {
        await this.$connect();
    }

    /**
     * NestJS module destruction lifecycle hook that disconnects from the database.
     */
    async onModuleDestroy() {
        await this.$disconnect();
    }
}
