import { createHash } from 'crypto';

type CloudinaryUploadInput =
    | string
    | {
        buffer: Buffer;
        mimeType?: string;
        originalName?: string;
    };

type CloudinaryEnv = {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder?: string;
};

type CloudinaryDestroyResponse = {
    result?: string;
};

type CloudinaryUploadResponse = {
    secure_url?: string;
};

const getCloudinaryEnv = (): CloudinaryEnv => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const folder = process.env.CLOUDINARY_FOLDER;

    const missing = [
        ['CLOUDINARY_CLOUD_NAME', cloudName],
        ['CLOUDINARY_API_KEY', apiKey],
        ['CLOUDINARY_API_SECRET', apiSecret],
    ]
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length) {
        throw new Error(
            `Cloudinary is not configured. Missing env vars: ${missing.join(', ')}`,
        );
    }

    return {
        cloudName,
        apiKey,
        apiSecret,
        folder,
    } as CloudinaryEnv;
};

const createSignature = (
    params: Record<string, string | number | boolean>,
    apiSecret: string,
): string => {
    const payload = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    return createHash('sha1')
        .update(`${payload}${apiSecret}`)
        .digest('hex');
};

const getPublicIdFromUrl = (url: string): string | null => {
    try {
        const parsedUrl = new URL(url);
        const uploadMarker = '/upload/';
        const uploadIndex = parsedUrl.pathname.indexOf(uploadMarker);

        if (uploadIndex === -1) {
            return null;
        }

        const assetPath = parsedUrl.pathname.slice(uploadIndex + uploadMarker.length);
        const segments = assetPath.split('/').filter(Boolean);

        if (!segments.length) {
            return null;
        }

        if (/^v\d+$/.test(segments[0])) {
            segments.shift();
        }

        const publicIdWithExtension = segments.join('/');
        return publicIdWithExtension.replace(/\.[^.]+$/, '');
    } catch {
        return null;
    }
};

export const uploadImageToCloudinary = async (
    input: CloudinaryUploadInput,
): Promise<string | null> => {
    try {
        const { cloudName, apiKey, apiSecret, folder } = getCloudinaryEnv();
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureParams: Record<string, string | number | boolean> = {
            timestamp,
        };
        const formData = new FormData();

        if (folder) {
            signatureParams.folder = folder;
        }

        const signature = createSignature(signatureParams, apiSecret);

        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        if (folder) {
            formData.append('folder', folder);
        }

        if (typeof input === 'string') {
            if (!input) {
                throw new Error('Image is required');
            }

            formData.append('file', input);
        } else {
            if (!input.buffer?.length) {
                throw new Error('Image buffer is required');
            }

            const mimeType = input.mimeType || 'image/jpeg';
            const dataUri = `data:${mimeType};base64,${input.buffer.toString('base64')}`;

            formData.append('file', dataUri);
        }

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            },
        );

        const data = await response.json() as CloudinaryUploadResponse & { error?: { message?: string } };

        if (!response.ok) {
            throw new Error(data.error?.message || 'Cloudinary upload failed');
        }

        return data.secure_url || null;
    } catch (error) {
        console.error('Upload image failed:', error);
        return null;
    }
};

export const deleteImageFromCloudinary = async (
    imageUrl: string,
): Promise<string | null> => {
    try {
        const publicId = getPublicIdFromUrl(imageUrl);

        if (!publicId) {
            throw new Error('Invalid Cloudinary image URL');
        }

        const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = createSignature(
            {
                invalidate: true,
                public_id: publicId,
                timestamp,
            },
            apiSecret,
        );

        const body = new URLSearchParams({
            api_key: apiKey,
            invalidate: 'true',
            public_id: publicId,
            signature,
            timestamp: timestamp.toString(),
        });

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body,
            },
        );

        const data = await response.json() as CloudinaryDestroyResponse & { error?: { message?: string } };

        if (!response.ok) {
            throw new Error(data.error?.message || 'Cloudinary delete failed');
        }

        return data.result || null;
    } catch (error) {
        console.error('Delete image failed:', error);
        return null;
    }
};
