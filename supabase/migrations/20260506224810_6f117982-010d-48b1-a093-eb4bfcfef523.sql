insert into storage.buckets (id, name, public) values ('evidencias-accidentes','evidencias-accidentes', true) on conflict (id) do nothing;

create policy "evidencias public read"
on storage.objects for select
using (bucket_id = 'evidencias-accidentes');

create policy "evidencias auth upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'evidencias-accidentes');

create policy "evidencias auth update"
on storage.objects for update
to authenticated
using (bucket_id = 'evidencias-accidentes');

create policy "evidencias auth delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'evidencias-accidentes');