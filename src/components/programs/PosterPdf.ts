import jsPDF from "jspdf";

export interface PosterInput {
  programName: string;
  merchantName: string;
  joinUrl: string;
  qrDataUrl: string; // PNG data URL
  primaryColor?: string | null;
  tagline?: string;
}

function hexToRgb(hex: string | null | undefined): [number, number, number] {
  if (!hex) return [13, 102, 217];
  const s = hex.replace("#", "");
  if (s.length !== 6) return [13, 102, 217];
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

export function generatePosterPdf({
  programName,
  merchantName,
  joinUrl,
  qrDataUrl,
  primaryColor,
  tagline = "5. kahven bizden ☕",
}: PosterInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = 210;
  const pageH = 297;
  const [r, g, b] = hexToRgb(primaryColor);

  // Top brand band
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(merchantName, pageW / 2, 22, { align: "center" });

  // Program name
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text(programName, pageW / 2, 60, { align: "center" });

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.setTextColor(90, 90, 90);
  doc.text(tagline, pageW / 2, 74, { align: "center" });

  // QR — big, centered
  const qrSize = 130;
  const qrX = (pageW - qrSize) / 2;
  const qrY = 90;
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 4, 4, "S");
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Instruction strip
  const stripY = qrY + qrSize + 22;
  doc.setFillColor(245, 245, 247);
  doc.roundedRect(20, stripY, pageW - 40, 28, 4, 4, "F");
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Telefonunla tara", pageW / 2, stripY + 11, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text("Kartını Apple Cüzdan'a ekle, her ziyarette damga topla.", pageW / 2, stripY + 20, {
    align: "center",
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(joinUrl, pageW / 2, pageH - 14, { align: "center" });
  doc.setFillColor(r, g, b);
  doc.rect(0, pageH - 6, pageW, 6, "F");

  return doc;
}
