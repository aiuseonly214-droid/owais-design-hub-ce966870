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
      company_profile: {
        Row: {
          address: string
          currency: string
          default_terms: string
          email: string
          id: string
          logo_url: string | null
          mobile1: string
          mobile2: string | null
          name: string
          signature_url: string | null
          stamp_url: string | null
          tagline: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string
          currency?: string
          default_terms?: string
          email?: string
          id?: string
          logo_url?: string | null
          mobile1?: string
          mobile2?: string | null
          name?: string
          signature_url?: string | null
          stamp_url?: string | null
          tagline?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          currency?: string
          default_terms?: string
          email?: string
          id?: string
          logo_url?: string | null
          mobile1?: string
          mobile2?: string | null
          name?: string
          signature_url?: string | null
          stamp_url?: string | null
          tagline?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          alt_mobile: string | null
          billing_address: string | null
          city: string | null
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          mobile: string
          name: string
          notes: string | null
          site_address: string | null
          updated_at: string
        }
        Insert: {
          alt_mobile?: string | null
          billing_address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          mobile: string
          name: string
          notes?: string | null
          site_address?: string | null
          updated_at?: string
        }
        Update: {
          alt_mobile?: string | null
          billing_address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          mobile?: string
          name?: string
          notes?: string | null
          site_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          budget: number
          city: string | null
          code: string
          converted_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          follow_up_date: string | null
          id: string
          mobile: string
          name: string
          notes: string | null
          quotation_id: string | null
          requirement: string | null
          service: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number
          city?: string | null
          code?: string
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          follow_up_date?: string | null
          id?: string
          mobile: string
          name: string
          notes?: string | null
          quotation_id?: string | null
          requirement?: string | null
          service?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          city?: string | null
          code?: string
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          follow_up_date?: string | null
          id?: string
          mobile?: string
          name?: string
          notes?: string | null
          quotation_id?: string | null
          requirement?: string | null
          service?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          description: string | null
          group_name: string | null
          id: string
          include_in_total: boolean
          invoice_id: string
          particular: string
          qty: number
          rate: number
          sr: number
          unit: string | null
        }
        Insert: {
          amount?: number
          description?: string | null
          group_name?: string | null
          id?: string
          include_in_total?: boolean
          invoice_id: string
          particular?: string
          qty?: number
          rate?: number
          sr?: number
          unit?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          group_name?: string | null
          id?: string
          include_in_total?: boolean
          invoice_id?: string
          particular?: string
          qty?: number
          rate?: number
          sr?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_words: string | null
          code: string
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          discount: number
          due_date: string | null
          grand_total: number
          id: string
          quotation_id: string | null
          show_totals: boolean
          status: string
          subject: string | null
          subtotal: number
          terms: string | null
          updated_at: string
        }
        Insert: {
          amount_words?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          discount?: number
          due_date?: string | null
          grand_total?: number
          id?: string
          quotation_id?: string | null
          show_totals?: boolean
          status?: string
          subject?: string | null
          subtotal?: number
          terms?: string | null
          updated_at?: string
        }
        Update: {
          amount_words?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          discount?: number
          due_date?: string | null
          grand_total?: number
          id?: string
          quotation_id?: string | null
          show_totals?: boolean
          status?: string
          subject?: string | null
          subtotal?: number
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          amount: number
          description: string | null
          group_name: string | null
          id: string
          include_in_total: boolean
          particular: string
          qty: number
          quotation_id: string
          rate: number
          sr: number
          unit: string | null
        }
        Insert: {
          amount?: number
          description?: string | null
          group_name?: string | null
          id?: string
          include_in_total?: boolean
          particular?: string
          qty?: number
          quotation_id: string
          rate?: number
          sr?: number
          unit?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          group_name?: string | null
          id?: string
          include_in_total?: boolean
          particular?: string
          qty?: number
          quotation_id?: string
          rate?: number
          sr?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          amount_words: string | null
          code: string
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          discount: number
          grand_total: number
          id: string
          show_totals: boolean
          status: string
          subject: string | null
          subtotal: number
          terms: string | null
          updated_at: string
          valid_till: string | null
        }
        Insert: {
          amount_words?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          discount?: number
          grand_total?: number
          id?: string
          show_totals?: boolean
          status?: string
          subject?: string | null
          subtotal?: number
          terms?: string | null
          updated_at?: string
          valid_till?: string | null
        }
        Update: {
          amount_words?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          discount?: number
          grand_total?: number
          id?: string
          show_totals?: boolean
          status?: string
          subject?: string | null
          subtotal?: number
          terms?: string | null
          updated_at?: string
          valid_till?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount_received: number
          amount_words: string | null
          balance: number
          code: string
          created_at: string
          created_by: string | null
          customer_id: string
          date: string
          id: string
          invoice_id: string | null
          mode: string
          notes: string | null
          previous_paid: number
          total_amount: number
          txn_id: string | null
          updated_at: string
        }
        Insert: {
          amount_received?: number
          amount_words?: string | null
          balance?: number
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          date?: string
          id?: string
          invoice_id?: string | null
          mode?: string
          notes?: string | null
          previous_paid?: number
          total_amount?: number
          txn_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_received?: number
          amount_words?: string | null
          balance?: number
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          date?: string
          id?: string
          invoice_id?: string | null
          mode?: string
          notes?: string | null
          previous_paid?: number
          total_amount?: number
          txn_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      next_code: {
        Args: { _prefix: string; _seq: string; _with_year: boolean }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "employee"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "employee"],
    },
  },
} as const
