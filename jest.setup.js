// Placeholder env for tests. Deliberately NOT loading .env.local — tests must
// never run against real Supabase/Resend credentials; suites mock those clients.
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "placeholder-service-role-key";
delete process.env.RESEND_API_KEY;
