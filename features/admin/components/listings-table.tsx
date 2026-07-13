"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Listing {
  id: string;
  name: string;
  price_display: string | null;
  price_from: number | null;
  type: string | null;
  is_published: boolean;
  is_featured: boolean;
  hero_image_url: string | null;
  feature_image_url: string | null;
}

const PAGE_SIZE = 10;

export default function ListingsTable() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/listings-data?page=${page}`)
      .then((r) => r.json())
      .then((json) => {
        setRows(json.data ?? []);
        setTotal(json.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

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

  const price = (row: Listing) =>
    row.price_display ??
    (row.price_from ? `$${row.price_from.toLocaleString()}` : "—");

  const thumb = (row: Listing) => row.hero_image_url ?? row.feature_image_url;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm tracking-widest uppercase" style={{ color: "#1a2340" }}>
          Listing
        </h2>
        <Link
          href="/admin/listings"
          className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
        >
          VIEW ALL
        </Link>
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Thumbnail", "Project", "Price", "Category", "Status", "Edit"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-semibold text-xs uppercase tracking-widest text-gray-500 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No listings yet</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    <div className="w-16 h-10 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
                      {thumb(row) ? (
                        <Image src={thumb(row)!} alt={row.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{price(row)}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.type ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {row.is_published && (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-widest bg-green-100 text-green-700 rounded">
                          Active
                        </span>
                      )}
                      {row.is_featured && (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-widest bg-orange-100 text-orange-700 rounded">
                          Featured
                        </span>
                      )}
                      {!row.is_published && !row.is_featured && (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-widest bg-gray-100 text-gray-500 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/listings/${row.id}`}
                      className="px-3 py-1 text-xs font-bold uppercase tracking-widest border border-gray-400 text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
                    >
                      EDIT LISTING
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
