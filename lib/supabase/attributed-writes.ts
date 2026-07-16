import { supabaseAdmin } from "./admin";

/**
 * Attributed writes — updates that record WHO made them.
 * ============================================================================
 * Every write in this app goes through the service-role client, so `auth.uid()`
 * is NULL at the database and the 052 audit trigger can only record
 * "service_role did it". These helpers route the writes that matter through the
 * RPCs added in 054, which declare the acting human and perform the update
 * inside a single Postgres function body.
 *
 * WHY AN RPC AND NOT TWO CALLS. The obvious approach —
 *
 *     await supabaseAdmin.rpc("set_audit_actor", { actor });
 *     await supabaseAdmin.from("accounts").update(patch).eq("id", id);
 *
 * — does not work. `set_config(..., true)` is transaction-local and PostgREST
 * runs every request in its own transaction, so the actor is discarded before
 * the update runs. It fails silently: the write succeeds, the actor is just
 * NULL. One RPC = one transaction = the trigger sees the actor. Don't "simplify"
 * these back into two calls.
 *
 * These are drop-in replacements for the `.update()` calls they replaced: same
 * single statement, same columns, same error shape.
 */

/**
 * Who is acting.
 *  - `{ uid }`    a real human, identified by auth.users.id. The readable label
 *                 in the audit log is derived from the uid IN THE DATABASE, so a
 *                 caller cannot name someone they aren't. Pass the id from the
 *                 verified session (requireAdmin() / requireMemberOrAdmin()) —
 *                 never anything taken from a request body.
 *  - `{ script }` a bulk/maintenance script. Must be `script:<name>`; the DB
 *                 rejects anything else, so this can never impersonate a human.
 */
export type Actor = { uid: string } | { script: string };

function actorArgs(actor: Actor) {
  return {
    p_actor_uid: "uid" in actor ? actor.uid : null,
    p_actor_label: "script" in actor ? actor.script : null,
  };
}

/** Attributed UPDATE on `accounts` (archive/unarchive, publish, type, portal_status, ...). */
export async function updateAccountAttributed(
  id: string,
  patch: Record<string, unknown>,
  actor: Actor,
) {
  const { error } = await supabaseAdmin.rpc("admin_update_account", {
    p_account_id: id,
    p_patch: patch,
    ...actorArgs(actor),
  });
  return { error };
}

/** Attributed UPDATE on `developments` (incl. account_id — moving a listing between profiles). */
export async function updateDevelopmentAttributed(
  id: string,
  patch: Record<string, unknown>,
  actor: Actor,
) {
  const { error } = await supabaseAdmin.rpc("admin_update_development", {
    p_development_id: id,
    p_patch: patch,
    ...actorArgs(actor),
  });
  return { error };
}
