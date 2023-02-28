export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organization: {
        Row: {
          id: number
          created_at: string | null
          updated_at: string | null
          name: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          name?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          name?: string | null
        }
      }
      page: {
        Row: {
          id: number
          created_at: string | null
          title: string | null
          description: string | null
          content: Json | null
          slug: string | null
          image_url: string | null
          published: boolean | null
          org_id: number | null
          site_id: number | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          title?: string | null
          description?: string | null
          content?: Json | null
          slug?: string | null
          image_url?: string | null
          published?: boolean | null
          org_id?: number | null
          site_id?: number | null
        }
        Update: {
          id?: number
          created_at?: string | null
          title?: string | null
          description?: string | null
          content?: Json | null
          slug?: string | null
          image_url?: string | null
          published?: boolean | null
          org_id?: number | null
          site_id?: number | null
        }
      }
      profile: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          org_id: number
        }
        Insert: {
          id: string
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          org_id: number
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          org_id?: number
        }
      }
      site: {
        Row: {
          id: number
          logo: string | null
          name: string | null
          created_at: string | null
          updated_at: string | null
          custom_domain: string | null
          subdomain: string | null
          org_id: number | null
        }
        Insert: {
          id?: number
          logo?: string | null
          name?: string | null
          created_at?: string | null
          updated_at?: string | null
          custom_domain?: string | null
          subdomain?: string | null
          org_id?: number | null
        }
        Update: {
          id?: number
          logo?: string | null
          name?: string | null
          created_at?: string | null
          updated_at?: string | null
          custom_domain?: string | null
          subdomain?: string | null
          org_id?: number | null
        }
      }
      site_users: {
        Row: {
          id: number
          created_at: string | null
          updated_at: string | null
          role: string | null
          user_id: string | null
          site_id: number | null
          org_id: number | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          role?: string | null
          user_id?: string | null
          site_id?: number | null
          org_id?: number | null
        }
        Update: {
          id?: number
          created_at?: string | null
          updated_at?: string | null
          role?: string | null
          user_id?: string | null
          site_id?: number | null
          org_id?: number | null
        }
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
  }
}

