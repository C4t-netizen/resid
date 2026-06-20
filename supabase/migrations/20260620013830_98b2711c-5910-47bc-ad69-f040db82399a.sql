
-- 1. Restringir SELECT en tablas con datos personales sensibles a editores/admins
DROP POLICY IF EXISTS "view registro_acc" ON public.registro_accidentes;
CREATE POLICY "view registro_acc" ON public.registro_accidentes
  FOR SELECT TO authenticated
  USING (public.can_edit(auth.uid()) OR created_by = auth.uid());

DROP POLICY IF EXISTS "view investigaciones" ON public.investigaciones;
CREATE POLICY "view investigaciones" ON public.investigaciones
  FOR SELECT TO authenticated
  USING (public.can_edit(auth.uid()) OR created_by = auth.uid());

DROP POLICY IF EXISTS "view comite" ON public.comite_miembros;
CREATE POLICY "view comite" ON public.comite_miembros
  FOR SELECT TO authenticated
  USING (public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "Anyone authenticated can view CSH config" ON public.csh_config;
CREATE POLICY "view csh_config" ON public.csh_config
  FOR SELECT TO authenticated
  USING (public.can_edit(auth.uid()));

-- 2. Revocar EXECUTE de anon en funciones SECURITY DEFINER (reducir superficie)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_edit(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- 3. Políticas RLS en storage.objects para los buckets (acceso solo autenticado)
DROP POLICY IF EXISTS "evidencias_select_auth" ON storage.objects;
DROP POLICY IF EXISTS "evidencias_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "evidencias_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "evidencias_delete_auth" ON storage.objects;
CREATE POLICY "evidencias_select_auth" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'evidencias-accidentes');
CREATE POLICY "evidencias_insert_auth" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidencias-accidentes');
CREATE POLICY "evidencias_update_auth" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'evidencias-accidentes');
CREATE POLICY "evidencias_delete_auth" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'evidencias-accidentes' AND public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "documentos_csh_select_auth" ON storage.objects;
DROP POLICY IF EXISTS "documentos_csh_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "documentos_csh_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "documentos_csh_delete_auth" ON storage.objects;
CREATE POLICY "documentos_csh_select_auth" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documentos-csh');
CREATE POLICY "documentos_csh_insert_auth" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos-csh');
CREATE POLICY "documentos_csh_update_auth" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'documentos-csh');
CREATE POLICY "documentos_csh_delete_auth" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documentos-csh' AND public.can_edit(auth.uid()));
