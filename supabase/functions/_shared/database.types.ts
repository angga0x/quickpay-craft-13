
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          active: boolean | null
          amount: number | null
          base_price: number
          created_at: string
          description: string | null
          details: Json | null
          id: string
          name: string
          operator: string | null
          selling_price: number
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          amount?: number | null
          base_price: number
          created_at?: string
          description?: string | null
          details?: Json | null
          id: string
          name: string
          operator?: string | null
          selling_price: number
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          amount?: number | null
          base_price?: number
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          name?: string
          operator?: string | null
          selling_price?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          details: Json | null
          expiry_time: string | null
          id: string
          payment_code: string | null
          payment_order_id: string | null
          payment_url: string | null
          product_code: string
          product_name: string
          qr_string: string | null
          reference_id: string
          status: string
          transaction_id: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          details?: Json | null
          expiry_time?: string | null
          id?: string
          payment_code?: string | null
          payment_order_id?: string | null
          payment_url?: string | null
          product_code: string
          product_name: string
          qr_string?: string | null
          reference_id: string
          status: string
          transaction_id: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          details?: Json | null
          expiry_time?: string | null
          id?: string
          payment_code?: string | null
          payment_order_id?: string | null
          payment_url?: string | null
          product_code?: string
          product_name?: string
          qr_string?: string | null
          reference_id?: string
          status?: string
          transaction_id?: string
          type?: string
          updated_at?: string
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
