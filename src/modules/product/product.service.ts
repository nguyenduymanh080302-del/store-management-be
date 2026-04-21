import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    CreateProductBodyDto,
    GetProductsQueryDto,
    UpdateProductBodyDto,
} from 'common/dto/product.dto';
import { ImageService } from './image.service';

type UploadedProductFile = {
    buffer: Buffer;
    mimetype?: string;
    originalname?: string;
};

@Injectable()
export class ProductService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly imageService: ImageService,
    ) { }

    private readonly productInclude = {
        images: true,
        units: {
            include: { unit: true },
        },
        category: true,
    };

    /* ---------- CREATE ---------- */
    async createProduct(
        dto: CreateProductBodyDto,
        imageFiles: UploadedProductFile[] = [],
    ) {
        const { images, units, ...productData } = dto;

        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: productData,
            });

            const uploadedUrls = await this.imageService.uploadImages(
                imageFiles,
                images,
            );

            if (uploadedUrls.length) {
                await this.imageService.createProductImages(
                    product.id,
                    uploadedUrls,
                    tx,
                );
            }

            if (units?.length) {
                await tx.productUnit.createMany({
                    data: units.map((u) => ({
                        productId: product.id,
                        unitId: u.unitId,
                        sellPrice: u.sellPrice,
                        vatPercent: u.vatPercent,
                        extraPrices: u.extraPrices,
                    })),
                });
            }

            return tx.product.findUnique({
                where: { id: product.id },
                include: this.productInclude,
            });
        });
    }

    /* ---------- READ ALL ---------- */
    async findAllProduct(query: GetProductsQueryDto) {
        const trimmedSearch = query.search?.trim();
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = trimmedSearch
            ? {
                OR: [
                    {
                        name: {
                            contains: trimmedSearch,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        slug: {
                            contains: trimmedSearch,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        description: {
                            contains: trimmedSearch,
                            mode: 'insensitive' as const,
                        },
                    },
                ],
            }
            : {};

        const [items, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                include: this.productInclude,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: total === 0 ? 0 : Math.ceil(total / limit),
            },
        };
    }

    /* ---------- READ ONE ---------- */
    async findProductById(id: number) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: this.productInclude,
        });

        if (!product) {
            throw new NotFoundException('message.product.not-found');
        }

        return product;
    }

    /* ---------- UPDATE ---------- */
    async updateProduct(
        productId: number,
        dto: UpdateProductBodyDto,
        imageFiles: UploadedProductFile[] = [],
    ) {
        const { images, deleteImageIds, units, ...productData } = dto;

        return this.prisma.$transaction(async (tx) => {
            await tx.product.update({
                where: { id: productId },
                data: productData,
            });

            if (deleteImageIds?.length) {
                await this.imageService.deleteImagesByIds(deleteImageIds);
            }

            const uploadedUrls = await this.imageService.uploadImages(
                imageFiles,
                images,
            );

            if (uploadedUrls.length) {
                await this.imageService.createProductImages(
                    productId,
                    uploadedUrls,
                    tx,
                );
            }

            if (units) {
                await tx.productUnit.deleteMany({
                    where: { productId },
                });

                await tx.productUnit.createMany({
                    data: units.map((u) => ({
                        productId,
                        unitId: u.unitId,
                        sellPrice: u.sellPrice,
                        vatPercent: u.vatPercent,
                        extraPrices: u.extraPrices,
                    })),
                });
            }

            return tx.product.findUnique({
                where: { id: productId },
                include: this.productInclude,
            });
        });
    }

    /* ---------- DELETE ---------- */
    async removeProduct(id: number) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { images: true },
        });

        if (!product) {
            throw new NotFoundException('message.product.not-found');
        }

        await this.imageService.deleteImagesByUrls(
            product.images.map((img) => img.url),
        );

        return this.prisma.product.delete({
            where: { id },
        });
    }
}
