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
      agent_logs: {
        Row: {
          agent_id: string
          agent_name: string
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json | null
          optimized_prompt: string | null
          original_prompt: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          created_at?: string
          id?: string
          level?: string
          message: string
          metadata?: Json | null
          optimized_prompt?: string | null
          original_prompt?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          created_at?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          optimized_prompt?: string | null
          original_prompt?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          created_at: string
          id: string
          max_tokens: number | null
          mode: string
          model: string
          name: string
          output_type: string | null
          provider: string
          temperature: number | null
          updated_at: string
          user_id: string
          user_prompt: string | null
          variants: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          max_tokens?: number | null
          mode?: string
          model: string
          name: string
          output_type?: string | null
          provider: string
          temperature?: number | null
          updated_at?: string
          user_id: string
          user_prompt?: string | null
          variants?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          max_tokens?: number | null
          mode?: string
          model?: string
          name?: string
          output_type?: string | null
          provider?: string
          temperature?: number | null
          updated_at?: string
          user_id?: string
          user_prompt?: string | null
          variants?: number | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          key: string
          key_type: string
          name: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          key: string
          key_type?: string
          name?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          key?: string
          key_type?: string
          name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
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
      extracted_patterns: {
        Row: {
          applicable_domains: string[] | null
          applicable_models: string[] | null
          confidence: number | null
          discovered_at: string
          effectiveness_score: number
          id: string
          is_active: boolean | null
          last_validated: string | null
          metadata: Json | null
          pattern_type: string
          pattern_value: string
          sample_size: number
        }
        Insert: {
          applicable_domains?: string[] | null
          applicable_models?: string[] | null
          confidence?: number | null
          discovered_at?: string
          effectiveness_score: number
          id?: string
          is_active?: boolean | null
          last_validated?: string | null
          metadata?: Json | null
          pattern_type: string
          pattern_value: string
          sample_size: number
        }
        Update: {
          applicable_domains?: string[] | null
          applicable_models?: string[] | null
          confidence?: number | null
          discovered_at?: string
          effectiveness_score?: number
          id?: string
          is_active?: boolean | null
          last_validated?: string | null
          metadata?: Json | null
          pattern_type?: string
          pattern_value?: string
          sample_size?: number
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
      optimization_progress: {
        Row: {
          created_at: string | null
          id: string
          message: string
          progress: number
          progress_id: string | null
          session_key: string
          step: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          progress?: number
          progress_id?: string | null
          session_key: string
          step?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          progress?: number
          progress_id?: string | null
          session_key?: string
          step?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          tutorial_completed: boolean | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          tutorial_completed?: boolean | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          tutorial_completed?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      prompt_analysis: {
        Row: {
          ai_provider: string
          archetype: string | null
          avg_confidence: number | null
          created_at: string
          feedback_at: string | null
          formality_score: number | null
          formality_shift: number | null
          hallucination_risk: number | null
          hallucination_risk_delta: number | null
          has_examples: boolean | null
          has_structure: boolean | null
          id: string
          low_confidence_tokens: number | null
          model_name: string
          optimization_history_id: string | null
          perplexity: number | null
          perplexity_delta: number | null
          processing_time_ms: number | null
          prompt_id: string | null
          provider_supports_logprobs: boolean | null
          reasoning_delta: number | null
          reasoning_depth: number | null
          regression_categories: string[] | null
          regression_detected: boolean | null
          score: number | null
          sentence_count: number | null
          specificity_delta: number | null
          specificity_score: number | null
          strategy: string
          user_feedback: string | null
          user_id: string
          word_count: number | null
          word_count_delta: number | null
          word_count_pct_change: number | null
        }
        Insert: {
          ai_provider: string
          archetype?: string | null
          avg_confidence?: number | null
          created_at?: string
          feedback_at?: string | null
          formality_score?: number | null
          formality_shift?: number | null
          hallucination_risk?: number | null
          hallucination_risk_delta?: number | null
          has_examples?: boolean | null
          has_structure?: boolean | null
          id?: string
          low_confidence_tokens?: number | null
          model_name: string
          optimization_history_id?: string | null
          perplexity?: number | null
          perplexity_delta?: number | null
          processing_time_ms?: number | null
          prompt_id?: string | null
          provider_supports_logprobs?: boolean | null
          reasoning_delta?: number | null
          reasoning_depth?: number | null
          regression_categories?: string[] | null
          regression_detected?: boolean | null
          score?: number | null
          sentence_count?: number | null
          specificity_delta?: number | null
          specificity_score?: number | null
          strategy: string
          user_feedback?: string | null
          user_id: string
          word_count?: number | null
          word_count_delta?: number | null
          word_count_pct_change?: number | null
        }
        Update: {
          ai_provider?: string
          archetype?: string | null
          avg_confidence?: number | null
          created_at?: string
          feedback_at?: string | null
          formality_score?: number | null
          formality_shift?: number | null
          hallucination_risk?: number | null
          hallucination_risk_delta?: number | null
          has_examples?: boolean | null
          has_structure?: boolean | null
          id?: string
          low_confidence_tokens?: number | null
          model_name?: string
          optimization_history_id?: string | null
          perplexity?: number | null
          perplexity_delta?: number | null
          processing_time_ms?: number | null
          prompt_id?: string | null
          provider_supports_logprobs?: boolean | null
          reasoning_delta?: number | null
          reasoning_depth?: number | null
          regression_categories?: string[] | null
          regression_detected?: boolean | null
          score?: number | null
          sentence_count?: number | null
          specificity_delta?: number | null
          specificity_score?: number | null
          strategy?: string
          user_feedback?: string | null
          user_id?: string
          word_count?: number | null
          word_count_delta?: number | null
          word_count_pct_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_analysis_optimization_history_id_fkey"
            columns: ["optimization_history_id"]
            isOneToOne: false
            referencedRelation: "optimization_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_analysis_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_counter: {
        Row: {
          created_at: string
          id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      prompt_lab_results: {
        Row: {
          ai_analysis: Json
          category_breakdown_a: Json | null
          category_breakdown_b: Json | null
          created_at: string
          id: string
          mode: string
          prompt_a: string
          prompt_b: string | null
          response_latency_ms: number | null
          target_llm: string
          test_task: string | null
          total_score_a: number | null
          total_score_b: number | null
          user_id: string
          winner: string | null
        }
        Insert: {
          ai_analysis: Json
          category_breakdown_a?: Json | null
          category_breakdown_b?: Json | null
          created_at?: string
          id?: string
          mode: string
          prompt_a: string
          prompt_b?: string | null
          response_latency_ms?: number | null
          target_llm: string
          test_task?: string | null
          total_score_a?: number | null
          total_score_b?: number | null
          user_id: string
          winner?: string | null
        }
        Update: {
          ai_analysis?: Json
          category_breakdown_a?: Json | null
          category_breakdown_b?: Json | null
          created_at?: string
          id?: string
          mode?: string
          prompt_a?: string
          prompt_b?: string | null
          response_latency_ms?: number | null
          target_llm?: string
          test_task?: string | null
          total_score_a?: number | null
          total_score_b?: number | null
          user_id?: string
          winner?: string | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          favorites_count: number
          id: string
          is_official: boolean
          is_public: boolean | null
          output_type: string | null
          rating: number | null
          tags: string[] | null
          template: string
          title: string
          updated_at: string
          user_id: string
          uses_count: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          favorites_count?: number
          id?: string
          is_official?: boolean
          is_public?: boolean | null
          output_type?: string | null
          rating?: number | null
          tags?: string[] | null
          template: string
          title: string
          updated_at?: string
          user_id: string
          uses_count?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          favorites_count?: number
          id?: string
          is_official?: boolean
          is_public?: boolean | null
          output_type?: string | null
          rating?: number | null
          tags?: string[] | null
          template?: string
          title?: string
          updated_at?: string
          user_id?: string
          uses_count?: number
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
      research_experiments: {
        Row: {
          completed_at: string | null
          completed_tests: number | null
          config: Json
          created_at: string
          description: string | null
          experiment_type: string
          id: string
          name: string
          status: string
          total_tests: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_tests?: number | null
          config?: Json
          created_at?: string
          description?: string | null
          experiment_type: string
          id?: string
          name: string
          status?: string
          total_tests?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_tests?: number | null
          config?: Json
          created_at?: string
          description?: string | null
          experiment_type?: string
          id?: string
          name?: string
          status?: string
          total_tests?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      research_results: {
        Row: {
          base_prompt: string
          base_score: number | null
          category_scores: Json | null
          created_at: string
          experiment_id: string
          id: string
          latency_ms: number | null
          metadata: Json | null
          model_used: string
          modification_applied: string
          modified_prompt: string
          modified_score: number | null
          output: string | null
          provider: string
          score_delta: number | null
          test_type: string
          tokens_used: number | null
        }
        Insert: {
          base_prompt: string
          base_score?: number | null
          category_scores?: Json | null
          created_at?: string
          experiment_id: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model_used: string
          modification_applied: string
          modified_prompt: string
          modified_score?: number | null
          output?: string | null
          provider: string
          score_delta?: number | null
          test_type: string
          tokens_used?: number | null
        }
        Update: {
          base_prompt?: string
          base_score?: number | null
          category_scores?: Json | null
          created_at?: string
          experiment_id?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          model_used?: string
          modification_applied?: string
          modified_prompt?: string
          modified_score?: number | null
          output?: string | null
          provider?: string
          score_delta?: number | null
          test_type?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "research_results_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "research_experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      speed_optimizations: {
        Row: {
          ai_provider: string
          created_at: string
          generation_time_ms: number | null
          id: string
          model_name: string
          optimization_strategy: string | null
          optimized_prompt: string
          original_prompt: string
          output_type: string | null
          processing_time_ms: number | null
          score: number | null
          strategy: string
          user_id: string
          variants_count: number | null
        }
        Insert: {
          ai_provider: string
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          model_name: string
          optimization_strategy?: string | null
          optimized_prompt: string
          original_prompt: string
          output_type?: string | null
          processing_time_ms?: number | null
          score?: number | null
          strategy: string
          user_id: string
          variants_count?: number | null
        }
        Update: {
          ai_provider?: string
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          model_name?: string
          optimization_strategy?: string | null
          optimized_prompt?: string
          original_prompt?: string
          output_type?: string | null
          processing_time_ms?: number | null
          score?: number | null
          strategy?: string
          user_id?: string
          variants_count?: number | null
        }
        Relationships: []
      }
      token_intelligence: {
        Row: {
          category: string | null
          created_at: string
          efficient_alternatives: Json | null
          id: string
          model_family: string
          power_score: number | null
          token_count: number
          word: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          efficient_alternatives?: Json | null
          id?: string
          model_family: string
          power_score?: number | null
          token_count: number
          word: string
        }
        Update: {
          category?: string | null
          created_at?: string
          efficient_alternatives?: Json | null
          id?: string
          model_family?: string
          power_score?: number | null
          token_count?: number
          word?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
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
      user_settings: {
        Row: {
          auto_save: boolean | null
          compact_mode: boolean | null
          created_at: string
          data_retention_days: number | null
          default_max_tokens: number | null
          default_model: string | null
          default_output_type: string | null
          default_provider: string | null
          default_temperature: number | null
          default_variants: number | null
          email: string | null
          email_notifications: boolean | null
          id: string
          low_motion_mode: boolean | null
          name: string | null
          new_features: boolean | null
          prompt_completed: boolean | null
          share_analytics: boolean | null
          show_only_best_in_history: boolean | null
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
          default_model?: string | null
          default_output_type?: string | null
          default_provider?: string | null
          default_temperature?: number | null
          default_variants?: number | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          low_motion_mode?: boolean | null
          name?: string | null
          new_features?: boolean | null
          prompt_completed?: boolean | null
          share_analytics?: boolean | null
          show_only_best_in_history?: boolean | null
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
          default_model?: string | null
          default_output_type?: string | null
          default_provider?: string | null
          default_temperature?: number | null
          default_variants?: number | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          low_motion_mode?: boolean | null
          name?: string | null
          new_features?: boolean | null
          prompt_completed?: boolean | null
          share_analytics?: boolean | null
          show_only_best_in_history?: boolean | null
          show_scores?: boolean | null
          theme?: string | null
          two_factor_auth?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      wording_patterns: {
        Row: {
          applicable_domains: string[] | null
          applicable_models: string[] | null
          avg_score_improvement: number | null
          confidence: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_tested: string | null
          metadata: Json | null
          original_phrase: string
          test_count: number | null
          winning_phrase: string
        }
        Insert: {
          applicable_domains?: string[] | null
          applicable_models?: string[] | null
          avg_score_improvement?: number | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          metadata?: Json | null
          original_phrase: string
          test_count?: number | null
          winning_phrase: string
        }
        Update: {
          applicable_domains?: string[] | null
          applicable_models?: string[] | null
          avg_score_improvement?: number | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_tested?: string | null
          metadata?: Json | null
          original_phrase?: string
          test_count?: number | null
          winning_phrase?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_cleanup_old_data: { Args: never; Returns: undefined }
      decrement_template_favorites: {
        Args: { template_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_prompt_counter: {
        Args: { delta?: number }
        Returns: {
          id: string
          total: number
        }[]
      }
      increment_template_favorites: {
        Args: { template_id: string }
        Returns: undefined
      }
      increment_template_uses: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
