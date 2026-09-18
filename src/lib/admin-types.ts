export const departments = ["ADMIN", "FINANCEIRO", "VENDAS", "ESTOQUE", "JURIDICO"] as const;
export type Department = (typeof departments)[number];
export interface AdminUser { id: string; nome: string; email: string; departamento: Department; ativo: boolean; criado_em: string; }
export interface AdminInvite { id: string; email: string; departamento: Department; expira_em: string; usado: boolean; usado_em: string | null; cancelado_em: string | null; criado_em: string; }
