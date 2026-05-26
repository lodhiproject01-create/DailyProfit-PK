import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using secure server-side environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "dailyprofitpk",
  api_key: process.env.CLOUDINARY_API_KEY || "892976939987823",
  api_secret: process.env.CLOUDINARY_API_SECRET || "mNURp-a7R9hL8PqO-TzK7rU4eWs",
  secure: true
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const imageType = formData.get('imageType') || 'general';
    const userId = formData.get('userId') || 'anonymous';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to array buffer and then node Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate size (limit to 5MB for optimized performance)
    if (bytes.byteLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Validate format (only JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file format. Only JPG, PNG, and WEBP are supported' }, { status: 400 });
    }

    // Perform secure upload to Cloudinary with compression & auto-optimizations
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `dailyprofit_pk/${imageType}`,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' } // Compresses automatically and delivers as modern WebP
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      image_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      upload_time: new Date().toISOString(),
      uploaded_by: userId,
      image_type: imageType
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
  }
}
