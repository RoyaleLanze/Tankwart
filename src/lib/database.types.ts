export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      price_cache: {
        Row: {
          cache_key: string;
          fetched_at: string;
          payload: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          cache_key: string;
          fetched_at: string;
          payload: NonNullable<Json>;
        };
        Update: {
          cache_key?: string;
          fetched_at?: string;
          payload?: NonNullable<Json>;
        };
        Relationships: [];
      };
      price_rate_limit: {
        Row: {
          count: number;
          user_id: string;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          count: number;
          user_id: string;
          window_start: string;
        };
        Update: {
          count?: number;
          user_id?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          active_vehicle_id: string | null;
          created_at: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          active_vehicle_id?: string | null;
          created_at?: string;
          id: string;
        };
        Update: {
          active_vehicle_id?: string | null;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_active_vehicle_id_fkey";
            columns: ["active_vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      refuelings: {
        Row: {
          created_at: string;
          id: string;
          is_full_tank: boolean;
          note: string | null;
          odometer_km: number;
          previous_missed: boolean;
          price_per_liter_tenth_cents: number;
          refueled_on: string;
          station_address: string | null;
          station_id: string | null;
          station_name: string;
          total_cents: number;
          vehicle_id: string;
          volume_ml: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_full_tank?: boolean;
          note?: string | null;
          odometer_km: number;
          previous_missed?: boolean;
          price_per_liter_tenth_cents: number;
          refueled_on: string;
          station_address?: string | null;
          station_id?: string | null;
          station_name: string;
          total_cents: number;
          vehicle_id: string;
          volume_ml: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_full_tank?: boolean;
          note?: string | null;
          odometer_km?: number;
          previous_missed?: boolean;
          price_per_liter_tenth_cents?: number;
          refueled_on?: string;
          station_address?: string | null;
          station_id?: string | null;
          station_name?: string;
          total_cents?: number;
          vehicle_id?: string;
          volume_ml?: number;
        };
        Relationships: [
          {
            foreignKeyName: "refuelings_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          created_at: string;
          fuel_type: Database["public"]["Enums"]["fuel_type"];
          id: string;
          initial_odometer_km: number;
          license_plate: string | null;
          make_model: string | null;
          manufacturer_consumption_ml_per_100km: number | null;
          name: string;
          tank_capacity_ml: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          fuel_type: Database["public"]["Enums"]["fuel_type"];
          id?: string;
          initial_odometer_km: number;
          license_plate?: string | null;
          make_model?: string | null;
          manufacturer_consumption_ml_per_100km?: number | null;
          name: string;
          tank_capacity_ml: number;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          fuel_type?: Database["public"]["Enums"]["fuel_type"];
          id?: string;
          initial_odometer_km?: number;
          license_plate?: string | null;
          make_model?: string | null;
          manufacturer_consumption_ml_per_100km?: number | null;
          name?: string;
          tank_capacity_ml?: number;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      hit_price_rate_limit: {
        Args: { p_user_id: string; p_window_start: string };
        Returns: number;
      };
    };
    Enums: {
      fuel_type: "e5" | "e10" | "diesel";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      fuel_type: ["e5", "e10", "diesel"],
    },
  },
} as const;
