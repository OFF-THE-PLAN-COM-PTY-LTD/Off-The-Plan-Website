import Link from "next/link";
import NewProfileForm from "./new-profile-form";

export default function AdminNewProfilePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/agencies" className="font-sans text-sm text-ink/40 hover:text-ink transition-colors">
          ← All Profiles
        </Link>
      </div>
      <h1 className="font-display font-light text-navy text-section-lg mb-6">Add profile</h1>
      <NewProfileForm />
    </div>
  );
}
