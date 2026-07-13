"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { Agent } from "../types";

export function AgentManager({
  developmentId,
  initialAgents,
}: {
  developmentId: string;
  initialAgents: Omit<Agent, "isNew" | "saving" | "deleting">[];
}) {
  const [agents, setAgents] = useState<Agent[]>(
    initialAgents.map((a) => ({ ...a, isNew: false, saving: false, deleting: false }))
  );
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  function addAgent() {
    setAgents((prev) => [
      ...prev,
      { name: "", email: "", mobile: "", photo_url: "", isNew: true, saving: false, deleting: false },
    ]);
  }

  function updateField(index: number, field: keyof Agent, value: string) {
    setAgents((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  async function uploadPhoto(index: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "development-images");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (res.ok) updateField(index, "photo_url", json.url);
  }

  async function saveAgent(index: number) {
    const agent = agents[index];
    setAgents((prev) => prev.map((a, i) => (i === index ? { ...a, saving: true, justSaved: false } : a)));

    let id = agent.id;
    if (agent.isNew) {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ development_id: developmentId, name: agent.name, email: agent.email, mobile: agent.mobile, photo_url: agent.photo_url, sort_order: index }),
      });
      const json = await res.json();
      if (res.ok) id = json.id;
    } else {
      await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agent.id, name: agent.name, email: agent.email, mobile: agent.mobile, photo_url: agent.photo_url }),
      });
    }

    // Flip on `justSaved` for ~2.5s so the Save button reads "✓ Saved" —
    // otherwise there's no visible confirmation the click did anything and
    // admins will double-click / worry / re-save.
    setAgents((prev) =>
      prev.map((a, i) => (i === index ? { ...a, id, isNew: false, saving: false, justSaved: true } : a))
    );
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a, i) => (i === index && a.id === id ? { ...a, justSaved: false } : a))
      );
    }, 2500);
  }

  async function deleteAgent(index: number) {
    const agent = agents[index];
    if (agent.isNew) {
      setAgents((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setAgents((prev) => prev.map((a, i) => (i === index ? { ...a, deleting: true } : a)));
    await fetch("/api/admin/agents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: agent.id }),
    });
    setAgents((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      {agents.length > 0 && (
        <div className="mb-4">
          {/* Header */}
          <div className="grid grid-cols-[64px_1fr_1fr_1fr_220px_160px] gap-3 items-center px-2 pb-2 border-b border-line mb-3">
            <div />
            <p className="font-sans text-sm text-ink/60">Name</p>
            <p className="font-sans text-sm text-ink/60">Email</p>
            <p className="font-sans text-sm text-ink/60">Mobile</p>
            <div>
              <p className="font-sans text-sm text-ink/60">Upload profile pic or logo</p>
              <p className="font-sans text-[10px] text-ink/30">(File size: up to 5MB, Dimensions: 500×500)</p>
            </div>
            <div />
          </div>

          {agents.map((agent, i) => (
            <div key={i} className="grid grid-cols-[64px_1fr_1fr_1fr_220px_160px] gap-3 items-center px-2 py-3 border-b border-line last:border-0">
              {/* Photo */}
              <div className="relative w-14 h-14 bg-navy/5 border border-line overflow-hidden flex-shrink-0">
                {agent.photo_url ? (
                  <Image src={agent.photo_url} alt={agent.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/20">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Name */}
              <input
                type="text"
                value={agent.name}
                onChange={(e) => updateField(i, "name", e.target.value)}
                placeholder="Agent name"
                className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors w-full"
              />

              {/* Email */}
              <input
                type="email"
                value={agent.email}
                onChange={(e) => updateField(i, "email", e.target.value)}
                placeholder="agent@example.com"
                className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors w-full"
              />

              {/* Mobile */}
              <input
                type="tel"
                value={agent.mobile}
                onChange={(e) => updateField(i, "mobile", e.target.value)}
                placeholder="04XX XXX XXX"
                className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 transition-colors w-full"
              />

              {/* Photo upload */}
              <div className="flex items-center gap-1.5">
                <input
                  ref={(el) => { fileRefs.current[i] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(i, f); e.target.value = ""; }}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileRefs.current[i]?.click()}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors whitespace-nowrap"
                >
                  {agent.photo_url ? "Change Photo" : "Select File"}
                </button>
                {agent.photo_url && (
                  <button
                    type="button"
                    onClick={() => updateField(i, "photo_url", "")}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remove photo"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Save / Delete */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveAgent(i)}
                  disabled={agent.saving || agent.deleting}
                  className={`font-mono text-[10px] uppercase tracking-widest px-3 py-2 border transition-colors disabled:opacity-50 whitespace-nowrap ${
                    agent.justSaved
                      ? "border-green-500 text-green-700 bg-green-50"
                      : "border-teal-400 text-teal-600 hover:bg-teal-500 hover:text-white hover:border-teal-500"
                  }`}
                >
                  {agent.saving ? "Saving…" : agent.justSaved ? "✓ Saved" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteAgent(i)}
                  disabled={agent.saving || agent.deleting}
                  className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {agent.deleting ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addAgent}
        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors"
      >
        + Add
      </button>
    </div>
  );
}
