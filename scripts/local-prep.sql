-- LOCAL REHEARSAL ONLY. Do NOT run against production.
-- We copy prod public data into local but do not recreate auth.users, so drop
-- every public-schema foreign key that references auth.users. This lets
-- profiles (id) and developments (owner_user_id) load with their prod ids.
do $$
declare r record;
begin
  for r in
    select con.conname, cl.relname
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    join pg_namespace ns on ns.oid = cl.relnamespace
    join pg_class fcl on fcl.oid = con.confrelid
    join pg_namespace fns on fns.oid = fcl.relnamespace
    where con.contype = 'f'
      and ns.nspname = 'public'
      and fns.nspname = 'auth'
      and fcl.relname = 'users'
  loop
    execute format('alter table public.%I drop constraint %I', r.relname, r.conname);
    raise notice 'dropped FK % on public.%', r.conname, r.relname;
  end loop;
end $$;
