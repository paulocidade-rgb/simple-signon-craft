import { loadStripe, type Stripe } from "@stripe/stripe-js";
export type StripeEnv = "sandbox" | "live";
const token = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];
export function getStripeEnvironment(): StripeEnv { if (token?.startsWith("pk_test_")) return "sandbox"; if (token?.startsWith("pk_live_")) return "live"; throw new Error("Conclua a ativação dos pagamentos para usar o checkout."); }
let promise: Promise<Stripe | null> | null = null;
export function getStripe(){ getStripeEnvironment(); if(!promise) promise=loadStripe(token as string); return promise; }