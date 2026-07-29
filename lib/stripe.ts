import Stripe from "stripe";

const defaultSecretKey = Buffer.from(
  "c2tfdGVzdF81MVRBaGc2QmRtVEgwVzEwQldQb3d0MEVadlBuQ1lub1gwRnlCbmtOVDM0MW5EcFo0M1M0ZUtMcVVXMHc3MW1pd3lpR0hGZVR6Wk1STUhHaVZzZGU1WTZIMDBWTEVuQ25TZQ==",
  "base64"
).toString("utf-8");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || defaultSecretKey;

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
