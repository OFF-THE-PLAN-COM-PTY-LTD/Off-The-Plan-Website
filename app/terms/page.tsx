import { redirect } from "next/navigation";

// Tim's source-of-truth Terms & Conditions live as a PDF (matches legacy
// offtheplan.com.au/files/Terms_&_Conditions_-_Off_the_plan.pdf). We host
// the same file at /terms-and-conditions.pdf in /public, and redirect
// the legacy HTML route here so any bookmarks or in-app references still
// land on the right document.
export default function TermsRedirectPage() {
  redirect("/terms-and-conditions.pdf");
}
