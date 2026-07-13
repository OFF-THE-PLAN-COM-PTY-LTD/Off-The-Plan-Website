"use client";

import { useState } from "react";

export type ExportColumn<T> = {
  header: string;
  /** Returns a primitive value for this row's cell. */
  value: (row: T) => string | number | null | undefined;
};

interface Props<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  /** Base filename (no extension). A date suffix will be appended. */
  filename: string;
  /** Optional title rendered at top of the PDF. */
  pdfTitle?: string;
}

function todaySuffix() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function cellString(v: string | number | null | undefined): string {
  if (v == null) return "";
  return typeof v === "number" ? String(v) : v;
}

/**
 * Reusable Export Excel + Export PDF buttons for admin tables.
 * Lazy-loads xlsx / jspdf so they don't bloat the initial bundle.
 */
export function ExportButtons<T>({ rows, columns, filename, pdfTitle }: Props<T>) {
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);

  async function exportExcel() {
    if (busy) return;
    setBusy("xlsx");
    try {
      const xlsx = await import("xlsx");
      const data: (string | number)[][] = [
        columns.map((c) => c.header),
        ...rows.map((r) => columns.map((c) => cellString(c.value(r)))),
      ];
      const ws = xlsx.utils.aoa_to_sheet(data);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Data");
      xlsx.writeFile(wb, `${filename}-${todaySuffix()}.xlsx`);
    } finally {
      setBusy(null);
    }
  }

  async function exportPDF() {
    if (busy) return;
    setBusy("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const autoTableMod = await import("jspdf-autotable");
      const autoTable = (autoTableMod as unknown as { default: (doc: unknown, opts: unknown) => void }).default;

      const doc = new jsPDF({ orientation: "landscape" });
      if (pdfTitle) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(pdfTitle, 14, 16);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Generated ${todaySuffix()}`, 14, 22);
      }

      autoTable(doc, {
        startY: pdfTitle ? 28 : 14,
        head: [columns.map((c) => c.header)],
        body: rows.map((r) => columns.map((c) => cellString(c.value(r)))),
        styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [26, 35, 64], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 248, 244] },
        margin: { top: 16, left: 14, right: 14 },
      });

      doc.save(`${filename}-${todaySuffix()}.pdf`);
    } finally {
      setBusy(null);
    }
  }

  const disabled = rows.length === 0;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={exportExcel}
        disabled={disabled || busy !== null}
        className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-line text-ink hover:border-navy hover:text-navy bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {busy === "xlsx" ? "…" : "↓ Excel"}
      </button>
      <button
        type="button"
        onClick={exportPDF}
        disabled={disabled || busy !== null}
        className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-line text-ink hover:border-navy hover:text-navy bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {busy === "pdf" ? "…" : "↓ PDF"}
      </button>
    </div>
  );
}
