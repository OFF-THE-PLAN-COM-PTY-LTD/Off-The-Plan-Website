"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/pill";
import {
  BedIcon,
  CameraIcon,
  ShareIcon,
  ArrowRightIcon,
  MailIcon,
} from "@/components/icons";
import type { Development } from "@/types/development";

interface PropertyCardProps {
  development: Development;
  layout?: "tall" | "wide" | "featured";
  className?: string;
  imageHeight?: string;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

function tagVariant(tag: Development["tag"]): "orange" | "navy" | "ghost" {
  if (tag === "Featured" || tag === "Editor's pick") return "orange";
  if (tag === "New launch") return "navy";
  return "ghost";
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill={filled ? "#E8722C" : "none"} aria-hidden="true">
      <path
        d="M10 16.5L3.5 9.5C3.5 7 5.3 5 7.5 5c1.1 0 2.1.5 2.8 1.3L10 7l-.2-.7C10.5 5.5 11.5 5 12.5 5c2.2 0 4 2 4 4.5L10 16.5z"
        stroke={filled ? "#E8722C" : "currentColor"}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PropertyCard({
  development,
  layout = "tall",
  className,
  imageHeight,
  onSave,
  isSaved: initialSaved = false,
}: PropertyCardProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/listings/${development.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const heroImageUrl =
    development.images?.find((img) => img.is_hero)?.url ??
    development.images?.[0]?.url ??
    development.hero_image_url ??
    null;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    // If a parent handler is provided, delegate to it
    if (onSave) {
      onSave(development.id);
      return;
    }

    setLoading(true);
    const method = saved ? "DELETE" : "POST";
    const res = await fetch("/api/saved", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ development_id: development.id }),
    });

    if (res.status === 401) {
      router.push(`/login?redirect=/saved`);
      return;
    }

    if (res.ok) setSaved(!saved);
    setLoading(false);
  };

  if (layout === "wide") {
    return (
      <Link
        href={`/listings/${development.slug}`}
        className={cn("group relative flex gap-0 overflow-hidden bg-cream-alt border border-line", className)}
      >
        {/* Image side */}
        <div className="relative w-1/2 min-h-[360px] bg-navy/10 flex-shrink-0">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={development.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-mid" />
          )}
          {development.tag && (
            <div className="absolute top-4 left-4">
              <Pill variant={tagVariant(development.tag)}>{development.tag}</Pill>
            </div>
          )}
        </div>

        {/* Content side */}
        <div className="flex flex-col justify-between p-8 flex-1">
          <div>
            <p className="font-mono text-label-lg uppercase tracking-widest text-ink/40 mb-3">
              {development.suburb}, {development.state}
            </p>
            <h3 className="font-display text-card-xl font-light text-navy mb-4 group-hover:text-orange transition-colors">
              {development.name}
            </h3>
            {development.summary && (
              <p className="font-sans text-body-md text-ink/60 leading-relaxed mb-6 line-clamp-3">
                {development.summary}
              </p>
            )}
            {/* Specs */}
            <div className="flex gap-6 text-ink/50">
              {development.price_display && (
                <div>
                  <p className="font-mono text-label-sm uppercase tracking-widest mb-0.5">From</p>
                  <p className="font-mono text-label-lg text-ink">{development.price_display}</p>
                </div>
              )}
              {development.beds_min && (
                <div>
                  <p className="font-mono text-label-sm uppercase tracking-widest mb-0.5">Beds</p>
                  <p className="font-mono text-label-lg text-ink">
                    {development.beds_min === development.beds_max
                      ? development.beds_min
                      : `${development.beds_min}–${development.beds_max}`}
                  </p>
                </div>
              )}
              {development.type && (
                <div>
                  <p className="font-mono text-label-sm uppercase tracking-widest mb-0.5">Type</p>
                  <p className="font-mono text-label-lg text-ink">{development.type}</p>
                </div>
              )}
              {development.completion_quarter && (
                <div>
                  <p className="font-mono text-label-sm uppercase tracking-widest mb-0.5">Completion</p>
                  <p className="font-mono text-label-lg text-ink">{development.completion_quarter}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            {development.status && (
              <Pill variant={development.status === "Selling now" ? "orange" : "ghost"}>
                {development.status}
              </Pill>
            )}
            <button
              onClick={handleSave}
              aria-label={saved ? "Remove from saved" : "Save listing"}
              disabled={loading}
              className="p-2 text-ink/30 hover:text-orange transition-colors disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill={saved ? "#E8722C" : "none"}>
                <path
                  d="M10 16.5L3.5 9.5C3.5 7 5.3 5 7.5 5c1.1 0 2.1.5 2.8 1.3L10 7l-.2-.7C10.5 5.5 11.5 5 12.5 5c2.2 0 4 2 4 4.5L10 16.5z"
                  stroke={saved ? "#E8722C" : "currentColor"}
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </Link>
    );
  }

  if (layout === "featured") {
    return (
      <Link
        href={`/listings/${development.slug}`}
        className={cn(
          "group relative block transition-all duration-500 ease-out hover:z-10 hover:scale-[1.025] hover:-translate-y-2",
          className
        )}
        style={{ willChange: "transform" }}
      >
        <div className={cn("relative bg-navy overflow-hidden", imageHeight ?? "h-[440px]")}>
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={development.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-mid" />
          )}

          {/* Gradient overlay — lightens on hover to reveal more of the photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent transition-opacity duration-500 group-hover:opacity-75" />

          {/* Save button */}
          <button
            onClick={handleSave}
            aria-label={saved ? "Remove from saved" : "Save listing"}
            disabled={loading}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/60 transition-colors disabled:opacity-50 backdrop-blur-sm"
          >
            <HeartIcon filled={saved} />
          </button>

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-7">
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/60 mb-2">
              {development.suburb}, {development.state}
            </p>
            <h3 className="font-display font-light text-white group-hover:text-orange transition-colors leading-snug mb-4 text-[1.6rem]">
              {development.name}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              {development.status && (
                <Pill variant={development.status === "Selling now" ? "orange" : "ghost"}>
                  {development.status}
                </Pill>
              )}
              {development.beds_min && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                  {development.beds_min === development.beds_max
                    ? `${development.beds_min} Bed`
                    : `${development.beds_min}–${development.beds_max} Bed`}
                </span>
              )}
              {development.price_display && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                  {development.price_display}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Tall (default) layout
  const imageCount = (development.images?.length ?? 0) > 0 ? development.images!.length : 1;
  const bedsLabel = development.beds_min
    ? development.beds_min === development.beds_max
      ? `${development.beds_min}`
      : `${development.beds_min}–${development.beds_max}`
    : null;

  return (
    <div className={cn("group flex flex-col bg-white border border-line overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1", className)}>

      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <Link href={`/listings/${development.slug}`} className="relative block h-56 bg-navy/10 overflow-hidden flex-shrink-0">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={development.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-mid" />
        )}

        {/* Status pill — top left */}
        {development.status && (
          <div className="absolute top-3 left-3">
            <Pill variant={development.status === "Selling now" ? "orange" : "ghost"}>
              {development.status}
            </Pill>
          </div>
        )}

        {/* Save / heart — top right */}
        <button
          onClick={handleSave}
          aria-label={saved ? "Remove from saved" : "Save listing"}
          disabled={loading}
          className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white transition-colors disabled:opacity-50"
        >
          <HeartIcon filled={saved} />
        </button>

        {/* Photo count badge — bottom right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1">
          <CameraIcon size={11} className="text-white" />
          <span className="font-mono text-[10px] text-white leading-none">{imageCount}</span>
        </div>
      </Link>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <Link href={`/listings/${development.slug}`} className="flex flex-col flex-1 px-4 pt-4 pb-3">
        {/* Name */}
        <h3 className="font-display font-light text-navy text-[1.1rem] leading-snug mb-1 group-hover:text-orange transition-colors">
          {development.name}
        </h3>

        {/* Location */}
        <p className="font-sans text-[12px] text-ink/50 mb-3">
          {[development.suburb, development.state].filter(Boolean).join(", ")}
        </p>

        {/* Specs row: Type | Beds */}
        <div className="flex items-center text-ink/60 mb-3 flex-wrap">
          {development.type && (
            <span className="font-sans text-[12px] text-ink/60">{development.type}</span>
          )}
          {bedsLabel && (
            <>
              {development.type && (
                <span className="mx-2 text-ink/20 text-[10px] select-none">|</span>
              )}
              <span className="inline-flex items-center gap-1">
                <BedIcon size={13} className="text-ink/40" />
                <span className="font-sans text-[12px] text-ink/60">{bedsLabel} Bed</span>
              </span>
            </>
          )}
        </div>

        {/* Price guide */}
        {development.price_display && (
          <div className="mt-auto">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mb-0.5">Price Guide</p>
            <p className="font-mono text-[13px] font-medium text-ink">{development.price_display}</p>
          </div>
        )}
      </Link>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="h-px bg-line mx-4" />

      {/* ── Action row ────────────────────────────────────────────────────── */}
      <div className="flex divide-x divide-line">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-orange hover:bg-orange/5 transition-all"
        >
          <ShareIcon size={13} />
          {copied ? "Copied!" : "Share"}
        </button>
        <Link
          href={`/listings/${development.slug}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-orange hover:bg-orange/5 transition-all"
        >
          <ArrowRightIcon size={13} />
          View
        </Link>
        <Link
          href={`/listings/${development.slug}#enquire`}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-orange hover:bg-orange/5 transition-all"
        >
          <MailIcon size={13} />
          Enquire
        </Link>
      </div>
    </div>
  );
}
