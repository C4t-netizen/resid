-- Remove email-based super_admin auto-assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  insert into public.user_roles (user_id, role) values (new.id, 'viewer');
  return new;
end;
$function$;

-- Restrict investigacion_acciones SELECT
DROP POLICY IF EXISTS "view inv acciones" ON public.investigacion_acciones;
CREATE POLICY "view inv acciones" ON public.investigacion_acciones
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.investigaciones i
      WHERE i.id = investigacion_id AND i.created_by = auth.uid()
    )
  );

-- Storage INSERT policies: require can_edit
DROP POLICY IF EXISTS "doc auth insert" ON storage.objects;
DROP POLICY IF EXISTS "documentos_csh_insert_auth" ON storage.objects;
CREATE POLICY "documentos_csh_insert_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-csh' AND public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "evidencias auth upload" ON storage.objects;
DROP POLICY IF EXISTS "evidencias_insert_auth" ON storage.objects;
CREATE POLICY "evidencias_insert_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidencias-accidentes' AND public.can_edit(auth.uid()));