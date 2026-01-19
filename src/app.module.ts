import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'modules/auth/auth.module';
import { OrderModule } from 'modules/order/order.module';
import { SessionModule } from 'modules/session/session.module';
import { PrismaModule } from 'prisma/prisma.module';
import { CategoryModule } from './modules/category/category.module';
import { UnitModule } from 'modules/unit/unit.module';
import { SupplierModule } from 'modules/supplier/supplier.module';
import { CustomerModule } from 'modules/customer/customer.module';
import { DeliveryModule } from 'modules/delivery/delivery.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    PrismaModule,
    AuthModule,
    SessionModule,
    OrderModule,
    CategoryModule,
    UnitModule,
    SupplierModule,
    CustomerModule,
    DeliveryModule
  ]
})
export class AppModule { }