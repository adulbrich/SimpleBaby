
  create policy "Milestone photos: delete own objects"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'milestone-photos'::text) AND (auth.uid() = owner)));



  create policy "Milestone photos: insert own objects"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'milestone-photos'::text) AND (auth.uid() = owner)));



  create policy "Milestone photos: select own objects"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'milestone-photos'::text) AND (auth.uid() = owner)));



