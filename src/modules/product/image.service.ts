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
    /**
     * Constructs the ImageService instance.
     *
     * @param prisma Database service instance for Prisma ORM.
     */
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Uploads file buffers and base64 strings to Cloudinary and returns hosted image URLs.
     *
     * @param imageFiles Array of uploaded file objects containing buffer, mimetype, and originalname.
     * @param base64Images Array of base64-encoded image strings to upload.
     * @returns Array of uploaded image URLs.
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
     * Deletes images from Cloudinary and removes their database records by image IDs.
     *
     * @param imageIds Array of database image IDs to delete.
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
     * Deletes images from Cloudinary by their hosted URLs.
     *
     * @param urls Array of Cloudinary image URLs to delete.
     */
    async deleteImagesByUrls(urls: string[]): Promise<void> {
        if (!urls.length) return;

        await Promise.all(
            urls.map((url) => deleteImageFromCloudinary(url)),
        );
    }

    /**
     * Creates database image records associated with a product.
     *
     * @param productId The ID of the product the images belong to.
     * @param imageUrls Array of image URLs to save in database.
     * @param prisma Optional Prisma client or transaction instance.
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
