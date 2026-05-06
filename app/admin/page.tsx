import Link from "next/link";
import { Eye, Phone, Share2, MessageSquare, TrendingUp, Sparkles } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import DashboardTable from "@/components/admin/dashboard-table";
import ListingsTable from "@/components/admin/listings-table";

const MOTIVATIONAL = [
  "Let's make today count.",
  "Your listings are live and working hard.",
  "Ready to close some deals?",
  "Great things are happening on the platform.",
  "Another day, another opportunity.",
];

export default async function AdminDashboard() {
  // Get logged-in user's name
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "Admin";

  const [
    { count: activeListings },
    { count: featuredListings },
    { count: enquiryCount },
  ] = await Promise.all([
    supabaseAdmin
      .from("developments")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supabaseAdmin
      .from("developments")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("is_featured", true),
    supabaseAdmin.from("enquiries").select("*", { count: "exact", head: true }),
  ]);

  const topStats = [
    { label: "Total Views",     value: "—",              icon: Eye,            scrollTo: null },
    { label: "Total Enquiries", value: enquiryCount ?? 0, icon: MessageSquare,  scrollTo: "enquiries" },
    { label: "Phone Clicks",    value: "—",              icon: Phone,          scrollTo: null },
    { label: "Total Share",     value: "—",              icon: Share2,         scrollTo: null },
  ];

  const hour = new Date().getHours();
  const timeLabel =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const emoji = hour < 12 ? "☀️" : hour < 18 ? "🌤️" : "🌙";
  const motivational = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length];

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Greeting bar */}
      <div
        className="relative overflow-hidden rounded-xl mb-6 px-8 py-6 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #1a2340 0%, #2d3a5e 60%, #3b4f82 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: "#e85d26" }}
        />
        <div
          className="absolute -bottom-8 right-32 w-32 h-32 rounded-full opacity-5"
          style={{ background: "#fff" }}
        />

        <div className="relative z-10">
          <p className="text-white/60 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-white font-bold text-2xl mb-1">
            {emoji} {timeLabel}, {firstName}!
          </h1>
          <p className="text-white/50 text-sm flex items-center gap-1.5">
            <Sparkles size={13} className="text-orange-400" />
            {motivational}
          </p>
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Platform Status</p>
            <p className="text-white font-semibold text-sm flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              All Systems Live
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(232,93,38,0.2)", border: "1px solid rgba(232,93,38,0.4)" }}
          >
            <TrendingUp size={18} className="text-orange-400" />
          </div>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {topStats.map((s) => {
          const Icon = s.icon;
          const inner = (
            <>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#1a2340" }}
              >
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest leading-tight">
                  {s.label}
                </p>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
              </div>
            </>
          );
          return s.scrollTo ? (
            <a
              key={s.label}
              href={`#${s.scrollTo}`}
              className="bg-white border border-gray-200 rounded px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-orange-400 transition-colors"
            >
              {inner}
            </a>
          ) : (
            <div
              key={s.label}
              className="bg-white border border-gray-200 rounded px-5 py-4 flex items-center gap-4"
            >
              {inner}
            </div>
          );
        })}
      </div>

      {/* Active / Featured Listings */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded p-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Active Listings
          </p>
          <p className="font-bold mb-3" style={{ fontSize: 48, color: "#e85d26" }}>
            {activeListings ?? 0}
          </p>
          <Link
            href="/admin/listings"
            className="text-xs font-bold uppercase tracking-widest text-orange-500 hover:underline"
          >
            VIEW LISTING »
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded p-6 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Featured Listings
          </p>
          <p className="font-bold mb-3" style={{ fontSize: 48, color: "#e85d26" }}>
            {featuredListings ?? 0}
          </p>
          <Link
            href="/admin/listings?filter=featured"
            className="text-xs font-bold uppercase tracking-widest text-orange-500 hover:underline"
          >
            VIEW LISTING »
          </Link>
        </div>
      </div>

      {/* Manage Your Listing */}
      <div className="bg-white border border-gray-200 rounded p-4 flex items-center justify-between mb-6">
        <p className="font-bold text-sm uppercase tracking-widest" style={{ color: "#1a2340" }}>
          Manage Your Listing
        </p>
        <Link
          href="/admin/listings"
          className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
        >
          VIEW
        </Link>
      </div>

      {/* Property Alert Sign Ups */}
      <DashboardTable
        title="Property Alert Sign Ups"
        pdfTitle="Property Alert Sign Ups"
        apiPath="/api/admin/property-alerts"
        columns={[
          { key: "full_name",     label: "Enquiry Name" },
          { key: "email",         label: "Email Address" },
          { key: "phone",         label: "Contact Number" },
          { key: "interest_type", label: "Category" },
          { key: "state",         label: "State" },
          { key: "occupation",    label: "Describe Yourself" },
          { key: "created_at",    label: "Date" },
        ]}
      />

      {/* Media Kit Enquiries */}
      <DashboardTable
        title="Media Kit Enquiries"
        pdfTitle="Media Kit Enquiries"
        apiPath="/api/admin/media-kit"
        columns={[
          { key: "full_name",  label: "Enquiry Name" },
          { key: "email",      label: "Email Address" },
          { key: "phone",      label: "Contact Number" },
          { key: "category",   label: "Category" },
          { key: "state",      label: "State" },
          { key: "created_at", label: "Date" },
        ]}
      />

      {/* Leads */}
      <DashboardTable
        title="Leads"
        pdfTitle="Leads"
        apiPath="/api/admin/leads"
        columns={[
          { key: "contact_name",    label: "Enquiry Name" },
          { key: "company",         label: "Agency" },
          { key: "phone",           label: "Contact Number" },
          { key: "development_name",label: "Project Name" },
          { key: "email",           label: "Email Address" },
          { key: "created_at",      label: "Date" },
        ]}
      />

      {/* Enquiries — anchor target for Total Enquiries stat card */}
      <div id="enquiries">
        <DashboardTable
          title="Enquiries"
          pdfTitle="Enquiries"
          apiPath="/api/admin/enquiries"
          columns={[
            { key: "full_name",    label: "Enquiry Name" },
            { key: "email",        label: "Email Address" },
            { key: "mobile",       label: "Contact Number" },
            { key: "project_name", label: "Project" },
            { key: "buyer_type",   label: "Category" },
            { key: "status",       label: "Status" },
            { key: "created_at",   label: "Date" },
          ]}
        />
      </div>

      {/* Listings table */}
      <ListingsTable />
    </div>
  );
}
