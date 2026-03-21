import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    CreateProductBodyDto,
    UpdateProductBodyDto,
} from 'common/dto/product.dto';
import { deleteImageFromDrive, uploadImageToDrive } from 'src/middlewares/google-drive';

@Injectable()
export class ProductService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    /* ---------- CREATE ---------- */
    async createProduct(dto: CreateProductBodyDto) {
        const { images, units, ...productData } = dto;

        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: productData,
            });

            // upload images parallel
            if (images?.length) {
                const uploaded = await Promise.all(
                    images.map((img) => uploadImageToDrive(img))
                );

                const imageData = uploaded
                    .filter((id) => id)
                    .map((id) => ({
                        url: id as string,
                        productId: product.id,
                    }));

                if (imageData.length) {
                    await tx.image.createMany({ data: imageData });
                }
            }

            // create product units
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

            return product;
        });
    }

    /* ---------- READ ALL ---------- */
    async findAllProduct() {
        return this.prisma.product.findMany({
            include: {
                images: true,
                units: true,
                category: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /* ---------- READ ONE ---------- */
    async findProductById(id: number) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                images: true,
                units: true,
                category: true,
            },
        });

        if (!product) {
            throw new NotFoundException('message.product.not-found');
        }

        return product;
    }

    /* ---------- UPDATE ---------- */
    async updateProduct(productId: number, dto: UpdateProductBodyDto) {
        const { images, deleteImageIds, units, ...productData } = dto;

        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.update({
                where: { id: productId },
                data: productData,
            });

            // delete images
            if (deleteImageIds?.length) {
                const images = await tx.image.findMany({
                    where: { id: { in: deleteImageIds } },
                });

                await Promise.all(
                    images.map((img) => deleteImageFromDrive(img.url))
                );

                await tx.image.deleteMany({
                    where: { id: { in: deleteImageIds } },
                });
            }

            // upload new images
            if (images?.length) {
                const uploaded = await Promise.all(
                    images.map((img) => uploadImageToDrive(img))
                );

                const imageData = uploaded
                    .filter((id) => id)
                    .map((id) => ({
                        url: id as string,
                        productId,
                    }));

                if (imageData.length) {
                    await tx.image.createMany({ data: imageData });
                }
            }

            // update units
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

            return product;
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

        // delete images from Google Drive
        await Promise.all(
            product.images.map((img) =>
                deleteImageFromDrive(img.url),
            ),
        );

        // delete product (cascade images in DB)
        return this.prisma.product.delete({
            where: { id },
        });
    }

}
