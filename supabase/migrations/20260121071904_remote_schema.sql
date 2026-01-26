drop extension if exists "pg_net";

alter table "public"."health_logs" drop constraint "health_logs_category_rules";

alter type "public"."health_category" rename to "health_category__old_version_to_be_dropped";

create type "public"."health_category" as enum ('Growth', 'Activity', 'Meds', 'Vaccine', 'Other');

alter table "public"."health_logs" alter column category type "public"."health_category" using category::text::"public"."health_category";

drop type "public"."health_category__old_version_to_be_dropped";

alter table "public"."health_logs" add column "other_description" text;

alter table "public"."health_logs" add column "other_name" text;

alter table "public"."health_logs" add column "vaccine_location" text;

alter table "public"."health_logs" add column "vaccine_name" text;

alter table "public"."health_logs" add constraint "health_logs_category_rules" CHECK ((((category = 'Growth'::public.health_category) AND ((growth_length IS NOT NULL) OR (growth_weight IS NOT NULL) OR (growth_head IS NOT NULL))) OR ((category = 'Activity'::public.health_category) AND (activity_type IS NOT NULL) AND (activity_duration IS NOT NULL)) OR ((category = 'Meds'::public.health_category) AND (meds_name IS NOT NULL) AND (meds_amount IS NOT NULL) AND (meds_time_taken IS NOT NULL)) OR ((category = 'Vaccine'::public.health_category) AND (vaccine_name IS NOT NULL)) OR ((category = 'Other'::public.health_category) AND (other_name IS NOT NULL)))) not valid;

alter table "public"."health_logs" validate constraint "health_logs_category_rules";


