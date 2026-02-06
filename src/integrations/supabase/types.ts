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
      plan_collaborators: {
        Row: {
          accepted_at: string | null
          collaborator_email: string
          collaborator_user_id: string | null
          id: string
          invited_at: string | null
          owner_id: string
          plan_id: string
          role: Database["public"]["Enums"]["collaborator_role"]
        }
        Insert: {
          accepted_at?: string | null
          collaborator_email: string
          collaborator_user_id?: string | null
          id?: string
          invited_at?: string | null
          owner_id: string
          plan_id: string
          role?: Database["public"]["Enums"]["collaborator_role"]
        }
        Update: {
          accepted_at?: string | null
          collaborator_email?: string
          collaborator_user_id?: string | null
          id?: string
          invited_at?: string | null
          owner_id?: string
          plan_id?: string
          role?: Database["public"]["Enums"]["collaborator_role"]
        }
        Relationships: [
          {
            foreignKeyName: "plan_collaborators_collaborator_user_id_fkey"
            columns: ["collaborator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_collaborators_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_collaborators_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_comments: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          plan_id: string
          target_ref: string | null
          target_type: string
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          plan_id: string
          target_ref?: string | null
          target_type: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          plan_id?: string
          target_ref?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_history: {
        Row: {
          comparison_insights: Json | null
          completed_at: string
          completed_tasks: number
          created_at: string | null
          id: string
          is_strategic: boolean | null
          plan_description: string | null
          plan_snapshot: Json
          plan_title: string
          scenario_tag: string | null
          started_at: string
          total_tasks: number
          total_time_seconds: number | null
          total_weeks: number
          user_id: string
        }
        Insert: {
          comparison_insights?: Json | null
          completed_at: string
          completed_tasks: number
          created_at?: string | null
          id?: string
          is_strategic?: boolean | null
          plan_description?: string | null
          plan_snapshot: Json
          plan_title: string
          scenario_tag?: string | null
          started_at: string
          total_tasks: number
          total_time_seconds?: number | null
          total_weeks: number
          user_id: string
        }
        Update: {
          comparison_insights?: Json | null
          completed_at?: string
          completed_tasks?: number
          created_at?: string | null
          id?: string
          is_strategic?: boolean | null
          plan_description?: string | null
          plan_snapshot?: Json
          plan_title?: string
          scenario_tag?: string | null
          started_at?: string
          total_tasks?: number
          total_time_seconds?: number | null
          total_weeks?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          plan_json: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_json?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_json?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          grace_ends_at: string | null
          id: string
          profession: string | null
          profession_details: Json | null
          project_deadline: string | null
          project_description: string | null
          project_title: string | null
          subscription_expires_at: string | null
          subscription_provider: string | null
          subscription_state: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          grace_ends_at?: string | null
          id: string
          profession?: string | null
          profession_details?: Json | null
          project_deadline?: string | null
          project_description?: string | null
          project_title?: string | null
          subscription_expires_at?: string | null
          subscription_provider?: string | null
          subscription_state?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          grace_ends_at?: string | null
          id?: string
          profession?: string | null
          profession_details?: Json | null
          project_deadline?: string | null
          project_description?: string | null
          project_title?: string | null
          subscription_expires_at?: string | null
          subscription_provider?: string | null
          subscription_state?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      review_feedback: {
        Row: {
          advisor_observation: string | null
          challenge_areas: string[] | null
          feels_realistic: string | null
          id: string
          shared_review_id: string
          submitted_at: string | null
          unclear_or_risky: string | null
        }
        Insert: {
          advisor_observation?: string | null
          challenge_areas?: string[] | null
          feels_realistic?: string | null
          id?: string
          shared_review_id: string
          submitted_at?: string | null
          unclear_or_risky?: string | null
        }
        Update: {
          advisor_observation?: string | null
          challenge_areas?: string[] | null
          feels_realistic?: string | null
          id?: string
          shared_review_id?: string
          submitted_at?: string | null
          unclear_or_risky?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_feedback_shared_review_id_fkey"
            columns: ["shared_review_id"]
            isOneToOne: false
            referencedRelation: "shared_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reviews: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          plan_id: string
          plan_snapshot: Json
          revoked: boolean | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          plan_id: string
          plan_snapshot: Json
          revoked?: boolean | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          plan_id?: string
          plan_snapshot?: Json
          revoked?: boolean | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reviews_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_comment_on_plan: { Args: { _plan_id: string }; Returns: boolean }
      can_view_plan: { Args: { _plan_id: string }; Returns: boolean }
      get_collaboration_role: { Args: { _plan_id: string }; Returns: string }
      owns_shared_review: {
        Args: { _shared_review_id: string }
        Returns: boolean
      }
    }
    Enums: {
      collaborator_role: "viewer" | "commenter"
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
      collaborator_role: ["viewer", "commenter"],
    },
  },
} as const
