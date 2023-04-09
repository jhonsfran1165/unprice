alter table "public"."organization" add column "slug" character varying not null default uuid_generate_v4();

alter table "public"."page" alter column "slug" set default uuid_generate_v4();

alter table "public"."page" alter column "slug" set not null;

alter table "public"."page" alter column "slug" set data type character varying using "slug"::character varying;

alter table "public"."site" add column "slug" character varying not null default uuid_generate_v4();

alter table "public"."site" alter column "updated_at" set data type timestamp with time zone using "updated_at"::timestamp with time zone;

CREATE UNIQUE INDEX organization_slug_key ON public.organization USING btree (slug);

CREATE UNIQUE INDEX page_slug_key ON public.page USING btree (slug);

CREATE UNIQUE INDEX site_slug_key ON public.site USING btree (slug);

alter table "public"."organization" add constraint "organization_slug_key" UNIQUE using index "organization_slug_key";

alter table "public"."page" add constraint "page_slug_key" UNIQUE using index "page_slug_key";

alter table "public"."site" add constraint "site_slug_key" UNIQUE using index "site_slug_key";


