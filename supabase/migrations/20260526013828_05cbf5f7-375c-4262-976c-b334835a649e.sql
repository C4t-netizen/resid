
-- Investigaciones (incidentes y accidentes)
CREATE TABLE public.investigaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text,
  nombre_persona text NOT NULL,
  fecha_notificacion date,
  fecha_nacimiento date,
  rfc_num_control text,
  sexo text,
  departamento text,
  edad integer,
  puesto text,
  fecha_evento date NOT NULL,
  tipo text NOT NULL DEFAULT 'incidente',
  lugar_accidente text,
  area text,
  actividad_tipo text,
  descripcion text,
  acto_inseguro text,
  condicion_insegura text,
  condicion_peligrosa text,
  consecuencias text,
  causas text,
  estatus text NOT NULL DEFAULT 'abierto',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investigaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view investigaciones" ON public.investigaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "edit insert investigaciones" ON public.investigaciones FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY "edit update investigaciones" ON public.investigaciones FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY "admin delete investigaciones" ON public.investigaciones FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE TRIGGER trg_invest_updated BEFORE UPDATE ON public.investigaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Acciones correctivas de la investigación
CREATE TABLE public.investigacion_acciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigacion_id uuid NOT NULL REFERENCES public.investigaciones(id) ON DELETE CASCADE,
  accion text NOT NULL,
  depto_responsable text,
  fecha_probable date,
  fecha_real date,
  responsable_seguimiento text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investigacion_acciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view inv acciones" ON public.investigacion_acciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "edit insert inv acciones" ON public.investigacion_acciones FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY "edit update inv acciones" ON public.investigacion_acciones FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY "edit delete inv acciones" ON public.investigacion_acciones FOR DELETE TO authenticated USING (can_edit(auth.uid()));

-- Registro de accidentes (Excel)
CREATE TABLE public.registro_accidentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigacion_id uuid REFERENCES public.investigaciones(id) ON DELETE SET NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  rfc_num_control text,
  nombres text,
  apellido_paterno text,
  apellido_materno text,
  sexo text,
  edad integer,
  telefono text,
  email text,
  calle_numero text,
  colonia text,
  codigo_postal text,
  ciudad text,
  estado text,
  no_tarjeta text,
  adscripcion text,
  area_accidente text,
  fecha_accidente date,
  folio text,
  mecanismo_lesion text,
  consecuencia text,
  region_anatomica text,
  causa_acto_inseguro text,
  causa_condicion_insegura text,
  licencia_inicio date,
  licencia_alta date,
  incapacidad_total integer DEFAULT 0,
  incapacidad_parcial integer DEFAULT 0,
  muerte boolean DEFAULT false,
  dictamen_riesgo text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.registro_accidentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view registro_acc" ON public.registro_accidentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "edit insert registro_acc" ON public.registro_accidentes FOR INSERT TO authenticated WITH CHECK (can_edit(auth.uid()));
CREATE POLICY "edit update registro_acc" ON public.registro_accidentes FOR UPDATE TO authenticated USING (can_edit(auth.uid()));
CREATE POLICY "admin delete registro_acc" ON public.registro_accidentes FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE TRIGGER trg_reg_acc_updated BEFORE UPDATE ON public.registro_accidentes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
