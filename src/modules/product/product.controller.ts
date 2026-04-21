import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
    CreateProductBodyDto,
    DeleteProductParamDto,
    GetProductParamDto,
    GetProductsQueryDto,
    UpdateProductBodyDto,
    UpdateProductParamDto,
} from 'common/dto/product.dto';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from 'src/types';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
    constructor(
        private readonly productService: ProductService,
    ) { }

    private normalizeProductBody(data: Record<string, any>) {
        const normalized = { ...data };

        if (typeof normalized.categoryId === 'string') {
            normalized.categoryId = Number(normalized.categoryId);
        }

        if (typeof normalized.isActive === 'string') {
            normalized.isActive = normalized.isActive === 'true';
        }

        if (typeof normalized.units === 'string') {
            normalized.units = JSON.parse(normalized.units);
        }

        if (typeof normalized.deleteImageIds === 'string') {
            normalized.deleteImageIds = JSON.parse(normalized.deleteImageIds);
        }

        if (
            typeof normalized.images === 'string' &&
            normalized.images.trim().startsWith('[')
        ) {
            normalized.images = JSON.parse(normalized.images);
        }

        return normalized;
    }

    private validatePayload<T extends object>(
        dtoClass: new () => T,
        data: Record<string, any>,
    ): T {
        let normalized: Record<string, any>;

        try {
            normalized = this.normalizeProductBody(data);
        } catch {
            throw new BadRequestException({
                status: HttpStatus.BAD_REQUEST,
                message: 'message.validation-failed',
            });
        }

        const dto = plainToInstance(dtoClass, normalized);
        const errors = validateSync(dto as object, {
            whitelist: true,
            forbidNonWhitelisted: true,
            stopAtFirstError: true,
        });

        if (errors.length) {
            const firstError = errors[0];
            const firstMessage =
                firstError &&
                firstError.constraints &&
                Object.values(firstError.constraints)[0];

            throw new BadRequestException({
                status: HttpStatus.BAD_REQUEST,
                message: firstMessage ?? 'message.validation-failed',
            });
        }

        return dto;
    }

    @UseGuards(JwtAccessGuard)
    @Post()
    @UseInterceptors(
        FilesInterceptor('images', 5, {
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async createProduct(
        @Body() rawData: Record<string, any>,
        @UploadedFiles() imageFiles: any[] = [],
    ): Promise<ApiResponse<any>> {
        const data = this.validatePayload(CreateProductBodyDto, rawData);
        const result = await this.productService.createProduct(
            data,
            imageFiles,
        );

        return {
            status: HttpStatus.CREATED,
            message: 'message.product.created',
            data: result,
        };
    }

    @Get()
    async findAllProduct(
        @Query() query: GetProductsQueryDto,
    ): Promise<ApiResponse<any>> {
        const result = await this.productService.findAllProduct(query);

        return {
            status: HttpStatus.OK,
            message: 'message.product.success',
            data: result,
        };
    }

    @Get(':id')
    async findProductById(
        @Param() params: GetProductParamDto,
    ): Promise<ApiResponse<any>> {
        const result = await this.productService.findProductById(
            params.id,
        );

        return {
            status: HttpStatus.OK,
            message: 'message.product.success',
            data: result,
        };
    }

    @UseGuards(JwtAccessGuard)
    @Patch(':id')
    @UseInterceptors(
        FilesInterceptor('images', 5, {
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async updateProduct(
        @Param() params: UpdateProductParamDto,
        @Body() rawData: Record<string, any>,
        @UploadedFiles() imageFiles: any[] = [],
    ): Promise<ApiResponse<any>> {
        const data = this.validatePayload(UpdateProductBodyDto, rawData);

        if (
            Object.keys(data).length === 0 &&
            imageFiles.length === 0
        ) {
            throw new BadRequestException('message.product.missing-data');
        }

        const result = await this.productService.updateProduct(
            params.id,
            data,
            imageFiles,
        );

        return {
            status: HttpStatus.OK,
            message: 'message.product.updated',
            data: result,
        };
    }

    @UseGuards(JwtAccessGuard)
    @Delete(':id')
    async removeProduct(
        @Param() params: DeleteProductParamDto,
    ): Promise<ApiResponse<null>> {
        await this.productService.removeProduct(params.id);

        return {
            status: HttpStatus.OK,
            message: 'message.product.deleted',
        };
    }
}
