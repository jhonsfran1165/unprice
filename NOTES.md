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

supabase gen types typescript --local > lib/types/database.types.ts ====> create types
supabase db diff --use-migra -f seeding_data -> create migrations

pnpm supabase-to-zod --input ib/types/database.types.ts --output schemas.ts

pg_dump --column-inserts --data-only postgresql://postgres:postgres@localhost:54322 > supabase/dump.sql

---

colors: https://convertacolor.com/

report web vitals? https://github.com/SimeonGriggs/tints.dev/blob/main/app/reportWebVitals.ts

Copy shandcnd with theme variables
https://github.com/shadcn/ui/issues/52

https://blog.logrocket.com/applying-dynamic-styles-tailwind-css/

https://next-cloudinary.spacejelly.dev/components/cldimage/basic-usage

https://supabase.com/docs/reference/cli/start

stripe listen --forward-to localhost:3000/api/stripe/webhook

https://www.cybertec-postgresql.com/en/view-permissions-and-row-level-security-in-postgresql/

https://www.stackducky.com/supabase/supabase-create-view

https://makerkit.dev/blog/tutorials/guide-nextjs-stripe

https://levelup.gitconnected.com/how-to-stream-real-time-openai-api-responses-next-js-13-2-gpt-3-5-turbo-and-edge-functions-378fea4dadbd

https://upstash.com/blog/quota-based-saas

# account

https://supabase.com/docs/reference/javascript/v1/auth-update
https://supabase.com/docs/reference/javascript/auth-signup

https://github.com/orgs/supabase/discussions/1148

plan: "TRIAL"
user_level: 100
group_name: "Super Guild!"
joined_on: "2022-05-20T14:28:18.217Z"
group_manager: false
items: ["toothpick", "string", "ring"]

https://supabase.com/docs/guides/auth/row-level-security#policies-with-security-definer-functions

# zod validation example

https://gist.github.com/pom421/ea34eeb778b0d94fe85352dc27aada96

# implement TRPC

# https://github.com/chronark/access for roles

<!-- https://github.com/clerkinc/use-stripe-subscription-demo -->
<!-- https://www.tinybird.co/blog-posts/dev-qa-global-api-latency-chronark -->

see clerk organization
