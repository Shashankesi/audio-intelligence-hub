import { jsPDF } from "jspdf";

export type SummaryDoc = {
  title?: string;
  createdAt?: string;
  short_text?: string;
  detailed_text?: string;
  key_points?: string[];
  action_items?: { text: string; owner?: string | null }[];
  topics?: string[];
  sentiment?: { label: string; score: number; rationale: string } | null;
};

const BRAND: [number, number, number] = [124, 92, 255];
const ACCENT: [number, number, number] = [34, 211, 238];
const INK: [number, number, number] = [24, 24, 32];
const MUTED: [number, number, number] = [110, 112, 130];

/** Strip markdown syntax down to readable plain text lines. */
function mdToBlocks(md: string) {
  const blocks: { type: "h1" | "h2" | "li" | "p"; text: string }[] = [];
  for (const rawLine of md.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const clean = line
      .replace(/^#{1,6}\s*/, "")
      .replace(/^[-*+]\s+/, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .trim();
    if (!clean) continue;
    if (/^##\s|^###\s/.test(line)) blocks.push({ type: line.startsWith("###") ? "h2" : "h1", text: clean });
    else if (/^#\s/.test(line)) blocks.push({ type: "h1", text: clean });
    else if (/^[-*+]\s/.test(line)) blocks.push({ type: "li", text: clean });
    else blocks.push({ type: "p", text: clean });
  }
  return blocks;
}

export function generateSummaryPdf(doc: SummaryDoc) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 54;
  const CW = W - M * 2;
  let y = 0;

  const footer = () => {
    const page = pdf.getNumberOfPages();
    pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
    pdf.text("AudioInsight AI — AI meeting intelligence", M, H - 26);
    pdf.text(String(page), W - M, H - 26, { align: "right" });
  };

  const newPage = () => {
    footer();
    pdf.addPage();
    y = M;
  };

  const need = (h: number) => {
    if (y + h > H - 56) newPage();
  };

  const heading = (text: string, size = 13) => {
    need(size + 26);
    y += 10;
    pdf.setFillColor(...BRAND);
    pdf.rect(M, y - 9, 3, size + 2, "F");
    pdf.setFont("helvetica", "bold").setFontSize(size).setTextColor(...INK);
    pdf.text(text, M + 12, y + size * 0.35);
    y += size + 12;
  };

  const body = (text: string, opts: { indent?: number; size?: number; color?: [number, number, number]; bold?: boolean } = {}) => {
    const size = opts.size ?? 10.5;
    const indent = opts.indent ?? 0;
    pdf.setFont("helvetica", opts.bold ? "bold" : "normal").setFontSize(size).setTextColor(...(opts.color ?? INK));
    const lines = pdf.splitTextToSize(text, CW - indent) as string[];
    for (const line of lines) {
      need(size + 6);
      pdf.text(line, M + indent, y);
      y += size + 4.5;
    }
  };

  // ---------- Cover header ----------
  pdf.setFillColor(14, 14, 22);
  pdf.rect(0, 0, W, 150, "F");
  pdf.setFillColor(...BRAND);
  pdf.circle(W - 60, 34, 62, "F");
  pdf.setFillColor(...ACCENT);
  pdf.circle(W - 10, 120, 40, "F");
  pdf.setFillColor(14, 14, 22);
  pdf.rect(0, 150, W, 2, "F");

  pdf.setFont("helvetica", "bold").setFontSize(9).setTextColor(190, 190, 215);
  pdf.text("AUDIOINSIGHT AI  ·  MEETING REPORT", M, 46);
  pdf.setFontSize(23).setTextColor(255, 255, 255);
  const titleLines = pdf.splitTextToSize(doc.title || "Meeting Summary", CW - 90) as string[];
  pdf.text(titleLines.slice(0, 2), M, 82);
  pdf.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(175, 178, 200);
  const meta = [
    doc.createdAt ? new Date(doc.createdAt).toLocaleString() : new Date().toLocaleString(),
    doc.sentiment ? `Sentiment: ${doc.sentiment.label}` : null,
    doc.action_items?.length ? `${doc.action_items.length} action items` : null,
  ].filter(Boolean) as string[];
  pdf.text(meta.join("   ·   "), M, 82 + titleLines.slice(0, 2).length * 22);

  y = 190;

  // ---------- Executive summary ----------
  if (doc.short_text) {
    pdf.setFillColor(246, 246, 252);
    const boxLines = pdf.splitTextToSize(doc.short_text, CW - 28) as string[];
    const boxH = boxLines.length * 15 + 44;
    pdf.roundedRect(M, y, CW, boxH, 8, 8, "F");
    pdf.setFillColor(...BRAND);
    pdf.roundedRect(M, y, 3.5, boxH, 2, 2, "F");
    pdf.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...BRAND);
    pdf.text("EXECUTIVE SUMMARY", M + 14, y + 22);
    pdf.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(...INK);
    pdf.text(boxLines, M + 14, y + 40);
    y += boxH + 8;
  }

  // ---------- Topics ----------
  if (doc.topics?.length) {
    heading("Topics");
    let x = M;
    pdf.setFont("helvetica", "normal").setFontSize(9);
    for (const t of doc.topics) {
      const w = pdf.getTextWidth(t) + 18;
      if (x + w > M + CW) {
        x = M;
        y += 22;
        need(24);
      }
      pdf.setFillColor(238, 236, 252);
      pdf.roundedRect(x, y - 10, w, 17, 8, 8, "F");
      pdf.setTextColor(...BRAND);
      pdf.text(t, x + 9, y + 1.5);
      x += w + 6;
    }
    y += 22;
  }

  // ---------- Key points ----------
  if (doc.key_points?.length) {
    heading("Key points");
    doc.key_points.forEach((k, i) => {
      need(20);
      pdf.setFillColor(...BRAND);
      pdf.circle(M + 4, y - 3, 2.2, "F");
      body(`${i + 1}.  ${k}`, { indent: 16 });
      y += 2;
    });
  }

  // ---------- Action items ----------
  if (doc.action_items?.length) {
    heading("Action items");
    for (const a of doc.action_items) {
      need(24);
      pdf.setDrawColor(215, 215, 230);
      pdf.roundedRect(M, y - 11, 10, 10, 2, 2, "S");
      body(a.text + (a.owner ? `   —  ${a.owner}` : ""), { indent: 20 });
      y += 3;
    }
  }

  // ---------- Sentiment ----------
  if (doc.sentiment) {
    heading("Sentiment");
    const score = Math.max(-1, Math.min(1, doc.sentiment.score ?? 0));
    const barW = CW;
    need(46);
    pdf.setFillColor(232, 232, 240);
    pdf.roundedRect(M, y - 4, barW, 8, 4, 4, "F");
    const fill = ((score + 1) / 2) * barW;
    pdf.setFillColor(...(score >= 0 ? ACCENT : ([239, 68, 68] as [number, number, number])));
    pdf.roundedRect(M, y - 4, Math.max(6, fill), 8, 4, 4, "F");
    y += 18;
    body(`${doc.sentiment.label.toUpperCase()} (${score.toFixed(2)}) — ${doc.sentiment.rationale}`, {
      size: 10,
      color: MUTED,
    });
  }

  // ---------- Detailed analysis ----------
  if (doc.detailed_text) {
    newPage();
    heading("Detailed analysis", 15);
    for (const b of mdToBlocks(doc.detailed_text)) {
      if (b.type === "h1") heading(b.text, 12.5);
      else if (b.type === "h2") {
        need(22);
        y += 6;
        body(b.text, { bold: true, size: 11, color: BRAND });
        y += 2;
      } else if (b.type === "li") {
        need(18);
        pdf.setFillColor(...MUTED);
        pdf.circle(M + 5, y - 3, 1.6, "F");
        body(b.text, { indent: 14 });
      } else {
        body(b.text);
        y += 4;
      }
    }
  }

  footer();
  return pdf;
}

export function downloadSummaryPdf(doc: SummaryDoc) {
  const pdf = generateSummaryPdf(doc);
  const safe = (doc.title || "meeting-summary").replace(/[^\w\-]+/g, "-").slice(0, 60).toLowerCase();
  pdf.save(`${safe || "meeting-summary"}-audioinsight.pdf`);
}