# Audit log — who changed what, when

## Why this exists

In July 2026 the client asked who archived 119 of the 148 rows in `accounts`. We
could not answer, because the database had no audit trail of any kind:

- No audit or log table existed — all 18 public tables were business data.
- `accounts` carried only `archived`, `created_at`, `updated_at`. There was no
  `archived_by`, no `updated_by`, not even an `archived_at`.
- `auth.audit_log_entries` (GoTrue's own table) had 0 rows.

The best we could do was *infer* history from `updated_at` clustering: 91 accounts
were created already-archived by a bulk script (2026-07-13 12:23), and 24 were
bulk-archived within a single minute (2026-07-16 00:19) — exactly the developer
accounts that listings had just been re-attributed to. **Who** did it was
unrecoverable.

`supabase/migrations/052_audit_log.sql` makes that question answerable going
forward.

## What it does

A single generic trigger function, `public.audit_row_change()`, is attached
`after insert or update or delete` on the two tables that matter:

| Table          | Columns worth watching                                        |
| -------------- | ------------------------------------------------------------- |
| `accounts`     | `archived`, `is_published`, `type`, `portal_status`, `slug`, `user_id` |
| `developments` | `account_id`, `is_published`, `status`, `tier`, `slug`         |

Those columns are **not** special-cased — the trigger stores the entire old and
new row as JSONB, so nothing is lost and the trigger never rots as the schema
changes. They are simply what you'll want to filter `changed_columns` on.

Each change appends one row to `public.audit_log`:

| Column            | Meaning                                                        |
| ----------------- | -------------------------------------------------------------- |
| `id`              | `bigserial` PK                                                 |
| `changed_at`      | `timestamptz`, defaults to `now()`                             |
| `table_name`      | `accounts` or `developments`                                   |
| `row_id`          | the affected row's uuid PK                                     |
| `op`              | `INSERT` / `UPDATE` / `DELETE`                                 |
| `changed_columns` | `text[]` — only the columns that actually moved (UPDATE only)  |
| `old_row`         | whole row before (null on INSERT)                              |
| `new_row`         | whole row after (null on DELETE)                               |
| `db_role`         | `auth.role()`, e.g. `service_role` / `authenticated`           |
| `actor_uid`       | the acting user's uuid — `auth.uid()`, else the actor declared by the app (054) |
| `actor_hint`      | readable actor label: `user:<email>` or `script:<name>` (054)  |

Notes:

- The trigger is deliberately **AFTER**, not BEFORE. `accounts` already has a
  BEFORE UPDATE trigger (`protect_account_admin_columns_trg`, migration 046) that
  reverts protected columns for non-service-role callers. Running AFTER records
  the final values that actually landed, and never interferes with that trigger.
- A no-op UPDATE (writing identical values) is not logged.
- Expect `updated_at` to appear in `changed_columns` on most UPDATEs — both tables
  have a `set_updated_at_*` BEFORE trigger. Filter it out when hunting for
  meaningful changes.
- The table is **append-only**. RLS is on, admins (`profiles.is_admin`) can read,
  and there is deliberately no insert/update/delete policy — nobody writing
  through PostgREST can forge, amend, or erase an audit row. The trigger is
  `security definer`, so it writes regardless.

## Actor attribution — how "who" actually gets recorded

`supabase/migrations/054_audit_actor_attribution.sql` wires this up. Read this
section before adding a new mutation.

Every admin and portal write goes through the service-role client
(`lib/supabase/admin.ts`), and `scripts/*.mjs` use the service-role key. The
service role's JWT is a key, not a human, so `auth.uid()` is **NULL** for all of
them. Left alone, the log answers "a service-role caller did it" — exactly the
answer that was not good enough in July 2026.

054 fixes that with a pair of RPCs that declare the actor **and** perform the
write in one function body:

| RPC                          | Table          | Used by                                          |
| ---------------------------- | -------------- | ------------------------------------------------ |
| `admin_update_account`       | `accounts`     | `app/api/admin/agencies/route.ts`, `.../interest-type/route.ts` |
| `admin_update_development`   | `developments` | `app/api/admin/listings/route.ts`                |

From app code, use the wrappers rather than the raw RPC:

```ts
import { updateAccountAttributed } from "@/lib/supabase/attributed-writes";

const auth = await requireAdmin();          // verified session
if ("error" in auth) return auth.error;
await updateAccountAttributed(id, { archived: true }, { uid: auth.user.id });
```

From a script:

```js
import { attributedWriter } from "./lib/attributed-write.mjs";
const as = attributedWriter(supabase, "script:my-backfill");
await as.updateDevelopment(id, { account_id: acct });
```

### ⚠️ The transaction trap — why it must be ONE call

This is the part that bites. The obvious wiring does **not** work:

```ts
// BROKEN — do not do this.
await supabaseAdmin.rpc("set_audit_actor", { actor: email });     // transaction 1
await supabaseAdmin.from("accounts").update({ archived: true });  // transaction 2
```

`set_config(..., true)` is **transaction-local**, and PostgREST runs every
request in its own transaction. The actor is discarded when the first request
ends, so the trigger in the second sees nothing. It fails **silently**: the write
succeeds and `actor_hint` is simply NULL — you don't find out until someone asks
who did it, which is the whole problem this table exists to solve.

Verified against the local DB: two-transaction ⇒ `actor_hint` NULL;
same-transaction ⇒ `actor_hint` captured.

The other tempting fix — `set_config(..., false)` (session-local) — survives
across the two calls and is **worse**: Supabase pools connections, so the value
sticks to the connection and leaks into whatever unrelated request picks it up
next, silently mis-attributing someone else's write to you. Never ship it.

Hence: the actor is declared inside the same function body as the `update`. One
RPC, one transaction, one audit row.

### Spoofing

Two independent locks:

1. **Reachability.** The RPCs are `execute`-granted to `service_role` **only**
   (revoked from `public`/`anon`/`authenticated`). A browser client cannot call
   them through PostgREST at all — verified: `permission denied for function`.
   The only caller is our own server, which takes the actor from the verified
   session (`requireAdmin()` / `requireMemberOrAdmin()`), never from the body.
2. **Underivability.** A human is named by **uuid**; the `user:<email>` label is
   looked up from `auth.users` inside the database. Callers cannot pass a
   human-readable actor string at all — free text is regex-restricted to
   `script:<name>`. So even a compromised route cannot invent
   `tim@offtheplan.com`; it can only name a uid that really exists.

**Do not** later expose a bare `set_config`/`set_actor` RPC to `authenticated` —
that would hand any logged-in user the ability to stamp `app.actor` with whatever
they like and defeat lock #2.

### Adding attribution to another mutation

The pattern for any further table: swap the `.update()` for an RPC that calls
`audit_declare_actor(p_actor_uid, p_actor_label)` and then writes, in the same
function body; revoke execute from `public, anon, authenticated`; grant it to
`service_role`; pass the uid from the verified session. Copy
`admin_update_account` in 054 — the jsonb-patch shape is a drop-in for a
supabase-js `.update()` and keeps one human action as one audit row.

### What is NOT attributed yet

- **INSERTs and DELETEs** on both tables (listing create/delete, signup). They
  are still logged, just as an anonymous `service_role`.
- **Other `scripts/*.mjs`.** The mechanism is available to all of them via
  `scripts/lib/attributed-write.mjs`; only
  `backfill-development-account-id.mjs` currently uses it.
- **Writes made by hand** in the Supabase dashboard/SQL editor — logged with
  `db_role`/`session_user`, no human label. Unavoidable at this layer.
- **Other tables.** Only `accounts` and `developments` are audited at all.

## Querying it — "who changed this?"

Run these in the Supabase SQL editor. `actor_hint` is the answer to "who":
`user:<email>` is a human, `script:<name>` is a bulk run, and NULL means the
write did not go through an attributed path (see *What is NOT attributed yet*).

### The history of one account

Everything that ever happened to it, most recent first. `updated_at` is filtered
out of the display because a `set_updated_at` trigger puts it on nearly every row.

```sql
select changed_at,
       op,
       array_remove(changed_columns, 'updated_at') as changed,
       coalesce(actor_hint, '(unattributed ' || db_role || ')') as who
  from audit_log
 where table_name = 'accounts'
   and row_id = '<account uuid>'
 order by changed_at desc;
```

### The history of one listing — including who moved it between profiles

This is the client's core question. `account_id` changing is a listing being
re-attributed from one developer/agency profile to another.

```sql
select a.changed_at,
       coalesce(a.actor_hint, '(unattributed ' || a.db_role || ')') as who,
       old_acct.name as moved_from,
       new_acct.name as moved_to
  from audit_log a
  left join accounts old_acct on old_acct.id = (a.old_row ->> 'account_id')::uuid
  left join accounts new_acct on new_acct.id = (a.new_row ->> 'account_id')::uuid
 where a.table_name = 'developments'
   and a.row_id = '<listing uuid>'
   and 'account_id' = any(a.changed_columns)
 order by a.changed_at desc;
```

Find the listing's uuid by slug first:
`select id, name from developments where slug = '<slug>';`

### Who archived this account, and when

```sql
select changed_at, coalesce(actor_hint, '(unattributed ' || db_role || ')') as who
  from audit_log
 where table_name = 'accounts'
   and row_id = '<account uuid>'
   and 'archived' = any(changed_columns)
   and new_row ->> 'archived' = 'true'
 order by changed_at desc
 limit 1;
```

### Everything one person did

```sql
select changed_at, table_name, row_id,
       array_remove(changed_columns, 'updated_at') as changed
  from audit_log
 where actor_hint = 'user:tim@example.com'   -- or 'script:archived-to-inactive'
 order by changed_at desc
 limit 100;
```

### Reconstruct one row's history (raw)

```sql
select changed_at, op, changed_columns, db_role, actor_uid, actor_hint
  from audit_log
 where table_name = 'accounts'
   and row_id = '<uuid>'
 order by changed_at desc;
```

Find a bulk-change cluster (the query we wished we'd had):

```sql
select date_trunc('minute', changed_at) as minute,
       db_role, actor_hint, count(*)
  from audit_log
 where table_name = 'accounts'
   and 'archived' = any(changed_columns)
 group by 1, 2, 3
 having count(*) > 5
 order by minute desc;
```

Who archived a specific account:

```sql
select changed_at, db_role, actor_uid, actor_hint
  from audit_log
 where table_name = 'accounts'
   and row_id = '<uuid>'
   and 'archived' = any(changed_columns)
   and new_row ->> 'archived' = 'true'
 order by changed_at desc
 limit 1;
```

## Retention

Nothing prunes `audit_log` yet. It stores two whole row copies per change, so it
will grow faster than the audited tables. At current volumes (hundreds of rows,
occasional bulk scripts) that's a non-issue, but if it becomes one, delete rows
older than N months — or move `old_row`/`new_row` to a cold table and keep the
metadata, which is the part that answers "who".
