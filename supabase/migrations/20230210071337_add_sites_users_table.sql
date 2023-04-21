create table "public"."site_users" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "role" text default 'member'::text,
    "user_id" uuid,
    "site_id" bigint,
    "org_id" bigint
);


CREATE UNIQUE INDEX site_users_pkey ON public.site_users USING btree (id);

alter table "public"."site_users" add constraint "site_users_pkey" PRIMARY KEY using index "site_users_pkey";

alter table "public"."site_users" add constraint "site_users_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organization(id) not valid;

alter table "public"."site_users" validate constraint "site_users_org_id_fkey";

alter table "public"."site_users" add constraint "site_users_site_id_fkey" FOREIGN KEY (site_id) REFERENCES site(id) not valid;

alter table "public"."site_users" validate constraint "site_users_site_id_fkey";

alter table "public"."site_users" add constraint "site_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."site_users" validate constraint "site_users_user_id_fkey";

