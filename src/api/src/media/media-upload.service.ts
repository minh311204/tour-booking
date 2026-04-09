import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { v2 as cloudinary } from 'cloudinary'
import { randomBytes } from 'node:crypto'
import { Readable } from 'node:stream'

@Injectable()
export class MediaUploadService {
  constructor(private readonly config: ConfigService) {}

  private get provider(): 'cloudinary' | 's3' | 'none' {
    const p = (this.config.get<string>('MEDIA_PROVIDER') ?? '').toLowerCase()
    if (p === 'cloudinary' || p === 's3') return p
    return 'none'
  }

  isConfigured(): boolean {
    if (this.provider === 'cloudinary') {
      return !!(
        this.config.get('CLOUDINARY_CLOUD_NAME') &&
        this.config.get('CLOUDINARY_API_KEY') &&
        this.config.get('CLOUDINARY_API_SECRET')
      )
    }
    if (this.provider === 's3') {
      return !!(
        this.config.get('AWS_REGION') &&
        this.config.get('AWS_S3_BUCKET') &&
        this.config.get('AWS_ACCESS_KEY_ID') &&
        this.config.get('AWS_SECRET_ACCESS_KEY')
      )
    }
    return false
  }

  async uploadImage(
    buffer: Buffer,
    mimetype: string,
    originalName: string,
  ): Promise<{ url: string }> {
    if (this.provider === 'none' || !this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình upload: đặt MEDIA_PROVIDER=cloudinary hoặc s3 và biến môi trường tương ứng.',
      )
    }
    if (this.provider === 'cloudinary') {
      return this.uploadCloudinary(buffer)
    }
    return this.uploadS3(buffer, mimetype, originalName)
  }

  private async uploadCloudinary(buffer: Buffer): Promise<{ url: string }> {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    })
    const folder =
      this.config.get<string>('CLOUDINARY_FOLDER') ?? 'tour-booking/admin'
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (err, result) => {
          if (err || !result?.secure_url) {
            reject(err ?? new Error('Cloudinary upload failed'))
            return
          }
          resolve({ url: result.secure_url })
        },
      )
      Readable.from(buffer).pipe(stream)
    })
  }

  private async uploadS3(
    buffer: Buffer,
    mimetype: string,
    originalName: string,
  ): Promise<{ url: string }> {
    const region = this.config.get<string>('AWS_REGION')!
    const bucket = this.config.get<string>('AWS_S3_BUCKET')!
    const prefix =
      this.config.get<string>('AWS_S3_KEY_PREFIX') ?? 'tour-booking/admin'
    const ext = originalName.includes('.')
      ? originalName.slice(originalName.lastIndexOf('.'))
      : ''
    const safeExt = ext.length <= 8 ? ext : ''
    const key = `${prefix}/${Date.now()}-${randomBytes(8).toString('hex')}${safeExt}`

    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    })
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        CacheControl: 'max-age=31536000',
      }),
    )
    const publicBase = this.config.get<string>('AWS_S3_PUBLIC_BASE_URL')
    const url = publicBase
      ? `${publicBase.replace(/\/$/, '')}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    return { url }
  }
}
