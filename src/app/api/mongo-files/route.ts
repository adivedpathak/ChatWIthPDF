import { MongoClient, GridFSBucket } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import multer from "multer";
import { Readable } from "stream";
import { promisify } from "util";
import { getAuth } from "@clerk/nextjs/server";

// Setup Multer for file uploads (in-memory storage)
const upload = multer({ storage: multer.memoryStorage() });
const uploadMiddleware = promisify(upload.single("file")); // Convert to async function

// MongoDB connection
const client = new MongoClient("mongodb://localhost:27017");
let db: any, bucket: any;
async function connectMongo() {
  if (!db) {
    await client.connect();
    db = client.db("UPLODED_PDF's");
    bucket = new GridFSBucket(db, { bucketName: "uploads" });
  }
}

// 📌 **Upload File to MongoDB**
export async function POST(req: NextRequest) {
  await connectMongo();

  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse form-data request
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file into readable stream
    const buffer = await file.arrayBuffer();
    const stream = Readable.from(Buffer.from(buffer));

    // Upload to MongoDB GridFS
    const uploadStream = bucket.openUploadStream(file.name);
    stream.pipe(uploadStream);

    return new Promise((resolve, reject) => {
      uploadStream.on("finish", () => {
        resolve(
          NextResponse.json({
            message: "File uploaded successfully",
            fileKey: file.name,
            pdfUrl: `/api/mongo-files?fileKey=${file.name}`,
          })
        );
      });

    uploadStream.on("error", (error: Error) => {
      console.error("Upload Error:", error);
      reject(NextResponse.json({ error: "Internal Server Error" }, { status: 500 }));
    });
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 📌 **Retrieve File from MongoDB**
export async function GET(req: NextRequest) {
  await connectMongo();

  const { searchParams } = new URL(req.url);
  const fileKey = searchParams.get("fileKey");

  if (!fileKey) {
    return NextResponse.json({ error: "File key is required" }, { status: 400 });
  }

  try {
    // Fetch file from MongoDB GridFS
    const downloadStream = bucket.openDownloadStreamByName(fileKey);

    const response = new NextResponse(downloadStream as any);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set("Content-Disposition", `attachment; filename=${fileKey}`);

    return response;
  } catch (error) {
    console.error("Download Error:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}