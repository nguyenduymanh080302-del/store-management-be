// src/services/googleDrive.service.ts
import { google } from "googleapis";
import stream from "stream";

const CLIENT_ID = process.env.GOOGLE_API_CLIENT_ID as string;
const CLIENT_SECRET = process.env.GOOGLE_API_CLIENT_SECRET as string;
const REDIRECT_URI = process.env.GOOGLE_API_REDIRECT_URI as string;
const REFRESH_TOKEN = process.env.GOOGLE_API_REFRESH_TOKEN as string;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
});

const drive = google.drive({
    version: "v3",
    auth: oauth2Client,
});

export const uploadImageToDrive = async (imageBase64: string): Promise<string | null> => {
    try {
        // Tách phần dữ liệu base64
        if (!imageBase64) {
            throw new Error("Chưa có ảnh");
        }
        const uploadImg = imageBase64.split(/,(.+)/)[1];
        if (!uploadImg) throw new Error("Ảnh không hợp lệ, chỉ cho phép (jpg, pnd, webp)");

        // Convert base64 → Buffer
        const buf = Buffer.from(uploadImg, "base64");
        const bs = new stream.PassThrough();
        bs.end(buf);

        // Upload lên Google Drive
        const response = await drive.files.create({
            requestBody: {
                name: Date.now().toString(),
                parents: [process.env.DRIVE_IMAGE_FOLDER as string],
            },
            media: {
                mimeType: "image/jpeg",
                body: bs,
            },
        });

        return response.data.id || "1MgJNgYu3nOu4jfpeEhwrtiflEos6soDR";
    } catch (error) {
        console.error("Upload image failed:", error);
        return null;
    }
};

export const deleteImageFromDrive = async (imageID: string): Promise<number | null> => {
    try {
        const response = await drive.files.delete({
            fileId: imageID,
        });
        return response.status;
    } catch (error) {
        console.error("Delete image failed:", error);
        return null;
    }
};
