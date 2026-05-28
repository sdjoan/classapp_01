import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "이미지 파일이 없습니다." }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const mimeType = file.type || "image/jpeg";
      let img;

      if (mimeType === "image/png") {
        img = await pdfDoc.embedPng(bytes);
      } else {
        img = await pdfDoc.embedJpg(bytes);
      }

      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="output.pdf"',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "변환 중 오류가 발생했습니다." }, { status: 500 });
  }
}
