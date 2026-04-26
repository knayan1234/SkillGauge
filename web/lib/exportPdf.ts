/**
 * PDF export — turn an interview session's transcript into a downloadable PDF report.
 *
 * Why client-side jsPDF (and not a server-rendered react-pdf): the data the user wants
 * to export is already loaded into the FE state machine. Sending it back to the BE
 * just to render and stream a PDF would add a roundtrip + a server dependency for no
 * functional gain. jsPDF generates the PDF in the browser in ~100ms for typical
 * transcripts (<100 messages), saves directly via `doc.save(filename)`.
 *
 * The report is intentionally plain — no charts, no fancy layouts. A clean
 * paginated text rendering of the transcript with per-message scoring is what the
 * user wants for sharing or archival. Visual polish lives in the FE dashboard;
 * the PDF is the artifact.
 *
 * Layout:
 *   - Cover line with title, date, average score.
 *   - Each Q/A/F triplet rendered as a labelled block with wrapped text.
 *   - Score for each feedback message inline ("Score: 8 / 10").
 *   - Auto-paginates on overflow via `splitTextToSize` + a manual y-cursor.
 *
 * If we ever need richer rendering (charts, code highlighting, tables) — switch to
 * `@react-pdf/renderer` then. Not worth the bundle weight today.
 */

import jsPDF from "jspdf";
import type { Message, Session } from "@/services/api";

// Page geometry. jsPDF's default unit is mm on A4 (210 × 297). We leave a generous
// margin on all sides so the content reads more like a document and less like a
// terminal dump.
const MARGIN = 18;
const PAGE_HEIGHT = 297;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 5;
const SECTION_GAP = 3;

interface ExportPdfParams {
  session: Session;
  messages: Message[];
}

export function exportSessionPdf({ session, messages }: ExportPdfParams): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Average score across feedback messages — same calculation the completion card uses.
  const scores = messages
    .filter(
      (m): m is Message & { feedback: { score: number; strengths: string[]; improvements: string[] } } =>
        m.type === "feedback" && typeof m.feedback?.score === "number",
    )
    .map((m) => m.feedback.score);
  const averageScore =
    scores.length === 0
      ? null
      : Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10;

  let y = MARGIN;

  // Header. Larger font for the title; subtitle in a muted smaller size.
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(session.title || "Interview Report", MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const subtitleParts = [
    new Date(session.createdAt).toLocaleString(),
    `${messages.filter((m) => m.type === "answer").length} answers`,
    averageScore !== null ? `avg ${averageScore.toFixed(1)} / 10` : null,
    session.currentRound && session.currentRound > 1
      ? `${session.currentRound} rounds`
      : null,
  ].filter(Boolean);
  doc.text(subtitleParts.join(" · "), MARGIN, y);
  y += 8;

  // Divider line below the header so the body starts visually separated.
  doc.setDrawColor(180);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;

  // Walk every message in order. We don't bundle into Q→A→F triplets because the
  // wire model already serialises them in order (`createdAt asc`); rendering them
  // sequentially preserves the chat flow.
  for (const msg of messages) {
    y = ensureSpace(doc, y, LINE_HEIGHT * 4);

    // Speaker label per message — bold, slightly tinted via grayscale.
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    const label =
      msg.type === "question"
        ? "Interviewer"
        : msg.type === "answer"
          ? "You"
          : "Feedback";
    doc.text(label, MARGIN, y);
    y += LINE_HEIGHT;

    // Body text. `splitTextToSize` wraps to the content width; we then walk the
    // resulting lines, paginating as we go.
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20);
    const wrapped = doc.splitTextToSize(msg.content || "", CONTENT_WIDTH) as string[];
    for (const line of wrapped) {
      y = ensureSpace(doc, y, LINE_HEIGHT);
      doc.text(line, MARGIN, y);
      y += LINE_HEIGHT;
    }

    // Per-feedback rubric block.
    if (msg.type === "feedback" && msg.feedback) {
      y += SECTION_GAP;
      y = ensureSpace(doc, y, LINE_HEIGHT * 2);
      doc.setFont("helvetica", "bold");
      doc.text(`Score: ${msg.feedback.score} / 10`, MARGIN, y);
      y += LINE_HEIGHT;

      if (msg.feedback.strengths.length > 0) {
        y = renderBulletList(doc, y, "Strengths", msg.feedback.strengths);
      }
      if (msg.feedback.improvements.length > 0) {
        y = renderBulletList(doc, y, "Improvements", msg.feedback.improvements);
      }
    }

    y += SECTION_GAP;
  }

  // Filename: "skillgauge-<title-slug>-<yyyymmdd>.pdf". Slug is lowercase + dashes.
  const slug = (session.title || "interview")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  doc.save(`skillgauge-${slug}-${date}.pdf`);
}

/**
 * If the next block would overflow the page, advance to a new page and return the
 * top y. Otherwise return y unchanged.
 */
function ensureSpace(doc: jsPDF, y: number, requiredHeight: number): number {
  if (y + requiredHeight > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function renderBulletList(
  doc: jsPDF,
  y: number,
  label: string,
  items: string[],
): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  y = ensureSpace(doc, y, LINE_HEIGHT);
  doc.text(label, MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFont("helvetica", "normal");
  for (const item of items) {
    const wrapped = doc.splitTextToSize(`• ${item}`, CONTENT_WIDTH - 4) as string[];
    for (const line of wrapped) {
      y = ensureSpace(doc, y, LINE_HEIGHT);
      doc.text(line, MARGIN + 4, y);
      y += LINE_HEIGHT;
    }
  }
  return y + 1;
}
