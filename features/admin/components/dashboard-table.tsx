"use client";

import { useEffect, useState, useCallback } from "react";
// xlsx (~450KB min) is lazy-loaded inside handleExcel so it stays out of the
// main /admin dashboard bundle — matches the jsPDF lazy-load below and the
// pattern in export-buttons.tsx.

type FilterOption = { label: string; value: string };
type Column = { key: string; label: string };

interface DashboardTableProps {
  title: string;
  apiPath: string;
  columns: Column[];
  pdfTitle?: string;
  filterOptions?: FilterOption[];
  showViewAll?: boolean;
  viewAllHref?: string;
}

const PAGE_SIZE = 10;

const FILTERS: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 60 Days", value: "60" },
];

function formatCell(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(value);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }
  return String(value);
}

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 864e5);
  return diff === 0 ? "0 Days ago" : `${diff} Day${diff === 1 ? "" : "s"} ago`;
}

export default function DashboardTable({
  title,
  apiPath,
  columns,
  pdfTitle,
  filterOptions = FILTERS,
  showViewAll = false,
  viewAllHref = "#",
}: DashboardTableProps) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchData = useCallback(
    async (f: string, p: number) => {
      setLoading(true);
      try {
        const res = await fetch(`${apiPath}?filter=${f}&page=${p}`);
        const json = await res.json();
        setRows(json.data ?? []);
        setTotal(json.total ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [apiPath]
  );

  useEffect(() => {
    fetchData(filter, page);
  }, [filter, page, fetchData]);

  const handleFilter = (val: string) => {
    setFilter(val);
    setPage(1);
  };

  // --- Export helpers ---
  const fetchAll = async () => {
    const res = await fetch(`${apiPath}?filter=${filter}&page=1&pageSize=9999`);
    const json = await res.json();
    return (json.data ?? []) as Record<string, unknown>[];
  };

  const handlePdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const allRows = await fetchAll();
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(pdfTitle ?? title, 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["#", ...columns.map((c) => c.label), "Days Ago"]],
      body: allRows.map((row, i) => [
        i + 1,
        ...columns.map((c) => formatCell(row[c.key])),
        row.created_at ? daysAgo(row.created_at as string) : "—",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 35, 64] },
    });
    doc.save(`${(pdfTitle ?? title).replace(/\s+/g, "_")}.pdf`);
  };

  const handleExcel = async () => {
    const XLSX = await import("xlsx");
    const allRows = await fetchAll();
    const sheetData = [
      ["#", ...columns.map((c) => c.label), "Days Ago"],
      ...allRows.map((row, i) => [
        i + 1,
        ...columns.map((c) => formatCell(row[c.key])),
        row.created_at ? daysAgo(row.created_at as string) : "—",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    XLSX.writeFile(wb, `${(pdfTitle ?? title).replace(/\s+/g, "_")}.xlsx`);
  };

  const pageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm tracking-widest uppercase" style={{ color: "#1a2340" }}>
          {title}
        </h2>
        {showViewAll && (
          <a href={viewAllHref} className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors">
            VIEW ALL
          </a>
        )}
      </div>

      {/* Filter + export bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilter(opt.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all"
              style={
                filter === opt.value
                  ? { background: "#1a2340", color: "#fff", borderColor: "#1a2340" }
                  : { background: "#fff", color: "#555", borderColor: "#ddd" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors hover:opacity-80"
            style={{ background: "#fff", border: "1px solid #e85d26", color: "#e85d26" }}
          >
            ↓ PDF
          </button>
          <button
            onClick={handleExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors hover:opacity-80"
            style={{ background: "#e85d26", border: "1px solid #e85d26", color: "#fff" }}
          >
            ↓ Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 font-semibold text-xs uppercase tracking-widest text-gray-500 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No records found
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {col.key === "created_at"
                        ? formatCell(row[col.key])
                        : col.key === "days_ago"
                        ? row.created_at ? daysAgo(row.created_at as string) : "—"
                        : formatCell(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-xs border border-gray-300 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          {pageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-gray-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`px-3 py-1 text-xs border transition-colors ${
                  page === p
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-xs border border-gray-300 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
