import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDefined,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

/* =========================
   PARAM DTO
========================= */

export class GetPaymentMethodParamDto {
    @Type(() => Number)
    @IsDefined({ message: 'message.payment-method.id-is-required' })
    @IsInt({ message: 'message.payment-method.id-must-is-number' })
    id: number;
}

/* =========================
   CREATE DTO
========================= */

export class CreatePaymentMethodBodyDto {
    @IsDefined({ message: 'message.payment-method.name-is-required' })
    @IsString({ message: 'message.payment-method.name-must-is-string' })
    @IsNotEmpty({ message: 'message.payment-method.name-not-empty' })
    @MaxLength(32, {
        message: 'message.payment-method.name-max-length-is-32',
    })
    name: string;

    @IsOptional()
    @IsBoolean({
        message: 'message.payment-method.is-active-must-is-boolean',
    })
    isActive?: boolean;
}

/* =========================
   UPDATE DTO
========================= */

export class UpdatePaymentMethodBodyDto extends PartialType(
    CreatePaymentMethodBodyDto,
) { }

export class UpdatePaymentMethodParamDto extends GetPaymentMethodParamDto { }
export class DeletePaymentMethodParamDto extends GetPaymentMethodParamDto { }
