import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

const packages = { credits_100_brl: 100, credits_300_brl: 300, credits_1000_brl: 1000 } as const;

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    priceId: z.enum(["credits_100_brl", "credits_300_brl", "credits_1000_brl"]),
    environment: z.enum(["sandbox", "live"]), returnUrl: z.string().url(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    try {
      const stripe = createStripeClient(data.environment as StripeEnv);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const price = prices.data[0]; if (!price) throw new Error("Pacote não encontrado.");
      const { data: { user } } = await context.supabase.auth.getUser();
      const found = await stripe.customers.search({ query: `metadata['userId']:'${context.userId}'`, limit: 1 });
      const customer = found.data[0] ?? await stripe.customers.create({
        ...(user?.email ? { email: user.email } : {}),
        metadata: { userId: context.userId },
      });
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      const product = await stripe.products.retrieve(productId);
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }], mode: "payment", ui_mode: "embedded_page",
        return_url: data.returnUrl, customer: customer.id, automatic_tax: { enabled: true },
        payment_intent_data: { description: product.name },
        metadata: { userId: context.userId, priceId: data.priceId, credits: String(packages[data.priceId]), managed_payments: "false" },
      });
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) { return { error: getStripeErrorMessage(error) }; }
  });