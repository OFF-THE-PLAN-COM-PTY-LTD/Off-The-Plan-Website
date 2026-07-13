"use client";

import { useState } from "react";
import { EnquiryModal } from "@/components/enquiry-modal";

interface EnquiryButtonProps {
  developmentId: string;
  developmentName: string;
  developerName?: string | null;
  developerLogoUrl?: string | null;
  /** Button contents — whatever the parent wants to render */
  children: React.ReactNode;
  className?: string;
}

export function EnquiryButton({
  developmentId,
  developmentName,
  developerName,
  developerLogoUrl,
  children,
  className,
}: EnquiryButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <EnquiryModal
          developmentId={developmentId}
          developmentName={developmentName}
          developerName={developerName}
          developerLogoUrl={developerLogoUrl}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
