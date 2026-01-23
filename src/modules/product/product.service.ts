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
import { GoogleDriveService } from 'src/google-drive/google-drive.service';

@Injectable()
export class ProductService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly googleDriveService: GoogleDriveService,
    ) { }

    /* ---------- CREATE ---------- */
    async createProduct(data: CreateProductBodyDto) {
        const exists = await this.prisma.product.findUnique({
            where: { slug: data.slug },
        });

        if (exists) {
            throw new ConflictException('message.product.slug-duplicated');
        }

        const { images, units, ...productData } = data;

        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    ...productData,
                    units: units
                        ? {
                            create: units.map((u) => ({
                                unitId: u.unitId,
                                sellPrice: u.sellPrice,
                                vatPercent: u.vatPercent ?? 0,
                            })),
                        }
                        : undefined,
                },
            });

            if (images?.length) {
                const urls = await Promise.all(
                    images.map((img) =>
                        this.googleDriveService.uploadBase64(img.url),
                    ),
                );

                await tx.image.createMany({
                    data: urls.map((url) => ({
                        productId: product.id,
                        url,
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
    async updateProduct(id: number, data: UpdateProductBodyDto) {
        await this.findProductById(id);

        const { images, toDeleteImages, units, ...productData } = data;

        return this.prisma.$transaction(async (tx) => {
            /* ---------- DELETE IMAGES (DB + CLOUD) ---------- */
            if (toDeleteImages?.length) {
                const imagesToDelete = await tx.image.findMany({
                    where: {
                        id: { in: toDeleteImages },
                        productId: id,
                    },
                    select: { id: true, url: true },
                });

                // delete from Google Drive first
                await Promise.all(
                    imagesToDelete.map((img) =>
                        this.googleDriveService.deleteByUrl(img.url),
                    ),
                );

                // then delete from DB
                await tx.image.deleteMany({
                    where: {
                        id: { in: imagesToDelete.map((i) => i.id) },
                    },
                });
            }

            /* ---------- ADD NEW IMAGES ---------- */
            if (images?.length) {
                const urls = await Promise.all(
                    images.map((img) =>
                        this.googleDriveService.uploadBase64(img.url),
                    ),
                );

                await tx.image.createMany({
                    data: urls.map((url) => ({
                        productId: id,
                        url,
                    })),
                });
            }

            /* ---------- UPDATE PRODUCT ---------- */
            return tx.product.update({
                where: { id },
                data: {
                    ...productData,

                    units: units
                        ? {
                            deleteMany: {},
                            create: units.map((u) => ({
                                unitId: u.unitId,
                                sellPrice: u.sellPrice,
                                vatPercent: u.vatPercent ?? 0,
                            })),
                        }
                        : undefined,
                },
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

        // delete images from Google Drive
        await Promise.all(
            product.images.map((img) =>
                this.googleDriveService.deleteByUrl(img.url),
            ),
        );

        // delete product (cascade images in DB)
        return this.prisma.product.delete({
            where: { id },
        });
    }

}
