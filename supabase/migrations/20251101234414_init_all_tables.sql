create type "public"."health_category" as enum ('Growth', 'Activity', 'Meds');

create type "public"."milestone_category" as enum ('Motor', 'Language', 'Social', 'Cognitive', 'Other');

create table "public"."children" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."children" enable row level security;

create table "public"."diaper_logs" (
    "id" uuid not null default gen_random_uuid(),
    "child_id" uuid not null,
    "consistency" text not null,
    "amount" text not null,
    "note" text,
    "change_time" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now(),
    "logged_at" timestamp with time zone not null default now()
);


alter table "public"."diaper_logs" enable row level security;

create table "public"."feeding_logs" (
    "id" uuid not null default gen_random_uuid(),
    "child_id" uuid not null,
    "category" text not null,
    "item_name" text not null,
    "amount" text not null,
    "feeding_time" timestamp with time zone not null,
    "note" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."feeding_logs" enable row level security;

create table "public"."health_logs" (
    "id" uuid not null default gen_random_uuid(),
    "child_id" uuid not null,
    "category" health_category not null,
    "date" timestamp with time zone not null,
    "growth_length" text,
    "growth_weight" text,
    "growth_head" text,
    "activity_type" text,
    "activity_duration" text,
    "meds_name" text,
    "meds_amount" text,
    "meds_time_taken" timestamp with time zone,
    "note" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."health_logs" enable row level security;

create table "public"."milestone_logs" (
    "id" uuid not null default gen_random_uuid(),
    "child_id" uuid not null,
    "title" text not null,
    "category" milestone_category default 'Other'::milestone_category,
    "note" text,
    "achieved_at" timestamp with time zone not null,
    "photo_url" text,
    "source" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."milestone_logs" enable row level security;

create table "public"."nursing_logs" (
    "id" uuid not null default gen_random_uuid(),
    "child_id" uuid not null,
    "left_duration" text,
    "right_duration" text,
    "left_amount" text,
    "right_amount" text,
    "note" text,
    "logged_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."nursing_logs" enable row level security;

create table "public"."sleep_logs" (
    "id" uuid not null default gen_random_uuid(),
    "child_id" uuid not null,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "duration" text not null,
    "note" text,
    "logged_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."sleep_logs" enable row level security;

CREATE UNIQUE INDEX children_pkey ON public.children USING btree (id);

CREATE INDEX diaper_logs_child_time_idx ON public.diaper_logs USING btree (child_id, logged_at DESC);

CREATE UNIQUE INDEX diaper_logs_pkey ON public.diaper_logs USING btree (id);

CREATE INDEX feeding_logs_child_time_idx ON public.feeding_logs USING btree (child_id, feeding_time DESC);

CREATE UNIQUE INDEX feeding_logs_pkey ON public.feeding_logs USING btree (id);

CREATE INDEX health_logs_child_date_idx ON public.health_logs USING btree (child_id, date DESC);

CREATE UNIQUE INDEX health_logs_pkey ON public.health_logs USING btree (id);

CREATE INDEX idx_children_user_id ON public.children USING btree (user_id);

CREATE INDEX idx_diaper_logs_changed ON public.diaper_logs USING btree (change_time);

CREATE INDEX idx_diaper_logs_child ON public.diaper_logs USING btree (child_id);

CREATE INDEX milestone_logs_child_time_idx ON public.milestone_logs USING btree (child_id, achieved_at DESC);

CREATE UNIQUE INDEX milestone_logs_pkey ON public.milestone_logs USING btree (id);

CREATE INDEX nursing_logs_child_time_idx ON public.nursing_logs USING btree (child_id, logged_at DESC);

CREATE UNIQUE INDEX nursing_logs_pkey ON public.nursing_logs USING btree (id);

CREATE INDEX sleep_logs_child_time_idx ON public.sleep_logs USING btree (child_id, end_time DESC);

CREATE UNIQUE INDEX sleep_logs_pkey ON public.sleep_logs USING btree (id);

alter table "public"."children" add constraint "children_pkey" PRIMARY KEY using index "children_pkey";

alter table "public"."diaper_logs" add constraint "diaper_logs_pkey" PRIMARY KEY using index "diaper_logs_pkey";

alter table "public"."feeding_logs" add constraint "feeding_logs_pkey" PRIMARY KEY using index "feeding_logs_pkey";

alter table "public"."health_logs" add constraint "health_logs_pkey" PRIMARY KEY using index "health_logs_pkey";

alter table "public"."milestone_logs" add constraint "milestone_logs_pkey" PRIMARY KEY using index "milestone_logs_pkey";

alter table "public"."nursing_logs" add constraint "nursing_logs_pkey" PRIMARY KEY using index "nursing_logs_pkey";

alter table "public"."sleep_logs" add constraint "sleep_logs_pkey" PRIMARY KEY using index "sleep_logs_pkey";

alter table "public"."children" add constraint "children_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."children" validate constraint "children_user_id_fkey";

alter table "public"."diaper_logs" add constraint "diaper_logs_child_id_fkey" FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE not valid;

alter table "public"."diaper_logs" validate constraint "diaper_logs_child_id_fkey";

alter table "public"."feeding_logs" add constraint "feeding_logs_child_id_fkey" FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE not valid;

alter table "public"."feeding_logs" validate constraint "feeding_logs_child_id_fkey";

alter table "public"."health_logs" add constraint "health_logs_category_rules" CHECK ((((category = 'Growth'::health_category) AND ((growth_length IS NOT NULL) OR (growth_weight IS NOT NULL) OR (growth_head IS NOT NULL))) OR ((category = 'Activity'::health_category) AND (activity_type IS NOT NULL) AND (activity_duration IS NOT NULL)) OR ((category = 'Meds'::health_category) AND (meds_name IS NOT NULL) AND (meds_amount IS NOT NULL) AND (meds_time_taken IS NOT NULL)))) not valid;

alter table "public"."health_logs" validate constraint "health_logs_category_rules";

alter table "public"."health_logs" add constraint "health_logs_child_id_fkey" FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE not valid;

alter table "public"."health_logs" validate constraint "health_logs_child_id_fkey";

alter table "public"."milestone_logs" add constraint "milestone_logs_child_id_fkey" FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE not valid;

alter table "public"."milestone_logs" validate constraint "milestone_logs_child_id_fkey";

alter table "public"."nursing_logs" add constraint "nursing_logs_child_id_fkey" FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE not valid;

alter table "public"."nursing_logs" validate constraint "nursing_logs_child_id_fkey";

alter table "public"."sleep_logs" add constraint "sleep_logs_child_id_fkey" FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE not valid;

alter table "public"."sleep_logs" validate constraint "sleep_logs_child_id_fkey";

alter table "public"."sleep_logs" add constraint "sleep_time_valid" CHECK ((end_time > start_time)) not valid;

alter table "public"."sleep_logs" validate constraint "sleep_time_valid";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."children" to "anon";

grant insert on table "public"."children" to "anon";

grant references on table "public"."children" to "anon";

grant select on table "public"."children" to "anon";

grant trigger on table "public"."children" to "anon";

grant truncate on table "public"."children" to "anon";

grant update on table "public"."children" to "anon";

grant delete on table "public"."children" to "authenticated";

grant insert on table "public"."children" to "authenticated";

grant references on table "public"."children" to "authenticated";

grant select on table "public"."children" to "authenticated";

grant trigger on table "public"."children" to "authenticated";

grant truncate on table "public"."children" to "authenticated";

grant update on table "public"."children" to "authenticated";

grant delete on table "public"."children" to "service_role";

grant insert on table "public"."children" to "service_role";

grant references on table "public"."children" to "service_role";

grant select on table "public"."children" to "service_role";

grant trigger on table "public"."children" to "service_role";

grant truncate on table "public"."children" to "service_role";

grant update on table "public"."children" to "service_role";

grant delete on table "public"."diaper_logs" to "anon";

grant insert on table "public"."diaper_logs" to "anon";

grant references on table "public"."diaper_logs" to "anon";

grant select on table "public"."diaper_logs" to "anon";

grant trigger on table "public"."diaper_logs" to "anon";

grant truncate on table "public"."diaper_logs" to "anon";

grant update on table "public"."diaper_logs" to "anon";

grant delete on table "public"."diaper_logs" to "authenticated";

grant insert on table "public"."diaper_logs" to "authenticated";

grant references on table "public"."diaper_logs" to "authenticated";

grant select on table "public"."diaper_logs" to "authenticated";

grant trigger on table "public"."diaper_logs" to "authenticated";

grant truncate on table "public"."diaper_logs" to "authenticated";

grant update on table "public"."diaper_logs" to "authenticated";

grant delete on table "public"."diaper_logs" to "service_role";

grant insert on table "public"."diaper_logs" to "service_role";

grant references on table "public"."diaper_logs" to "service_role";

grant select on table "public"."diaper_logs" to "service_role";

grant trigger on table "public"."diaper_logs" to "service_role";

grant truncate on table "public"."diaper_logs" to "service_role";

grant update on table "public"."diaper_logs" to "service_role";

grant delete on table "public"."feeding_logs" to "anon";

grant insert on table "public"."feeding_logs" to "anon";

grant references on table "public"."feeding_logs" to "anon";

grant select on table "public"."feeding_logs" to "anon";

grant trigger on table "public"."feeding_logs" to "anon";

grant truncate on table "public"."feeding_logs" to "anon";

grant update on table "public"."feeding_logs" to "anon";

grant delete on table "public"."feeding_logs" to "authenticated";

grant insert on table "public"."feeding_logs" to "authenticated";

grant references on table "public"."feeding_logs" to "authenticated";

grant select on table "public"."feeding_logs" to "authenticated";

grant trigger on table "public"."feeding_logs" to "authenticated";

grant truncate on table "public"."feeding_logs" to "authenticated";

grant update on table "public"."feeding_logs" to "authenticated";

grant delete on table "public"."feeding_logs" to "service_role";

grant insert on table "public"."feeding_logs" to "service_role";

grant references on table "public"."feeding_logs" to "service_role";

grant select on table "public"."feeding_logs" to "service_role";

grant trigger on table "public"."feeding_logs" to "service_role";

grant truncate on table "public"."feeding_logs" to "service_role";

grant update on table "public"."feeding_logs" to "service_role";

grant delete on table "public"."health_logs" to "anon";

grant insert on table "public"."health_logs" to "anon";

grant references on table "public"."health_logs" to "anon";

grant select on table "public"."health_logs" to "anon";

grant trigger on table "public"."health_logs" to "anon";

grant truncate on table "public"."health_logs" to "anon";

grant update on table "public"."health_logs" to "anon";

grant delete on table "public"."health_logs" to "authenticated";

grant insert on table "public"."health_logs" to "authenticated";

grant references on table "public"."health_logs" to "authenticated";

grant select on table "public"."health_logs" to "authenticated";

grant trigger on table "public"."health_logs" to "authenticated";

grant truncate on table "public"."health_logs" to "authenticated";

grant update on table "public"."health_logs" to "authenticated";

grant delete on table "public"."health_logs" to "service_role";

grant insert on table "public"."health_logs" to "service_role";

grant references on table "public"."health_logs" to "service_role";

grant select on table "public"."health_logs" to "service_role";

grant trigger on table "public"."health_logs" to "service_role";

grant truncate on table "public"."health_logs" to "service_role";

grant update on table "public"."health_logs" to "service_role";

grant delete on table "public"."milestone_logs" to "anon";

grant insert on table "public"."milestone_logs" to "anon";

grant references on table "public"."milestone_logs" to "anon";

grant select on table "public"."milestone_logs" to "anon";

grant trigger on table "public"."milestone_logs" to "anon";

grant truncate on table "public"."milestone_logs" to "anon";

grant update on table "public"."milestone_logs" to "anon";

grant delete on table "public"."milestone_logs" to "authenticated";

grant insert on table "public"."milestone_logs" to "authenticated";

grant references on table "public"."milestone_logs" to "authenticated";

grant select on table "public"."milestone_logs" to "authenticated";

grant trigger on table "public"."milestone_logs" to "authenticated";

grant truncate on table "public"."milestone_logs" to "authenticated";

grant update on table "public"."milestone_logs" to "authenticated";

grant delete on table "public"."milestone_logs" to "service_role";

grant insert on table "public"."milestone_logs" to "service_role";

grant references on table "public"."milestone_logs" to "service_role";

grant select on table "public"."milestone_logs" to "service_role";

grant trigger on table "public"."milestone_logs" to "service_role";

grant truncate on table "public"."milestone_logs" to "service_role";

grant update on table "public"."milestone_logs" to "service_role";

grant delete on table "public"."nursing_logs" to "anon";

grant insert on table "public"."nursing_logs" to "anon";

grant references on table "public"."nursing_logs" to "anon";

grant select on table "public"."nursing_logs" to "anon";

grant trigger on table "public"."nursing_logs" to "anon";

grant truncate on table "public"."nursing_logs" to "anon";

grant update on table "public"."nursing_logs" to "anon";

grant delete on table "public"."nursing_logs" to "authenticated";

grant insert on table "public"."nursing_logs" to "authenticated";

grant references on table "public"."nursing_logs" to "authenticated";

grant select on table "public"."nursing_logs" to "authenticated";

grant trigger on table "public"."nursing_logs" to "authenticated";

grant truncate on table "public"."nursing_logs" to "authenticated";

grant update on table "public"."nursing_logs" to "authenticated";

grant delete on table "public"."nursing_logs" to "service_role";

grant insert on table "public"."nursing_logs" to "service_role";

grant references on table "public"."nursing_logs" to "service_role";

grant select on table "public"."nursing_logs" to "service_role";

grant trigger on table "public"."nursing_logs" to "service_role";

grant truncate on table "public"."nursing_logs" to "service_role";

grant update on table "public"."nursing_logs" to "service_role";

grant delete on table "public"."sleep_logs" to "anon";

grant insert on table "public"."sleep_logs" to "anon";

grant references on table "public"."sleep_logs" to "anon";

grant select on table "public"."sleep_logs" to "anon";

grant trigger on table "public"."sleep_logs" to "anon";

grant truncate on table "public"."sleep_logs" to "anon";

grant update on table "public"."sleep_logs" to "anon";

grant delete on table "public"."sleep_logs" to "authenticated";

grant insert on table "public"."sleep_logs" to "authenticated";

grant references on table "public"."sleep_logs" to "authenticated";

grant select on table "public"."sleep_logs" to "authenticated";

grant trigger on table "public"."sleep_logs" to "authenticated";

grant truncate on table "public"."sleep_logs" to "authenticated";

grant update on table "public"."sleep_logs" to "authenticated";

grant delete on table "public"."sleep_logs" to "service_role";

grant insert on table "public"."sleep_logs" to "service_role";

grant references on table "public"."sleep_logs" to "service_role";

grant select on table "public"."sleep_logs" to "service_role";

grant trigger on table "public"."sleep_logs" to "service_role";

grant truncate on table "public"."sleep_logs" to "service_role";

grant update on table "public"."sleep_logs" to "service_role";

create policy "delete own children"
on "public"."children"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "insert own children"
on "public"."children"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "read own children"
on "public"."children"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "update own children"
on "public"."children"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "diaper_logs: delete own via child"
on "public"."diaper_logs"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = diaper_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "diaper_logs: insert own via child"
on "public"."diaper_logs"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = diaper_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "diaper_logs: select own via child"
on "public"."diaper_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = diaper_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "diaper_logs: update own via child"
on "public"."diaper_logs"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = diaper_logs.child_id) AND (c.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = diaper_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Delete feeding logs for own children"
on "public"."feeding_logs"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = feeding_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Insert feeding logs for own children"
on "public"."feeding_logs"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = feeding_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Read feeding logs for own children"
on "public"."feeding_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = feeding_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Update feeding logs for own children"
on "public"."feeding_logs"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = feeding_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Delete health logs for own children"
on "public"."health_logs"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = health_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Insert health logs for own children"
on "public"."health_logs"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = health_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Read health logs for own children"
on "public"."health_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = health_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Update health logs for own children"
on "public"."health_logs"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = health_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Delete milestone logs for own children"
on "public"."milestone_logs"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = milestone_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Insert milestone logs for own children"
on "public"."milestone_logs"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = milestone_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Read milestone logs for own children"
on "public"."milestone_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = milestone_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Update milestone logs for own children"
on "public"."milestone_logs"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = milestone_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Delete nursing logs for own children"
on "public"."nursing_logs"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = nursing_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Insert nursing logs for own children"
on "public"."nursing_logs"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = nursing_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Read nursing logs for own children"
on "public"."nursing_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = nursing_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Update nursing logs for own children"
on "public"."nursing_logs"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = nursing_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Delete sleep logs for own children"
on "public"."sleep_logs"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = sleep_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Insert sleep logs for own children"
on "public"."sleep_logs"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = sleep_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Read sleep logs for own children"
on "public"."sleep_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = sleep_logs.child_id) AND (c.user_id = auth.uid())))));


create policy "Update sleep logs for own children"
on "public"."sleep_logs"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM children c
  WHERE ((c.id = sleep_logs.child_id) AND (c.user_id = auth.uid())))));


CREATE TRIGGER feeding_logs_set_timestamp BEFORE UPDATE ON public.feeding_logs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER health_logs_set_timestamp BEFORE UPDATE ON public.health_logs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER milestone_logs_set_timestamp BEFORE UPDATE ON public.milestone_logs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER nursing_logs_set_timestamp BEFORE UPDATE ON public.nursing_logs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER sleep_logs_set_timestamp BEFORE UPDATE ON public.sleep_logs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


