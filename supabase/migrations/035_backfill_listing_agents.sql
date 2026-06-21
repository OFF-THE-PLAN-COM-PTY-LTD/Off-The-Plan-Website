-- Backfill listing_agents from the flat agent_name / agent_phone /
-- agent_email columns on developments. The legacy data import
-- populated those flat fields directly on the development row, but
-- the new admin form reads from the listing_agents table — so every
-- imported listing showed the agent on its public page but had an
-- empty Selling Agent(s) section in the admin form.
--
-- For every development that has agent_name set AND no rows in
-- listing_agents, insert one row carrying over what we know. After
-- this runs, the admin form will show the legacy agents and Tim can
-- edit them. The public detail page is updated in the same commit to
-- prefer listing_agents data, so future edits flow through.
--
-- Idempotent — the NOT EXISTS guard means re-running this is safe.
insert into listing_agents (development_id, name, email, mobile, sort_order, created_at)
select
  d.id,
  d.agent_name,
  d.agent_email,
  d.agent_phone,
  0,
  coalesce(d.created_at, now())
from developments d
where d.agent_name is not null
  and trim(d.agent_name) <> ''
  and not exists (
    select 1 from listing_agents la where la.development_id = d.id
  );
