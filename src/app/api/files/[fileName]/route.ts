import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(req: Request, context: any) {
  try {
    const { fileName } = await context.params;
    const uploadsPath = path.join(process.cwd(), "uploads");

    const filePath = path.join(uploadsPath, fileName);

    const fileExists = await fs.stat(filePath).catch(() => null);
    if (!fileExists) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const fileContent = await fs.readFile(filePath);

    return new Response(fileContent, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Failed to serve file." },
      { status: 500 }
    );
  }
}
