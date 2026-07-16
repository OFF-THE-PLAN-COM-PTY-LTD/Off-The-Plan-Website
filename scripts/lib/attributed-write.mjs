/**
 * Attributed writes for scripts/*.mjs — make bulk operations traceable.
 * ============================================================================
 * Scripts run with the service-role key, so `auth.uid()` is NULL at the database
 * and the 052 audit trigger records every row a script touches as an anonymous
 * `service_role` write. That is how 91 accounts came to be created
 * already-archived by "a bulk script" with no way to tell WHICH script, or who
 * ran it. These helpers stamp each write with a script name instead.
 *
 * Usage — declare the actor once at the top of your script, then write through it:
 *
 *     import { attributedWriter } from "./lib/attributed-write.mjs";
 *     const as = attributedWriter(supabase, "script:my-backfill");
 *     await as.updateDevelopment(id, { account_id: acct });
 *     await as.updateAccount(id, { archived: true });
 *
 * The label MUST be `script:<name>` — the database rejects anything else, so a
 * script can never attribute its writes to a human. Human actors are identified
 * by uid only (see lib/supabase/attributed-writes.ts). Name it after the script
 * file so a row in audit_log points straight back at the code that wrote it.
 *
 * NOTE: these go through the 054 RPCs, which declare the actor and perform the
 * write inside ONE transaction. Calling a "set actor" RPC and then a separate
 * .update() would NOT work — set_config(..., true) is transaction-local and
 * PostgREST gives each request its own transaction, so the actor would be
 * silently dropped.
 */

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase service-role client
 * @param {string} label  actor label, must match `script:<name>`
 */
export function attributedWriter(supabase, label) {
  if (!/^script:[a-z0-9][a-z0-9._-]{0,60}$/.test(label)) {
    throw new Error(
      `attributedWriter: label must match script:<name> (got "${label}"). ` +
        `Scripts cannot attribute writes to a human.`,
    );
  }

  return {
    label,

    /** Attributed UPDATE on accounts. Returns { error } like supabase-js. */
    async updateAccount(id, patch) {
      const { error } = await supabase.rpc("admin_update_account", {
        p_account_id: id,
        p_patch: patch,
        p_actor_uid: null,
        p_actor_label: label,
      });
      return { error };
    },

    /** Attributed UPDATE on developments (incl. account_id listing transfers). */
    async updateDevelopment(id, patch) {
      const { error } = await supabase.rpc("admin_update_development", {
        p_development_id: id,
        p_patch: patch,
        p_actor_uid: null,
        p_actor_label: label,
      });
      return { error };
    },
  };
}
