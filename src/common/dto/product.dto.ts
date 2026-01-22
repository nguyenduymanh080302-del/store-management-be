import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import {
    IsDefined,
    IsInt,
    IsNotEmpty,
    IsString,
    MaxLength,
    IsOptional,
    IsBoolean,
    IsArray,
    ValidateNested,
    IsNumber,
    Min,
} from "class-validator";

/* ---------- PARAM DTO ---------- */

export class GetProductParamDto {
    @Type(() => Number)
    @IsDefined({ message: 'message.product.id-is-required' })
    @IsInt({ message: 'message.product.id-must-is-number' })
    id: number;
}

/* ---------- IMAGE DTO ---------- */

export class ProductImageDto {
    @IsDefined({ message: 'message.product.image.url-is-required' })
    @IsString({ message: 'message.product.image.url-must-is-string' })
    @IsNotEmpty({ message: 'message.product.image.url-not-empty' })
    url: string;
}

/* ---------- PRODUCT UNIT DTO ---------- */

export class ProductUnitDto {
    @Type(() => Number)
    @IsDefined({ message: 'message.product.unit.unit-id-is-required' })
    @IsInt({ message: 'message.product.unit.unit-id-must-is-number' })
    unitId: number;

    @Type(() => Number)
    @IsDefined({ message: 'message.product.unit.import-price-is-required' })
    @IsNumber({}, { message: 'message.product.unit.import-price-must-is-number' })
    @Min(0, { message: 'message.product.unit.import-price-min-is-0' })
    importPrice: number;

    @Type(() => Number)
    @IsDefined({ message: 'message.product.unit.sell-price-is-required' })
    @IsNumber({}, { message: 'message.product.unit.sell-price-must-is-number' })
    @Min(0, { message: 'message.product.unit.sell-price-min-is-0' })
    sellPrice: number;

    @Type(() => Number)
    @IsDefined({ message: 'message.product.unit.vat-percent-is-required' })
    @IsNumber({}, { message: 'message.product.unit.vat-percent-must-is-number' })
    @Min(0, { message: 'message.product.unit.vat-percent-min-is-0' })
    vatPercent: number;
}

/* ---------- BODY DTO ---------- */

export class CreateProductBodyDto {
    @IsDefined({ message: 'message.product.name-is-required' })
    @IsString({ message: 'message.product.name-must-is-string' })
    @IsNotEmpty({ message: 'message.product.name-not-empty' })
    @MaxLength(128, { message: 'message.product.name-max-length-is-128' })
    name: string;

    @IsDefined({ message: 'message.product.slug-is-required' })
    @IsString({ message: 'message.product.slug-must-is-string' })
    @IsNotEmpty({ message: 'message.product.slug-not-empty' })
    @MaxLength(128, { message: 'message.product.slug-max-length-is-128' })
    slug: string;

    @IsDefined({ message: 'message.product.description-is-required' })
    @IsString({ message: 'message.product.description-must-is-string' })
    @IsNotEmpty({ message: 'message.product.description-not-empty' })
    description: string;

    @Type(() => Number)
    @IsDefined({ message: 'message.product.category-id-is-required' })
    @IsInt({ message: 'message.product.category-id-must-is-number' })
    categoryId: number;

    @IsOptional()
    @IsBoolean({ message: 'message.product.is-active-must-is-boolean' })
    isActive?: boolean;

    @IsOptional()
    @IsArray({ message: 'message.product.images-must-is-array' })
    @ValidateNested({ each: true })
    @Type(() => ProductImageDto)
    images?: ProductImageDto[];

    @IsOptional()
    @IsArray({ message: 'message.product.units-must-is-array' })
    @ValidateNested({ each: true })
    @Type(() => ProductUnitDto)
    units?: ProductUnitDto[];
}

/* ---------- UPDATE / DELETE ---------- */

export class UpdateProductBodyDto extends PartialType(CreateProductBodyDto) { }
export class UpdateProductParamDto extends GetProductParamDto { }
export class DeleteProductParamDto extends GetProductParamDto { }
