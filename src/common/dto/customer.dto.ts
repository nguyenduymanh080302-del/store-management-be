import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
    IsDefined,
    IsInt,
    IsNotEmpty,
    IsString,
    IsEmail,
    MaxLength,
    IsOptional,
    IsNumber,
    Min,
    Matches,
} from 'class-validator';

/* ---------- PARAM DTO ---------- */

export class GetCustomerParamDto {
    @Type(() => Number)
    @IsDefined({ message: 'message.customer.id-is-required' })
    @IsInt({ message: 'message.customer.id-must-is-number' })
    id: number;
}

/* ---------- CREATE DTO ---------- */

export class CreateCustomerBodyDto {
    @IsDefined({ message: 'message.customer.name-is-required' })
    @IsString({ message: 'message.customer.name-must-is-string' })
    @IsNotEmpty({ message: 'message.customer.name-not-empty' })
    @MaxLength(64, { message: 'message.customer.name-max-length-is-64' })
    name: string;

    @IsDefined({ message: 'message.customer.email-is-required' })
    @IsEmail({}, { message: 'message.customer.email-invalid' })
    @MaxLength(128, { message: 'message.customer.email-max-length-is-128' })
    email: string;

    @IsDefined({ message: 'message.customer.phone-is-required' })
    @IsString({ message: 'message.customer.phone-must-is-string' })
    @IsNotEmpty({ message: 'message.customer.phone-not-empty' })
    @Matches(/^(03|05|07|08|09)\d{8}$/, {
        message: 'message.customer.phone-invalid-vn',
    })
    phone: string;

    @IsDefined({ message: 'message.customer.address-is-required' })
    @IsString({ message: 'message.customer.address-must-is-string' })
    @IsNotEmpty({ message: 'message.customer.address-not-empty' })
    @MaxLength(255, { message: 'message.customer.address-max-length-is-255' })
    address: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'message.customer.debt-must-is-number' })
    @Min(0, { message: 'message.customer.debt-min-is-0' })
    debt?: number;
}

/* ---------- UPDATE DTO ---------- */

export class UpdateCustomerBodyDto extends PartialType(CreateCustomerBodyDto) { }

export class UpdateCustomerParamDto extends GetCustomerParamDto { }

/* ---------- DELETE DTO ---------- */

export class DeleteCustomerParamDto extends GetCustomerParamDto { }
