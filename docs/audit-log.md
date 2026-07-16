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
| `actor_uid`       | `auth.uid()` — **NULL for every service-role write**           |
| `actor_hint`      | app-declared actor, read from `current_setting('app.actor')`   |

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

## ⚠️ The `app.actor` caveat — read this before trusting `actor_uid`

**Right now, admin writes are attributed only as `service_role`.**

Every admin and portal write in this app goes through the service-role client
(`lib/supabase/admin.ts`), and the maintenance scripts in `scripts/*.mjs` use the
service-role key too. The service role's JWT is a key, not a human, so
`auth.uid()` is **NULL** for all of those writes. Left as-is, the audit log
answers "a service-role caller did it" — which is exactly the answer that was not
good enough in July 2026.

`actor_hint` is the way out. The application declares the acting admin for the
transaction before it writes; the trigger reads it back out of the session. This
migration does **not** wire that up — that's the follow-up below.

### The snippet a developer needs to add

Before an admin write, in the same session/transaction, declare the actor. The
`true` third argument makes it transaction-local, so it can't leak to another
request on a pooled connection:

```sql
select set_config('app.actor', '<user id or email>', true);
```

Via supabase-js you need an RPC to run it, since the JS client can't issue raw
SQL. Add a small helper function:

```sql
-- Migration: expose set_config to the service role.
create or replace function public.set_audit_actor(actor text)
returns void as $$
  select set_config('app.actor', actor, true);
$$ language sql;
```

then call it immediately before the write:

```ts
// Declare who is acting, then write. Must be the same connection.
await supabaseAdmin.rpc("set_audit_actor", { actor: session.user.email });
await supabaseAdmin.from("accounts").update({ archived: true }).eq("id", id);
```

**Caveat on the caveat:** `set_config(..., true)` is transaction-local, and
PostgREST runs each request in its own transaction. Two separate supabase-js
calls are two transactions, so the setting will **not** carry from the `rpc()`
into the `update()`. Doing this properly means one of:

1. **A single RPC per mutation** that sets the actor and performs the write in one
   function body (most robust, most work).
2. **`set_config(..., false)`** (session-local) — works, but is unsafe on a pooled
   connection: the value leaks to whoever gets that connection next.
3. **Passing the actor into a wrapper RPC** that does both.

Option 1 is the right answer for the writes that matter (archive/unarchive,
publish, move listing). Don't ship option 2.

### Follow-up task

- [ ] Add `set_audit_actor` and route the high-value admin mutations
      (archive/unarchive, publish/unpublish, move listing) through a single RPC
      that declares the actor and performs the write in one transaction.
- [ ] Have `scripts/*.mjs` declare an actor (e.g. `script:backfill-accounts`) so
      bulk runs are attributable to a script rather than an anonymous
      `service_role`.
- [ ] Consider an `/admin` UI to read the trail.

Until the first item lands, `actor_hint` will be NULL and `db_role` will read
`service_role` for admin writes.

## Querying it

Reconstruct one row's history:

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
