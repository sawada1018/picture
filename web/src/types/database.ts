export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string;
          avatar_url: string | null;
          friend_code: string;
          created_at: string;
          updated_at: string;
          /** 旧スキーマ互換（006 実行前） */
          name?: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          friend_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          friend_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pairs: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_a?: string;
          user_b?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pairs_user_a_fkey";
            columns: ["user_a"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pairs_user_b_fkey";
            columns: ["user_b"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      drawings: {
        Row: {
          id: string;
          user_id: string;
          question_date: string;
          image_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_date?: string;
          image_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_date?: string;
          image_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drawings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_prompts: {
        Row: {
          id: string;
          prompt: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type User = Database["public"]["Tables"]["users"]["Row"];
