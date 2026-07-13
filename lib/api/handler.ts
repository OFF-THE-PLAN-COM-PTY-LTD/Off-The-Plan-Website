import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireMemberOrAdmin } from "@/lib/supabase/auth-guards";

/**
 * Composable wrappers for App Router route handlers.
 *
 * Usage:
 *   export const GET  = withAdmin(async (req, { auth }) => { ... });
 *   export const POST = withMemberOrAdmin(
 *     withValidation(schema, async (req, { auth, data }) => { ... })
 *   );
 *
 * The wrappers return early with the exact same responses the guards /
 * inline checks produce today (401 Unauthorized, 403 Forbidden,
 * 400 { error: "Invalid data" }), so converting a route must not change
 * its behavior for valid requests.
 */

/** Success payload of the auth guards (user + role flags). */
export type AuthInfo = Exclude<
  Awaited<ReturnType<typeof requireAdmin>>,
  { error: NextResponse }
>;

/** The second argument Next.js passes to App Router route handlers. */
export type RouteContext = { params?: Record<string, string | string[]> };

type MaybePromise<T> = T | Promise<T>;

type Guard = () => Promise<{ error: NextResponse } | AuthInfo>;

function makeGuardWrapper(guard: Guard) {
  return function wrap<C extends RouteContext = RouteContext>(
    handler: (req: Request, ctx: C & { auth: AuthInfo }) => MaybePromise<Response>
  ) {
    return async (req: Request, ctx?: C): Promise<Response> => {
      const auth = await guard();
      if ("error" in auth) return auth.error;
      return handler(req, { ...(ctx as C), auth });
    };
  };
}

/** Run the handler only for a logged-in admin; otherwise 401/403 as today. */
export const withAdmin = makeGuardWrapper(requireAdmin);

/** Run the handler only for an admin or Developer/Agent member. */
export const withMemberOrAdmin = makeGuardWrapper(requireMemberOrAdmin);

/**
 * Parse the JSON body with `schema` before running the handler.
 * Malformed JSON and schema failures both return the codebase-standard
 * 400 { error: "Invalid data" }.
 */
export function withValidation<
  S extends z.ZodTypeAny,
  C extends RouteContext = RouteContext,
>(
  schema: S,
  handler: (req: Request, ctx: C & { data: z.output<S> }) => MaybePromise<Response>
) {
  return async (req: Request, ctx?: C): Promise<Response> => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return handler(req, { ...(ctx as C), data: parsed.data });
  };
}
