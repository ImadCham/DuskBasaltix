import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://zqsijwtbymszkhvwukxt.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxc2lqd3RieW1zemtodnd1a3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDI0MjcsImV4cCI6MjEwMDMxODQyN30.stD_5hFdagChHiQhGmGHkRseHc75r3Wnna2yoO71Jpg";

// Client-side client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (uses service role key — only for API routes/server components)
export function createServiceClient() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxc2lqd3RieW1zemtodnd1a3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc0MjQyNywiZXhwIjoyMTAwMzE4NDI3fQ._TJb9pvY0i8TJWi9uMGKD_Lg-DCOYNUwHUY5FSAUcrk";

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

export type TicketTier = {
  id: string;
  event_id: string;
  name: string;
  price: number;
  quantity_total: number;
  quantity_sold: number;
  is_active: boolean;
};

export type Ticket = {
  id: string;
  event_id: string;
  tier_id: string | null;
  tier: string;
  buyer_name: string | null;
  buyer_email: string;
  stripe_session_id: string | null;
  qr_code_data: string;
  status: "paid" | "scanned" | "cancelled";
  created_at: string;
  scanned_at: string | null;
};
