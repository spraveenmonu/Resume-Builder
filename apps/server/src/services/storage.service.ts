import sharp from 'sharp';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3.js';
import { env } from '../config/env.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class StorageService {
  /**
   * Processes image buffer: crops/resizes to max 800px width/height and converts to WebP.
   */
  static async processImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  }

  /**
   * Uploads processed buffer to S3-compatible storage or fallback local uploads folder.
   */
  static async uploadAvatar(buffer: Buffer, userId: string): Promise<string> {
    const processed = await this.processImage(buffer);
    const key = `avatars/${userId}-${crypto.randomBytes(8).toString('hex')}.webp`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
          Body: processed,
          ContentType: 'image/webp',
          ACL: 'public-read',
        })
      );
      return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
    } catch (err: any) {
      console.warn('[StorageService] S3 upload failed, using local uploads fallback:', err.message);
      const localUploadDir = path.resolve(process.cwd(), 'uploads', 'avatars');
      if (!fs.existsSync(localUploadDir)) {
        fs.mkdirSync(localUploadDir, { recursive: true });
      }
      const filename = `${userId}-${Date.now()}.webp`;
      const filePath = path.join(localUploadDir, filename);
      fs.writeFileSync(filePath, processed);
      return `/uploads/avatars/${filename}`;
    }
  }

  /**
   * Deletes avatar file from S3 or local directory.
   */
  static async deleteAvatar(fileUrl: string): Promise<void> {
    try {
      if (fileUrl.startsWith('/uploads/')) {
        const localPath = path.resolve(process.cwd(), fileUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
        return;
      }

      const urlObj = new URL(fileUrl);
      const key = urlObj.pathname.replace(`/${env.S3_BUCKET}/`, '').replace(/^\//, '');

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
        })
      );
    } catch (err: any) {
      console.warn('[StorageService] Failed to delete avatar file:', err.message);
    }
  }
}
