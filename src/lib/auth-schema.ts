import { z } from "zod";

export const emailSchema = z.string().trim().email("Informe um e-mail válido.").max(255);

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.");

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export function readableAuthError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (message.toLowerCase().includes("already registered")) {
    return "Este e-mail já possui uma conta.";
  }
  return "Não foi possível concluir. Tente novamente.";
}