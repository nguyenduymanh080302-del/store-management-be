import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    deleteImageFromCloudinary,
    uploadImageToCloudinary,
} from 'src/middlewares/cloudinary';

type UploadedProductFile = {
    buffer: Buffer;
    mimetype?: string;
    originalname?: string;
};

@Injectable()
export class ImageService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Upload images to Cloudinary and return the hosted image URLs.
     */
    async uploadImages(
        imageFiles: UploadedProductFile[] = [],
        base64Images: string[] = [],
    ): Promise<string[]> {
        const uploaded = await Promise.all([
            ...imageFiles.map((file) =>
                uploadImageToCloudinary({
                    buffer: file.buffer,
                    mimeType: file.mimetype,
                    originalName: file.originalname,
                }),
            ),
            ...base64Images.map((img) => uploadImageToCloudinary(img)),
        ]);

        return uploaded.filter((url) => url) as string[];
    }

    /**
     * Delete images from Cloudinary by their database IDs.
     */
    async deleteImagesByIds(imageIds: number[]): Promise<void> {
        if (!imageIds.length) return;

        const images = await this.prisma.image.findMany({
            where: { id: { in: imageIds } },
        });

        await Promise.all(
            images.map((img) => deleteImageFromCloudinary(img.url)),
        );

        await this.prisma.image.deleteMany({
            where: { id: { in: imageIds } },
        });
    }

    /**
     * Delete images from Cloudinary by their URLs.
     */
    async deleteImagesByUrls(urls: string[]): Promise<void> {
        if (!urls.length) return;

        await Promise.all(
            urls.map((url) => deleteImageFromCloudinary(url)),
        );
    }

    /**
     * Create image records in database for a product
     */
    async createProductImages(
        productId: number,
        imageUrls: string[],
        prisma?: any,
    ): Promise<void> {
        if (!imageUrls.length) return;

        const imageData = imageUrls.map((url) => ({
            url,
            productId,
        }));

        const client = prisma || this.prisma;
        await client.image.createMany({ data: imageData });
    }
}
