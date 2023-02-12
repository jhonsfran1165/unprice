add trigger profile

-- inserts a row into public.users
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
insert into public.profiles (id)
values (new.id);
return new;
end;

$$
;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
$$

--- generate types and migrations supabase ---

supabase gen types typescript --local > types/database.types.ts -> create types
supabase db diff --use-migra -f seeding_data -> create migrations

pg_dump --column-inserts --data-only postgresql://postgres:postgres@localhost:54322 > supabase/dump.sql

---

colors: https://convertacolor.com/

report web vitals? https://github.com/SimeonGriggs/tints.dev/blob/main/app/reportWebVitals.ts

Copy shandcnd with theme variables
https://github.com/shadcn/ui/issues/52
