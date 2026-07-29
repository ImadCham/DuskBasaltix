import Stripe from "stripe";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build_only";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-06-24.dahlia",
});

export const TICKET_PRICES = {
  early_bird: 10_00,        // $10.00 in cents
  admission_generale: 15_00, // $15.00 in cents
  last_chance: 20_00,       // $20.00 in cents
} as const;

export const TIER_NAMES: Record<string, string> = {
  early_bird: "Early Bird",
  admission_generale: "Admission Générale",
  last_chance: "Last Chance",
};
