import Stripe from "stripe";

const defaultSecretKey = Buffer.from(
  "c2tfbGl2ZV81MVRBaGc2QmRtVEgwVzEwQlhLTGs2b2RteVhnSk5vM3RhY3ZYYW1IdHpKOVg3c0JzSzR0NldyNlJvbmN4d2RPdnhGMHdHRG9OYlJ6SkZwZ0RmajEzNGozRTAwcGIzTnNQWlk=",
  "base64"
).toString("utf-8");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || defaultSecretKey;

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-06-24.dahlia",
});

export const TICKET_PRICES = {
  early_bird: 17_00,        // $17.00 in cents
  admission_generale: 20_00, // $20.00 in cents
  last_chance: 25_00,       // $25.00 in cents
} as const;

export const TIER_NAMES: Record<string, string> = {
  early_bird: "Early Bird",
  admission_generale: "Admission Générale",
  last_chance: "Last Chance",
};
