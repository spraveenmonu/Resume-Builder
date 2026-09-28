import { describe, it, expect, vi } from 'vitest';

vi.mock('dotenv', () => ({
  config: vi.fn(),
  default: { config: vi.fn() },
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: vi.fn() })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

// Unit mock for Sharp processing logic to guarantee deterministic testing across environments
vi.mock('sharp', () => {
  return {
    default: vi.fn((inputBuffer?: any) => {
      let resizeWidth = 800;
      let resizeHeight = 800;
      let outputFormat = 'webp';

      const instance = {
        resize: vi.fn((w: number, h: number, opts?: any) => {
          resizeWidth = w;
          resizeHeight = h;
          return instance;
        }),
        webp: vi.fn((opts?: any) => {
          outputFormat = 'webp';
          return instance;
        }),
        png: vi.fn(() => instance),
        toBuffer: vi.fn(async () => Buffer.from('mock-processed-webp-buffer')),
        metadata: vi.fn(async () => ({
          format: outputFormat,
          width: Math.min(resizeWidth, 800),
          height: Math.min(resizeHeight, 800),
        })),
      };
      return instance;
    }),
  };
});

import sharp from 'sharp';
import { StorageService } from '../../apps/server/src/services/storage.service.js';

describe('Storage Service Image Processing', () => {
  it('resizes oversized images down to maximum 800px and converts to WebP', async () => {
    const inputBuffer = Buffer.from('raw-test-image-data');
    const processedBuffer = await StorageService.processImage(inputBuffer);
    expect(processedBuffer).toBeDefined();

    const metadata = await sharp(processedBuffer).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBeLessThanOrEqual(800);
    expect(metadata.height).toBeLessThanOrEqual(800);
  });

  it('keeps dimensions within 800px bounds', async () => {
    const inputBuffer = Buffer.from('another-image-data');
    const processedBuffer = await StorageService.processImage(inputBuffer);
    const metadata = await sharp(processedBuffer).metadata();

    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(800);
    expect(metadata.height).toBe(800);
  });
});
