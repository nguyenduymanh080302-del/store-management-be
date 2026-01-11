import { Module } from '@nestjs/common';
import { UnitService } from './supplier.service';
import { UnitController } from './supplier.controller';

@Module({
  controllers: [UnitController],
  providers: [UnitService],
})
export class UnitModule { }
