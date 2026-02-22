import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// Cloudinary is auto-configured from the CLOUDINARY_URL env var
// Format: cloudinary://api_key:api_secret@cloud_name
cloudinary.config(process.env.CLOUDINARY_URL!);

export async function POST(req: NextRequest) {
  try {
    // Must be authenticated
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Send a multipart/form-data request with a 'file' field." },
        { status: 400 }
      );
    }

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are accepted." },
        { status: 415 }
      );
    }

    // 10 MB limit
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum allowed size is 10 MB." },
        { status: 413 }
      );
    }

    // Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary via upload_stream
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "community-platform/posts",
            resource_type: "image",
            // Limit transformations to safe defaults
            allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
            transformation: [
              { quality: "auto:good" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("Cloudinary upload returned no result"));
            } else {
              resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
          }
        );

        stream.end(buffer);
      }
    );

    return NextResponse.json(
      {
        url: result.secure_url,
        publicId: result.public_id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json(
      { error: "Image upload failed. Please try again." },
      { status: 500 }
    );
  }
}
