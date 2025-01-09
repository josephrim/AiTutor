import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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

    const uploadsDir = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.promises.writeFile(
      filePath,
      Buffer.from(await file.arrayBuffer())
    );

    const pdfMetadata = {
      fileName,
      uploadedAt: new Date().toISOString(),
    };
    const pdf = await prisma.pDF.create({
      data: {
        userId: userId,
        fileUrl: fileName,
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
