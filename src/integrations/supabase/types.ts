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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      credit_requests: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_user_id: string
          id: string
          reviewed_at: string | null
          status: string
          store_id: string
        }
        Insert: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_user_id: string
          id?: string
          reviewed_at?: string | null
          status?: string
          store_id: string
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_user_id?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          store_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          customer_unique_id: string | null
          date: string
          id: string
          items: Json
          ordered_at: string
          payment_method: string
          payment_status: string
          pickup_date: string | null
          pickup_time: string | null
          status: string
          store_id: string
          total: number
          user_id: string
        }
        Insert: {
          customer_unique_id?: string | null
          date: string
          id: string
          items?: Json
          ordered_at?: string
          payment_method?: string
          payment_status?: string
          pickup_date?: string | null
          pickup_time?: string | null
          status?: string
          store_id?: string
          total?: number
          user_id: string
        }
        Update: {
          customer_unique_id?: string | null
          date?: string
          id?: string
          items?: Json
          ordered_at?: string
          payment_method?: string
          payment_status?: string
          pickup_date?: string | null
          pickup_time?: string | null
          status?: string
          store_id?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image: string
          max_stock: number
          name: string
          price: number
          stock: number
          store_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          id: string
          image: string
          max_stock?: number
          name: string
          price: number
          stock?: number
          store_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image?: string
          max_stock?: number
          name?: string
          price?: number
          stock?: number
          store_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          customer_unique_id: string | null
          email: string
          id: string
          name: string
          registered_at: string
          role: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          customer_unique_id?: string | null
          email: string
          id?: string
          name: string
          registered_at?: string
          role?: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          customer_unique_id?: string | null
          email?: string
          id?: string
          name?: string
          registered_at?: string
          role?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      store_categories: {
        Row: {
          category_id: string
          id: string
          image: string | null
          label: string
          sort_order: number | null
          store_id: string
        }
        Insert: {
          category_id: string
          id?: string
          image?: string | null
          label: string
          sort_order?: number | null
          store_id: string
        }
        Update: {
          category_id?: string
          id?: string
          image?: string | null
          label?: string
          sort_order?: number | null
          store_id?: string
        }
        Relationships: []
      }
      store_requests: {
        Row: {
          admin_email: string
          admin_name: string
          admin_password: string
          category: string | null
          created_at: string | null
          id: string
          location: string | null
          reviewed_at: string | null
          state: string | null
          status: string
          store_name: string
          tagline: string | null
        }
        Insert: {
          admin_email: string
          admin_name: string
          admin_password: string
          category?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          reviewed_at?: string | null
          state?: string | null
          status?: string
          store_name: string
          tagline?: string | null
        }
        Update: {
          admin_email?: string
          admin_name?: string
          admin_password?: string
          category?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          reviewed_at?: string | null
          state?: string | null
          status?: string
          store_name?: string
          tagline?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          admin_user_id: string
          badge: string | null
          category: string | null
          color: string | null
          created_at: string | null
          hero_image: string | null
          icon: string | null
          id: string
          location: string | null
          name: string
          secret_key: string
          state: string | null
          tagline: string | null
        }
        Insert: {
          address?: string | null
          admin_user_id: string
          badge?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          hero_image?: string | null
          icon?: string | null
          id: string
          location?: string | null
          name: string
          secret_key: string
          state?: string | null
          tagline?: string | null
        }
        Update: {
          address?: string | null
          admin_user_id?: string
          badge?: string | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          hero_image?: string | null
          icon?: string | null
          id?: string
          location?: string | null
          name?: string
          secret_key?: string
          state?: string | null
          tagline?: string | null
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
