import { useNavigate } from "@tanstack/react-router";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PaywallDialogProps { open: boolean; onOpenChange: (open: boolean) => void; }
export function PaywallDialog({ open, onOpenChange }: PaywallDialogProps) {
  const navigate = useNavigate();
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-md">
    <DialogHeader><div className="mb-3 grid size-10 place-items-center rounded-md bg-primary/15 text-primary"><Coins /></div><DialogTitle>Créditos insuficientes</DialogTitle><DialogDescription>Adicione créditos para continuar instalando extensões e publicando alterações.</DialogDescription></DialogHeader>
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Agora não</Button><Button onClick={() => void navigate({ to: "/pricing" })}>Ver pacotes</Button></DialogFooter>
  </DialogContent></Dialog>;
}