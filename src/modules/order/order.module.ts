import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { OrderController } from './order.controller';

@Module({
    imports: [
        PrismaModule
    ],
    controllers: [OrderController],
    providers: [],
})
export class OrderModule { }
