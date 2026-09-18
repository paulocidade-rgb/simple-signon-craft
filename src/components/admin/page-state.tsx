import { AlertTriangle, LoaderCircle } from "lucide-react";
export function PageLoading() { return <div className="grid min-h-64 place-items-center" aria-label="Carregando"><LoaderCircle className="size-6 animate-spin text-primary" /></div>; }
export function PageError({ message }: { message: string }) { return <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><AlertTriangle className="size-5" />{message}</div>; }
