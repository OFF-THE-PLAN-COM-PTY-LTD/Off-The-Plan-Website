import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/pill";
import { formatDate } from "@/lib/utils";
import type { JournalArticle } from "@/types/journal";

interface JournalCardProps {
  article: JournalArticle;
  variant?: "feature" | "compact";
  className?: string;
}

const categoryColors: Record<string, string> = {
  Editorial: "text-orange",
  Market: "text-navy",
  Interview: "text-ink",
  Guide: "text-ink/60",
};

export function JournalCard({ article, variant = "compact", className }: JournalCardProps) {
  if (variant === "feature") {
    return (
      <Link
        href={`/journal/${article.slug}`}
        className={cn("group block", className)}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] mb-4 bg-navy/10 overflow-hidden">
          {article.hero_image_url ? (
            <Image
              src={article.hero_image_url}
              alt={article.title}
              fill
              className="object-contain transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-mid flex items-end p-4">
              <span className="font-mono text-label-sm uppercase tracking-widest text-ink-light/40">
                {article.category}
              </span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-2">
          <span className={cn("font-mono text-label-lg uppercase tracking-widest", categoryColors[article.category] ?? "text-ink/60")}>
            {article.category}
          </span>
          <span className="text-ink/20">·</span>
          <span className="font-mono text-label-sm text-ink/40">
            {article.read_time_minutes} min read
          </span>
        </div>

        <h3 className="font-display text-card-xl font-light text-navy group-hover:text-orange transition-colors leading-snug mb-2">
          {article.title}
        </h3>

        {article.published_at && (
          <p className="font-mono text-label-sm text-ink/30 uppercase tracking-widest">
            {formatDate(article.published_at)}
          </p>
        )}
      </Link>
    );
  }

  // Compact variant
  return (
    <Link
      href={`/journal/${article.slug}`}
      className={cn("group flex gap-4 py-4 border-t border-line", className)}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-navy/10 overflow-hidden">
        {article.hero_image_url ? (
          <Image
            src={article.hero_image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-mid" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("font-mono text-label-sm uppercase tracking-widest", categoryColors[article.category] ?? "text-ink/60")}>
            {article.category}
          </span>
          {article.read_time_minutes && (
            <>
              <span className="text-ink/20">·</span>
              <span className="font-mono text-label-sm text-ink/40">{article.read_time_minutes} min</span>
            </>
          )}
        </div>
        <h3 className="font-display text-card-lg font-light text-navy group-hover:text-orange transition-colors leading-snug line-clamp-2">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}
