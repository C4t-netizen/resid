
-- 1) Storage: remove public read and duplicate permissive policies
DROP POLICY IF EXISTS "doc public read" ON storage.objects;
DROP POLICY IF EXISTS "evidencias public read" ON storage.objects;
DROP POLICY IF EXISTS "doc auth delete" ON storage.objects;
DROP POLICY IF EXISTS "doc auth update" ON storage.objects;
DROP POLICY IF EXISTS "evidencias auth delete" ON storage.objects;
DROP POLICY IF EXISTS "evidencias auth update" ON storage.objects;

-- Tighten remaining SELECT policies to require can_edit
DROP POLICY IF EXISTS "documentos_csh_select_auth" ON storage.objects;
CREATE POLICY "documentos_csh_select_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-csh' AND public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "evidencias_select_auth" ON storage.objects;
CREATE POLICY "evidencias_select_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'evidencias-accidentes' AND public.can_edit(auth.uid()));

-- Tighten UPDATE policies (currently only bucket_id check on the *_update_auth ones)
DROP POLICY IF EXISTS "documentos_csh_update_auth" ON storage.objects;
CREATE POLICY "documentos_csh_update_auth" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-csh' AND public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "evidencias_update_auth" ON storage.objects;
CREATE POLICY "evidencias_update_auth" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'evidencias-accidentes' AND public.can_edit(auth.uid()));

-- 2) Tighten SELECT on sensitive PII tables to admins or record creator
DROP POLICY IF EXISTS "view investigaciones" ON public.investigaciones;
CREATE POLICY "view investigaciones" ON public.investigaciones
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR created_by = auth.uid());

DROP POLICY IF EXISTS "view registro_acc" ON public.registro_accidentes;
CREATE POLICY "view registro_acc" ON public.registro_accidentes
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR created_by = auth.uid());

-- 3) Comite miembros: restrict contact data reads to admins
DROP POLICY IF EXISTS "view comite" ON public.comite_miembros;
CREATE POLICY "view comite" ON public.comite_miembros
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4) Lock down SECURITY DEFINER functions that should not be callable via API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_edit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
