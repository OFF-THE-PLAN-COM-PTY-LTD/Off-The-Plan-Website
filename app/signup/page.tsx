import { redirect } from "next/navigation";

// Buyer self-signup was retired in favour of the legacy-matching
// Developer/Agent application at /list-a-listing. Anyone hitting this
// path (old bookmarks, links from emails) is redirected. Existing
// buyer accounts still sign in via /login as normal.
export default function SignupPage() {
  redirect("/list-a-listing");
}
