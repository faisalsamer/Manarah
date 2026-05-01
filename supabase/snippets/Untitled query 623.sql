do $$ 
declare
  r record;
begin
  for r in (select tablename from pg_tables where schemaname = 'public') loop
    execute 'truncate table public.' || quote_ident(r.tablename) || ' cascade;';
  end loop;
end $$;