import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.json() as { studentName?: string; term?: string; summary?: string };
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText("Crestview International School", { x: 56, y: 780, size: 18, font, color: rgb(0.1, 0.22, 0.55) });
  page.drawText(`Report: ${payload.studentName ?? "Student"}`, { x: 56, y: 742, size: 14, font });
  page.drawText(`Term: ${payload.term ?? "Current Term"}`, { x: 56, y: 718, size: 12, font });
  page.drawText(payload.summary ?? "Academic summary pending review.", { x: 56, y: 680, size: 11, font, maxWidth: 480 });

  const bytes = await pdf.save();
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=crestview-report.pdf"
    }
  });
});
