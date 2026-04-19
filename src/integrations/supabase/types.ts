export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acciones_correctivas: {
        Row: {
          avance: number
          created_at: string
          created_by: string | null
          descripcion: string | null
          estatus: string
          evidencia_url: string | null
          fecha_cierre: string | null
          fecha_compromiso: string | null
          fecha_deteccion: string
          id: string
          origen: string | null
          origen_id: string | null
          prioridad: string
          responsable: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          avance?: number
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estatus?: string
          evidencia_url?: string | null
          fecha_cierre?: string | null
          fecha_compromiso?: string | null
          fecha_deteccion?: string
          id?: string
          origen?: string | null
          origen_id?: string | null
          prioridad?: string
          responsable?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          avance?: number
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estatus?: string
          evidencia_url?: string | null
          fecha_cierre?: string | null
          fecha_compromiso?: string | null
          fecha_deteccion?: string
          id?: string
          origen?: string | null
          origen_id?: string | null
          prioridad?: string
          responsable?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      acta_constitucion: {
        Row: {
          created_at: string
          created_by: string | null
          estatus: string
          fecha_acta: string
          hora: string | null
          id: string
          lugar: string | null
          observaciones: string | null
          patron_firma: string | null
          representante_trabajadores_firma: string | null
          testigo_stps: string | null
          updated_at: string
          vigencia_fin: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estatus?: string
          fecha_acta: string
          hora?: string | null
          id?: string
          lugar?: string | null
          observaciones?: string | null
          patron_firma?: string | null
          representante_trabajadores_firma?: string | null
          testigo_stps?: string | null
          updated_at?: string
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estatus?: string
          fecha_acta?: string
          hora?: string | null
          id?: string
          lugar?: string | null
          observaciones?: string | null
          patron_firma?: string | null
          representante_trabajadores_firma?: string | null
          testigo_stps?: string | null
          updated_at?: string
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: []
      }
      comite_miembros: {
        Row: {
          activo: boolean
          cargo_csh: string
          created_at: string
          created_by: string | null
          email: string | null
          fecha_designacion: string | null
          id: string
          nombre: string
          puesto: string | null
          representacion: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cargo_csh: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          fecha_designacion?: string | null
          id?: string
          nombre: string
          puesto?: string | null
          representacion: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cargo_csh?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          fecha_designacion?: string | null
          id?: string
          nombre?: string
          puesto?: string | null
          representacion?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      csh_config: {
        Row: {
          cp: string | null
          created_at: string
          created_by: string | null
          domicilio: string | null
          estado: string | null
          fecha_constitucion: string | null
          id: string
          municipio: string | null
          nombre_centro: string | null
          num_hombres: number | null
          num_mujeres: number | null
          num_trabajadores: number | null
          rama_actividad: string | null
          razon_social: string
          representante_legal: string | null
          representante_patronal: string | null
          representante_trabajadores: string | null
          rfc: string | null
          telefono: string | null
          updated_at: string
          vigencia_anios: number | null
        }
        Insert: {
          cp?: string | null
          created_at?: string
          created_by?: string | null
          domicilio?: string | null
          estado?: string | null
          fecha_constitucion?: string | null
          id?: string
          municipio?: string | null
          nombre_centro?: string | null
          num_hombres?: number | null
          num_mujeres?: number | null
          num_trabajadores?: number | null
          rama_actividad?: string | null
          razon_social: string
          representante_legal?: string | null
          representante_patronal?: string | null
          representante_trabajadores?: string | null
          rfc?: string | null
          telefono?: string | null
          updated_at?: string
          vigencia_anios?: number | null
        }
        Update: {
          cp?: string | null
          created_at?: string
          created_by?: string | null
          domicilio?: string | null
          estado?: string | null
          fecha_constitucion?: string | null
          id?: string
          municipio?: string | null
          nombre_centro?: string | null
          num_hombres?: number | null
          num_mujeres?: number | null
          num_trabajadores?: number | null
          rama_actividad?: string | null
          razon_social?: string
          representante_legal?: string | null
          representante_patronal?: string | null
          representante_trabajadores?: string | null
          rfc?: string | null
          telefono?: string | null
          updated_at?: string
          vigencia_anios?: number | null
        }
        Relationships: []
      }
      incidentes: {
        Row: {
          area: string
          causas: string | null
          consecuencias: string | null
          costo_estimado: number | null
          created_at: string
          created_by: string | null
          descripcion: string
          dias_incapacidad: number | null
          edad: number | null
          estatus: string
          fecha: string
          gravedad: string
          hora: string | null
          id: string
          lugar: string | null
          persona_afectada: string | null
          puesto: string | null
          reportado_por: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          area: string
          causas?: string | null
          consecuencias?: string | null
          costo_estimado?: number | null
          created_at?: string
          created_by?: string | null
          descripcion: string
          dias_incapacidad?: number | null
          edad?: number | null
          estatus?: string
          fecha: string
          gravedad?: string
          hora?: string | null
          id?: string
          lugar?: string | null
          persona_afectada?: string | null
          puesto?: string | null
          reportado_por?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          area?: string
          causas?: string | null
          consecuencias?: string | null
          costo_estimado?: number | null
          created_at?: string
          created_by?: string | null
          descripcion?: string
          dias_incapacidad?: number | null
          edad?: number | null
          estatus?: string
          fecha?: string
          gravedad?: string
          hora?: string | null
          id?: string
          lugar?: string | null
          persona_afectada?: string | null
          puesto?: string | null
          reportado_por?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      informes: {
        Row: {
          created_at: string
          created_by: string | null
          cumplimiento_promedio: number | null
          estatus: string
          id: string
          periodo_fin: string
          periodo_inicio: string
          resumen: string | null
          tipo: string
          titulo: string
          total_acciones: number | null
          total_hallazgos: number | null
          total_incidentes: number | null
          total_recorridos: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cumplimiento_promedio?: number | null
          estatus?: string
          id?: string
          periodo_fin: string
          periodo_inicio: string
          resumen?: string | null
          tipo?: string
          titulo: string
          total_acciones?: number | null
          total_hallazgos?: number | null
          total_incidentes?: number | null
          total_recorridos?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cumplimiento_promedio?: number | null
          estatus?: string
          id?: string
          periodo_fin?: string
          periodo_inicio?: string
          resumen?: string | null
          tipo?: string
          titulo?: string
          total_acciones?: number | null
          total_hallazgos?: number | null
          total_incidentes?: number | null
          total_recorridos?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          puesto: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          puesto?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          puesto?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programa_anual: {
        Row: {
          actividad: string
          anio: number
          created_at: string
          created_by: string | null
          estatus: string
          fecha_programada: string | null
          fecha_realizada: string | null
          id: string
          mes: number
          observaciones: string | null
          responsable: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          actividad: string
          anio: number
          created_at?: string
          created_by?: string | null
          estatus?: string
          fecha_programada?: string | null
          fecha_realizada?: string | null
          id?: string
          mes: number
          observaciones?: string | null
          responsable?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          actividad?: string
          anio?: number
          created_at?: string
          created_by?: string | null
          estatus?: string
          fecha_programada?: string | null
          fecha_realizada?: string | null
          id?: string
          mes?: number
          observaciones?: string | null
          responsable?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recorrido_hallazgos: {
        Row: {
          created_at: string
          descripcion: string
          estatus: string
          foto_url: string | null
          id: string
          nivel_riesgo: string | null
          recomendacion: string | null
          recorrido_id: string
          ubicacion: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          estatus?: string
          foto_url?: string | null
          id?: string
          nivel_riesgo?: string | null
          recomendacion?: string | null
          recorrido_id: string
          ubicacion?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          estatus?: string
          foto_url?: string | null
          id?: string
          nivel_riesgo?: string | null
          recomendacion?: string | null
          recorrido_id?: string
          ubicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recorrido_hallazgos_recorrido_id_fkey"
            columns: ["recorrido_id"]
            isOneToOne: false
            referencedRelation: "recorridos"
            referencedColumns: ["id"]
          },
        ]
      }
      recorridos: {
        Row: {
          area: string
          created_at: string
          created_by: string | null
          estatus: string
          fecha: string
          id: string
          integrantes: string | null
          observaciones_generales: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          created_by?: string | null
          estatus?: string
          fecha: string
          id?: string
          integrantes?: string | null
          observaciones_generales?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          created_by?: string | null
          estatus?: string
          fecha?: string
          id?: string
          integrantes?: string | null
          observaciones_generales?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verificacion_items: {
        Row: {
          created_at: string
          cumple: string
          descripcion: string
          evidencia_url: string | null
          id: string
          numero: number | null
          observaciones: string | null
          verificacion_id: string
        }
        Insert: {
          created_at?: string
          cumple?: string
          descripcion: string
          evidencia_url?: string | null
          id?: string
          numero?: number | null
          observaciones?: string | null
          verificacion_id: string
        }
        Update: {
          created_at?: string
          cumple?: string
          descripcion?: string
          evidencia_url?: string | null
          id?: string
          numero?: number | null
          observaciones?: string | null
          verificacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verificacion_items_verificacion_id_fkey"
            columns: ["verificacion_id"]
            isOneToOne: false
            referencedRelation: "verificaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      verificaciones: {
        Row: {
          area: string | null
          created_at: string
          created_by: string | null
          estatus: string
          fecha: string
          id: string
          norma: string
          porcentaje_cumplimiento: number | null
          responsable: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          created_by?: string | null
          estatus?: string
          fecha: string
          id?: string
          norma: string
          porcentaje_cumplimiento?: number | null
          responsable?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          created_by?: string | null
          estatus?: string
          fecha?: string
          id?: string
          norma?: string
          porcentaje_cumplimiento?: number | null
          responsable?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "editor", "viewer"],
    },
  },
} as const
