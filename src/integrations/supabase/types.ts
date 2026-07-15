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
      app_errors: {
        Row: {
          context_json: Json | null
          created_at: string
          id: string
          merchant_id: string | null
          message: string
          route: string | null
          severity: string
          stack: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context_json?: Json | null
          created_at?: string
          id?: string
          merchant_id?: string | null
          message: string
          route?: string | null
          severity?: string
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context_json?: Json | null
          created_at?: string
          id?: string
          merchant_id?: string | null
          message?: string
          route?: string | null
          severity?: string
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      apple_wallet_devices: {
        Row: {
          created_at: string
          device_library_identifier: string
          id: string
          last_updated_tag: string | null
          pass_id: string
          pass_type_identifier: string
          push_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_library_identifier: string
          id?: string
          last_updated_tag?: string | null
          pass_id: string
          pass_type_identifier: string
          push_token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_library_identifier?: string
          id?: string
          last_updated_tag?: string | null
          pass_id?: string
          pass_type_identifier?: string
          push_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apple_wallet_devices_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "passes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          merchant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          merchant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          merchant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_consents: {
        Row: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          consent_version: string
          customer_id: string
          granted: boolean
          granted_at: string
          id: string
          ip_address: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          consent_version?: string
          customer_id: string
          granted: boolean
          granted_at?: string
          id?: string
          ip_address?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"]
          consent_version?: string
          customer_id?: string
          granted?: boolean
          granted_at?: string
          id?: string
          ip_address?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_consents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_events: {
        Row: {
          created_at: string
          customer_id: string
          event_source: string | null
          event_type: string
          id: string
          location_id: string | null
          merchant_id: string
          metadata: Json | null
          pass_id: string | null
          program_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          event_source?: string | null
          event_type: string
          id?: string
          location_id?: string | null
          merchant_id: string
          metadata?: Json | null
          pass_id?: string | null
          program_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          event_source?: string | null
          event_type?: string
          id?: string
          location_id?: string | null
          merchant_id?: string
          metadata?: Json | null
          pass_id?: string | null
          program_id?: string | null
        }
        Relationships: []
      }
      customer_metrics: {
        Row: {
          average_days_between_visits: number | null
          customer_id: string
          favorite_location_id: string | null
          first_visit_at: string | null
          last_segment_calculated_at: string | null
          last_visit_at: string | null
          lifecycle_status: string
          loyalty_segment: string
          merchant_id: string
          total_rewards_earned: number
          total_rewards_redeemed: number
          total_stamps: number
          total_visits: number
          updated_at: string
        }
        Insert: {
          average_days_between_visits?: number | null
          customer_id: string
          favorite_location_id?: string | null
          first_visit_at?: string | null
          last_segment_calculated_at?: string | null
          last_visit_at?: string | null
          lifecycle_status?: string
          loyalty_segment?: string
          merchant_id: string
          total_rewards_earned?: number
          total_rewards_redeemed?: number
          total_stamps?: number
          total_visits?: number
          updated_at?: string
        }
        Update: {
          average_days_between_visits?: number | null
          customer_id?: string
          favorite_location_id?: string | null
          first_visit_at?: string | null
          last_segment_calculated_at?: string | null
          last_visit_at?: string | null
          lifecycle_status?: string
          loyalty_segment?: string
          merchant_id?: string
          total_rewards_earned?: number
          total_rewards_redeemed?: number
          total_stamps?: number
          total_visits?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          birth_day: number | null
          birth_month: number | null
          created_at: string
          email: string | null
          external_ref: string | null
          first_name: string
          id: string
          is_demo: boolean
          last_name: string | null
          locale: string
          marketing_opt_in: boolean
          marketing_opt_in_at: string | null
          merchant_id: string
          phone: string | null
          status: string
          tags: string[]
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          birth_day?: number | null
          birth_month?: number | null
          created_at?: string
          email?: string | null
          external_ref?: string | null
          first_name: string
          id?: string
          is_demo?: boolean
          last_name?: string | null
          locale?: string
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          merchant_id: string
          phone?: string | null
          status?: string
          tags?: string[]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          birth_day?: number | null
          birth_month?: number | null
          created_at?: string
          email?: string | null
          external_ref?: string | null
          first_name?: string
          id?: string
          is_demo?: boolean
          last_name?: string | null
          locale?: string
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          merchant_id?: string
          phone?: string | null
          status?: string
          tags?: string[]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          batch_size: number
          id: number
          send_delay_ms: number
          updated_at: string
        }
        Insert: {
          batch_size?: number
          id?: number
          send_delay_ms?: number
          updated_at?: string
        }
        Update: {
          batch_size?: number
          id?: number
          send_delay_ms?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          code: string | null
          country_code: string
          created_at: string
          district: string | null
          id: string
          is_active: boolean
          merchant_id: string
          name: string
          phone: string | null
          postal_code: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string | null
          country_code?: string
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          merchant_id: string
          name: string
          phone?: string | null
          postal_code?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string | null
          country_code?: string
          created_at?: string
          district?: string | null
          id?: string
          is_active?: boolean
          merchant_id?: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_analytics_daily: {
        Row: {
          active_customers_count: number
          computed_at: string
          date: string
          marketing_opted_in_count: number
          merchant_id: string
          new_customers_count: number
          rewards_redeemed_count: number
          stamps_count: number
          visits_count: number
        }
        Insert: {
          active_customers_count?: number
          computed_at?: string
          date: string
          marketing_opted_in_count?: number
          merchant_id: string
          new_customers_count?: number
          rewards_redeemed_count?: number
          stamps_count?: number
          visits_count?: number
        }
        Update: {
          active_customers_count?: number
          computed_at?: string
          date?: string
          marketing_opted_in_count?: number
          merchant_id?: string
          new_customers_count?: number
          rewards_redeemed_count?: number
          stamps_count?: number
          visits_count?: number
        }
        Relationships: []
      }
      merchant_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          location_id: string | null
          merchant_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          location_id?: string | null
          merchant_id: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          location_id?: string | null
          merchant_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      merchant_users: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_login_at: string | null
          last_name: string | null
          merchant_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          merchant_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          merchant_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_users_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          country_code: string
          created_at: string
          created_by: string | null
          default_locale: string
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["merchant_status"]
          tax_info_json: Json | null
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          default_locale?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["merchant_status"]
          tax_info_json?: Json | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          default_locale?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["merchant_status"]
          tax_info_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      pass_auth_tokens: {
        Row: {
          auth_token: string
          created_at: string
          pass_platform_record_id: string
        }
        Insert: {
          auth_token: string
          created_at?: string
          pass_platform_record_id: string
        }
        Update: {
          auth_token?: string
          created_at?: string
          pass_platform_record_id?: string
        }
        Relationships: []
      }
      pass_platform_records: {
        Row: {
          created_at: string
          device_registration_count: number
          id: string
          last_error_code: string | null
          last_error_message: string | null
          last_synced_at: string | null
          pass_id: string
          pass_type_identifier: string | null
          platform: Database["public"]["Enums"]["pass_platform"]
          platform_class_id: string | null
          platform_object_id: string | null
          serial_number: string | null
          sync_status: Database["public"]["Enums"]["pass_sync_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_registration_count?: number
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          last_synced_at?: string | null
          pass_id: string
          pass_type_identifier?: string | null
          platform: Database["public"]["Enums"]["pass_platform"]
          platform_class_id?: string | null
          platform_object_id?: string | null
          serial_number?: string | null
          sync_status?: Database["public"]["Enums"]["pass_sync_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_registration_count?: number
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          last_synced_at?: string | null
          pass_id?: string
          pass_type_identifier?: string | null
          platform?: Database["public"]["Enums"]["pass_platform"]
          platform_class_id?: string | null
          platform_object_id?: string | null
          serial_number?: string | null
          sync_status?: Database["public"]["Enums"]["pass_sync_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pass_platform_records_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "passes"
            referencedColumns: ["id"]
          },
        ]
      }
      pass_update_logs: {
        Row: {
          created_at: string
          devices_pushed: number
          id: string
          pass_id: string
          push_errors: Json | null
          reason: string | null
          update_tag: string
        }
        Insert: {
          created_at?: string
          devices_pushed?: number
          id?: string
          pass_id: string
          push_errors?: Json | null
          reason?: string | null
          update_tag: string
        }
        Update: {
          created_at?: string
          devices_pushed?: number
          id?: string
          pass_id?: string
          push_errors?: Json | null
          reason?: string | null
          update_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "pass_update_logs_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "passes"
            referencedColumns: ["id"]
          },
        ]
      }
      passes: {
        Row: {
          created_at: string
          current_snapshot_json: Json | null
          customer_id: string
          id: string
          member_number: string | null
          merchant_id: string
          pass_status: Database["public"]["Enums"]["pass_status"]
          program_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_snapshot_json?: Json | null
          customer_id: string
          id?: string
          member_number?: string | null
          merchant_id: string
          pass_status?: Database["public"]["Enums"]["pass_status"]
          program_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_snapshot_json?: Json | null
          customer_id?: string
          id?: string
          member_number?: string | null
          merchant_id?: string
          pass_status?: Database["public"]["Enums"]["pass_status"]
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "passes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      program_locations: {
        Row: {
          id: string
          location_id: string
          program_id: string
        }
        Insert: {
          id?: string
          location_id: string
          program_id: string
        }
        Update: {
          id?: string
          location_id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_locations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_rules: {
        Row: {
          created_at: string
          id: string
          program_id: string
          rule_json: Json
          rule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          rule_json: Json
          rule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          rule_json?: Json
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_rules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          brand_logo_url: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          merchant_id: string
          name: string
          program_type: Database["public"]["Enums"]["program_type"]
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["program_status"]
          terms_text: string | null
          updated_at: string
        }
        Insert: {
          brand_logo_url?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          merchant_id: string
          name: string
          program_type?: Database["public"]["Enums"]["program_type"]
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          terms_text?: string | null
          updated_at?: string
        }
        Update: {
          brand_logo_url?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          merchant_id?: string
          name?: string
          program_type?: Database["public"]["Enums"]["program_type"]
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          terms_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      redemption_events: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          location_id: string | null
          merchant_id: string
          metadata_json: Json | null
          pass_id: string
          reversal_of_event_id: string | null
          reward_definition_id: string
          source: string | null
          staff_user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          location_id?: string | null
          merchant_id: string
          metadata_json?: Json | null
          pass_id: string
          reversal_of_event_id?: string | null
          reward_definition_id: string
          source?: string | null
          staff_user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          location_id?: string | null
          merchant_id?: string
          metadata_json?: Json | null
          pass_id?: string
          reversal_of_event_id?: string | null
          reward_definition_id?: string
          source?: string | null
          staff_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemption_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_events_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "passes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_events_reversal_of_event_id_fkey"
            columns: ["reversal_of_event_id"]
            isOneToOne: false
            referencedRelation: "redemption_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_events_reward_definition_id_fkey"
            columns: ["reward_definition_id"]
            isOneToOne: false
            referencedRelation: "reward_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_definitions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          program_id: string
          reward_code: string
          reward_description: string | null
          reward_title: string
          reward_type: string
          reward_value_json: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          program_id: string
          reward_code: string
          reward_description?: string | null
          reward_title: string
          reward_type?: string
          reward_value_json?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          program_id?: string
          reward_code?: string
          reward_description?: string | null
          reward_title?: string
          reward_type?: string
          reward_value_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_definitions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_state: {
        Row: {
          expires_at: string | null
          id: string
          last_updated_at: string
          pass_id: string
          redeemed_at: string | null
          reward_definition_id: string
          state: Database["public"]["Enums"]["reward_state_enum"]
          unlocked_at: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          last_updated_at?: string
          pass_id: string
          redeemed_at?: string | null
          reward_definition_id: string
          state?: Database["public"]["Enums"]["reward_state_enum"]
          unlocked_at?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          last_updated_at?: string
          pass_id?: string
          redeemed_at?: string | null
          reward_definition_id?: string
          state?: Database["public"]["Enums"]["reward_state_enum"]
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_state_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "passes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_state_reward_definition_id_fkey"
            columns: ["reward_definition_id"]
            isOneToOne: false
            referencedRelation: "reward_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp_events: {
        Row: {
          created_at: string
          customer_id: string
          delta: number
          id: string
          location_id: string | null
          merchant_id: string
          pass_id: string
          program_id: string
          reason: string | null
          reversal_of_event_id: string | null
          source: string | null
          staff_user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          delta?: number
          id?: string
          location_id?: string | null
          merchant_id: string
          pass_id: string
          program_id: string
          reason?: string | null
          reversal_of_event_id?: string | null
          source?: string | null
          staff_user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          delta?: number
          id?: string
          location_id?: string | null
          merchant_id?: string
          pass_id?: string
          program_id?: string
          reason?: string | null
          reversal_of_event_id?: string | null
          source?: string | null
          staff_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stamp_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_events_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "passes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stamp_events_reversal_of_event_id_fkey"
            columns: ["reversal_of_event_id"]
            isOneToOne: false
            referencedRelation: "stamp_events"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          merchant_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          merchant_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          merchant_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _merchant_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      merchant_created_by_user: {
        Args: { _merchant_id: string; _user_id: string }
        Returns: boolean
      }
      merchant_has_any_role: {
        Args: { _merchant_id: string }
        Returns: boolean
      }
      recompute_customer_metrics: {
        Args: { _customer_id: string }
        Returns: undefined
      }
      user_belongs_to_merchant: {
        Args: { _merchant_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_edit_programs: {
        Args: { _merchant_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_manage_merchant: {
        Args: { _merchant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "staff" | "analyst" | "support"
      consent_type:
        | "privacy_policy"
        | "terms_of_service"
        | "marketing_sms"
        | "marketing_email"
        | "analytics_tracking"
      merchant_status: "active" | "suspended" | "archived"
      pass_platform: "apple_wallet" | "google_wallet"
      pass_status: "active" | "inactive" | "revoked"
      pass_sync_status: "pending" | "synced" | "failed" | "archived"
      program_status: "draft" | "published" | "archived"
      program_type: "stamp" | "tier" | "voucher"
      reward_state_enum:
        | "locked"
        | "unlocked"
        | "redeemed"
        | "expired"
        | "revoked"
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
      app_role: ["owner", "admin", "manager", "staff", "analyst", "support"],
      consent_type: [
        "privacy_policy",
        "terms_of_service",
        "marketing_sms",
        "marketing_email",
        "analytics_tracking",
      ],
      merchant_status: ["active", "suspended", "archived"],
      pass_platform: ["apple_wallet", "google_wallet"],
      pass_status: ["active", "inactive", "revoked"],
      pass_sync_status: ["pending", "synced", "failed", "archived"],
      program_status: ["draft", "published", "archived"],
      program_type: ["stamp", "tier", "voucher"],
      reward_state_enum: [
        "locked",
        "unlocked",
        "redeemed",
        "expired",
        "revoked",
      ],
    },
  },
} as const
