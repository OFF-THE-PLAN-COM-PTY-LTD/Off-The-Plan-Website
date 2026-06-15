import {
  enquiryConfirmationTemplate,
  signupWelcomeTemplate,
} from "@/lib/email/templates";

/**
 * Admin-only preview of the two transactional emails that fire when a
 * buyer submits an enquiry or signs up via the Circle popup. Renders
 * the REAL templates (same functions /api/enquiries and /api/circle
 * call) inside sandboxed iframes so the email styling stays isolated
 * from the admin page chrome.
 *
 * Useful for visual sign-off before the Resend API key is in place —
 * once the key is set, these templates send live but you can still
 * come back here to preview any wording tweaks before deploying.
 */
export default function EmailPreviewsPage() {
  const enquiry = enquiryConfirmationTemplate();
  const welcome = signupWelcomeTemplate();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-1">Email Previews</h1>
        <p className="text-sm text-ink/60 mb-6">
          Live render of the two transactional email templates. These fire
          automatically once <code className="bg-white px-1.5 py-0.5 rounded text-xs">RESEND_API_KEY</code> is set on Vercel.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PreviewCard
            title="1. Buyer enquiry confirmation"
            description="Sent to the buyer after they submit an enquiry on any listing page."
            trigger="POST /api/enquiries"
            subject={enquiry.subject}
            html={enquiry.html}
          />
          <PreviewCard
            title="2. Newsletter signup welcome"
            description="Sent to the user after they sign up via the Circle popup on the home page."
            trigger="POST /api/circle"
            subject={welcome.subject}
            html={welcome.html}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  description,
  trigger,
  subject,
  html,
}: {
  title: string;
  description: string;
  trigger: string;
  subject: string;
  html: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-ink text-lg mb-1">{title}</h2>
        <p className="text-sm text-ink/60 mb-3">{description}</p>
        <dl className="text-xs space-y-1">
          <div className="flex">
            <dt className="text-ink/40 w-20 flex-shrink-0">Trigger:</dt>
            <dd className="text-ink font-mono">{trigger}</dd>
          </div>
          <div className="flex">
            <dt className="text-ink/40 w-20 flex-shrink-0">Subject:</dt>
            <dd className="text-ink font-medium">{subject}</dd>
          </div>
        </dl>
      </div>
      <iframe
        srcDoc={html}
        title={title}
        className="w-full h-[720px] bg-white"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
