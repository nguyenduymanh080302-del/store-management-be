import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'modules/auth/auth.module';
import { OrderModule } from 'modules/order/order.module';
import { SessionModule } from 'modules/session/session.module';
import { PrismaModule } from 'prisma/prisma.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    PrismaModule,
    AuthModule,
    SessionModule,
    OrderModule
  ]
})
export class AppModule { }
