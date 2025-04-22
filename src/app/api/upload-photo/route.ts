import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { role } = await validateUser(accessToken, 'EMPLOYEE');
    
    if (role !== 'EMPLOYEE' && role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const serviceId = formData.get('serviceId') as string;

    if (!file || !type || !serviceId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `services/${serviceId}/${type}/${Date.now()}-${file.name}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Save photo record to database
    const photo = await prisma.servicePhoto.create({
      data: {
        url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`,
        type: type as any,
        serviceId,
      },
    });

    // Delete old photos if new ones are uploaded
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { photos: true },
    });

    if (service) {
      const oldPhotos = service.photos.filter(p => p.type === type);
      if (oldPhotos.length > 0) {
        // Schedule deletion of old photos after 2 days
        const deleteDate = new Date();
        deleteDate.setDate(deleteDate.getDate() + 2);

        await prisma.$transaction(
          oldPhotos.map(photo =>
            prisma.servicePhoto.update({
              where: { id: photo.id },
              data: { deleteAt: deleteDate },
            })
          )
        );
      }
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error uploading photo:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 