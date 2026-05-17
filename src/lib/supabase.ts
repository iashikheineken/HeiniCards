import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase instance (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions matching our DB schema
export interface DbCard {
  id: string;
  name: string;
  rank: 'S' | 'A' | 'B' | 'C';
  description: string | null;
  attack: number;
  defense: number;
  art_url: string | null;
  art_position: string | null;
  gradient: string | null;
  emoji: string | null;
  created_at: string;
}

export interface DbPack {
  id: string;
  name: string;
  description: string | null;
  price: number;
  card_count: number;
  gradient: string | null;
  emoji: string | null;
  cover_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbPackCard {
  pack_id: string;
  card_id: string;
  drop_weight: number;
}

export interface DbUser {
  id: string;
  telegram_id: number;
  username: string | null;
  display_name: string | null;
  balance: number;
  xp: number;
  svino_pass_level: number;
  is_admin: boolean;
  created_at: string;
  last_daily_reward: string | null;
}

export interface DbUserCard {
  id: string;
  user_id: string;
  card_id: string;
  obtained_at: string;
  is_on_market: boolean;
}
