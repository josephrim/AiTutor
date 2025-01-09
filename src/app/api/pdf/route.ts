import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { supabase } from "@/utils/supabase";

const prisma = new PrismaClient();
export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing for file uploads
  },
};

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(
      token.value,
      process.env.AUTH_SECRET!
    ) as JwtPayload;
    const userId = decoded.id;

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("uploads") // Replace with your bucket name
      .upload(`pdfs/${fileName}`, Buffer.from(await file.arrayBuffer()), {
        contentType: "application/pdf",
        upsert: true, // Overwrite existing file
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file." },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(data.path);

    const pdfMetadata = {
      publicUrl,
      uploadedAt: new Date().toISOString(),
    };
    const pdf = await prisma.pDF.create({
      data: {
        userId: userId,
        fileUrl: publicUrl,
        metadata: pdfMetadata,
      },
    });

    return NextResponse.json(pdf);
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
