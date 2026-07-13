"use client";

import { useState } from "react";

interface Props {
  developerSlug: string;
  developerName: string;
}

export function DeveloperContactForm({ developerSlug, developerName }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      slug: developerSlug,
      full_name: String(fd.get("full_name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      mobile: String(fd.get("mobile") ?? "").trim() || null,
      message: String(fd.get("message") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/developer-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json.error ?? "Could not send. Please try again.");
        setStatus("err");
        return;
      }
      setStatus("ok");
      (e.target as HTMLFormElement).reset();
    } catch {
      setErrorMsg("Could not send. Please try again.");
      setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <div className="bg-cream-alt border border-line p-6">
        <p className="font-display font-light text-navy text-lg mb-2">Thanks — we&apos;ll be in touch.</p>
        <p className="font-sans text-sm text-ink/60">
          Your message has been sent to {developerName}. They&apos;ll reply to you directly.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-line bg-white px-3 py-2 font-sans text-sm text-ink outline-none focus:border-orange/60";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line p-5 space-y-4">
      <div>
        <label className="block font-sans text-xs text-ink/60 mb-1">Your name</label>
        <input name="full_name" type="text" required maxLength={120} className={inputClass} />
      </div>

      <div>
        <label className="block font-sans text-xs text-ink/60 mb-1">Email</label>
        <input name="email" type="email" required maxLength={200} className={inputClass} />
      </div>

      <div>
        <label className="block font-sans text-xs text-ink/60 mb-1">Mobile (optional)</label>
        <input name="mobile" type="tel" maxLength={40} className={inputClass} />
      </div>

      <div>
        <label className="block font-sans text-xs text-ink/60 mb-1">Message</label>
        <textarea name="message" required rows={5} maxLength={4000} className={`${inputClass} resize-y`} />
      </div>

      {errorMsg && (
        <p className="font-sans text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="font-mono text-[11px] uppercase tracking-widest px-5 py-2.5 bg-orange text-white hover:bg-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-full"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
