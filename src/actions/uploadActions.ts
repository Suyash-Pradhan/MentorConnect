
'use server';

import cloudinary from '@/lib/cloudinary';
import streamifier from 'streamifier';
import {v4 as uuidv4} from 'uuid';


interface UploadResult {
  url?: string;
  error?: string;
  public_id?: string;
}

export async function uploadImageAction(
  formData: FormData
): Promise<UploadResult> {
  const file = formData.get('file') as File;

  if (!file) {
    return { error: 'No file provided.' };
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Cloudinary environment variables are not set.');
    return { error: 'Image upload service is not configured.' };
  }
  
  // Check file size (e.g., 5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File is too large. Maximum 5MB allowed.'};
  }

  // Check file type
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedImageTypes.includes(file.type)) {
    return { error: 'Invalid file type. Only JPG, PNG, GIF, WebP are allowed.' };
  }


  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const publicId = `mentorconnect/${file.name.split('.')[0]}_${uuidv4()}`;

    return new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image', // Explicitly image
          folder: 'mentorconnect_uploads', // Optional: organize in Cloudinary
          public_id: publicId,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            reject({ error: 'Image upload failed due to a server error.' });
          } else if (result) {
            resolve({ url: result.secure_url, public_id: result.public_id });
          } else {
            reject({ error: 'Image upload failed, no result from Cloudinary.' });
          }
        }
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  } catch (error) {
    console.error('Error processing file for upload:', error);
    return { error: 'Failed to process file for upload.' };
  }
}
