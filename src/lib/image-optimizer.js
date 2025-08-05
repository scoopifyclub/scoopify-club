import sharp from 'sharp';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'scoopify-bucket';
const CDN_DOMAIN = process.env.CDN_DOMAIN || `https://${BUCKET_NAME}.s3.amazonaws.com`;

export class ImageOptimizer {
  static async optimizeImage(buffer, options = {}) {
    const {
      width = 800,
      height = 600,
      quality = 80,
      format = 'webp',
      fit = 'cover'
    } = options;

    try {
      let image = sharp(buffer);

      // Resize image
      image = image.resize(width, height, { fit });

      // Convert to specified format
      switch (format) {
        case 'webp':
          image = image.webp({ quality });
          break;
        case 'jpeg':
        case 'jpg':
          image = image.jpeg({ quality });
          break;
        case 'png':
          image = image.png({ quality });
          break;
        default:
          image = image.webp({ quality });
      }

      return await image.toBuffer();
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw error;
    }
  }

  static async uploadToS3(buffer, key, contentType) {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      });

      await s3Client.send(command);
      return `${CDN_DOMAIN}/${key}`;
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw error;
    }
  }

  static async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw error;
    }
  }

  static generateThumbnail(buffer, size = 150) {
    return this.optimizeImage(buffer, {
      width: size,
      height: size,
      quality: 70,
      format: 'webp',
      fit: 'cover'
    });
  }

  static async processAndUploadImage(file, options = {}) {
    const {
      folder = 'uploads',
      generateThumbnail = true,
      thumbnailSize = 150
    } = options;

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${randomId}.${extension}`;
      
      // Optimize main image
      const optimizedBuffer = await this.optimizeImage(file.buffer, options);
      const mainKey = `${folder}/${filename}`;
      const mainUrl = await this.uploadToS3(optimizedBuffer, mainKey, file.mimetype);

      let thumbnailUrl = null;
      
      // Generate thumbnail if requested
      if (generateThumbnail) {
        const thumbnailBuffer = await this.generateThumbnail(file.buffer, thumbnailSize);
        const thumbnailKey = `${folder}/thumbnails/${filename}`;
        thumbnailUrl = await this.uploadToS3(thumbnailBuffer, thumbnailKey, file.mimetype);
      }

      return {
        originalUrl: mainUrl,
        thumbnailUrl,
        filename,
        size: optimizedBuffer.length,
        width: options.width || 800,
        height: options.height || 600
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
    }
  }
}

// Utility function for Next.js Image component
export function getOptimizedImageUrl(key, options = {}) {
  const { width = 800, height = 600, quality = 80 } = options;
  
  // If using a CDN like CloudFront, you can add transformation parameters
  if (process.env.CDN_DOMAIN && process.env.CDN_DOMAIN.includes('cloudfront')) {
    return `${process.env.CDN_DOMAIN}/${key}?w=${width}&h=${height}&q=${quality}`;
  }
  
  return `${CDN_DOMAIN}/${key}`;
} 