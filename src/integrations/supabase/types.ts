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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      optimization_history: {
        Row: {
          ai_response: string | null
          created_at: string
          generation_time_ms: number | null
          id: string
          metrics: Json | null
          prompt_id: string | null
          score: number | null
          tokens_used: number | null
          user_id: string
          variant_prompt: string
        }
        Insert: {
          ai_response?: string | null
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          metrics?: Json | null
          prompt_id?: string | null
          score?: number | null
          tokens_used?: number | null
          user_id: string
          variant_prompt: string
        }
        Update: {
          ai_response?: string | null
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          metrics?: Json | null
          prompt_id?: string | null
          score?: number | null
          tokens_used?: number | null
          user_id?: string
          variant_prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_history_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_insights: {
        Row: {
          ai_provider: string
          avg_improvement_score: number | null
          batch_count: number
          batch_summary: Json
          created_at: string
          id: string
          model_name: string
          optimization_rules: Json
          performance_patterns: Json
          successful_strategies: Json
          total_optimizations: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_provider: string
          avg_improvement_score?: number | null
          batch_count?: number
          batch_summary: Json
          created_at?: string
          id?: string
          model_name: string
          optimization_rules: Json
          performance_patterns: Json
          successful_strategies: Json
          total_optimizations?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_provider?: string
          avg_improvement_score?: number | null
          batch_count?: number
          batch_summary?: Json
          created_at?: string
          id?: string
          model_name?: string
          optimization_rules?: Json
          performance_patterns?: Json
          successful_strategies?: Json
          total_optimizations?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          ai_provider: string
          created_at: string
          id: string
          model_name: string
          optimization_cycle: number | null
          optimized_prompt: string | null
          original_prompt: string
          output_type: string | null
          performance_metrics: Json | null
          score: number | null
          status: string | null
          task_description: string | null
          updated_at: string
          user_id: string
          variants_generated: number | null
        }
        Insert: {
          ai_provider: string
          created_at?: string
          id?: string
          model_name: string
          optimization_cycle?: number | null
          optimized_prompt?: string | null
          original_prompt: string
          output_type?: string | null
          performance_metrics?: Json | null
          score?: number | null
          status?: string | null
          task_description?: string | null
          updated_at?: string
          user_id: string
          variants_generated?: number | null
        }
        Update: {
          ai_provider?: string
          created_at?: string
          id?: string
          model_name?: string
          optimization_cycle?: number | null
          optimized_prompt?: string | null
          original_prompt?: string
          output_type?: string | null
          performance_metrics?: Json | null
          score?: number | null
          status?: string | null
          task_description?: string | null
          updated_at?: string
          user_id?: string
          variants_generated?: number | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_save: boolean | null
          compact_mode: boolean | null
          created_at: string
          data_retention_days: number | null
          default_max_tokens: number | null
          default_output_type: string | null
          default_provider: string | null
          default_temperature: number | null
          default_variants: number | null
          email: string | null
          email_notifications: boolean | null
          id: string
          name: string | null
          new_features: boolean | null
          prompt_completed: boolean | null
          share_analytics: boolean | null
          show_scores: boolean | null
          theme: string | null
          two_factor_auth: boolean | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          auto_save?: boolean | null
          compact_mode?: boolean | null
          created_at?: string
          data_retention_days?: number | null
          default_max_tokens?: number | null
          default_output_type?: string | null
          default_provider?: string | null
          default_temperature?: number | null
          default_variants?: number | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          name?: string | null
          new_features?: boolean | null
          prompt_completed?: boolean | null
          share_analytics?: boolean | null
          show_scores?: boolean | null
          theme?: string | null
          two_factor_auth?: boolean | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          auto_save?: boolean | null
          compact_mode?: boolean | null
          created_at?: string
          data_retention_days?: number | null
          default_max_tokens?: number | null
          default_output_type?: string | null
          default_provider?: string | null
          default_temperature?: number | null
          default_variants?: number | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          name?: string | null
          new_features?: boolean | null
          prompt_completed?: boolean | null
          share_analytics?: boolean | null
          show_scores?: boolean | null
          theme?: string | null
          two_factor_auth?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
