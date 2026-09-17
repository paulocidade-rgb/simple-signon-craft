import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface AuthInputProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
}

export function AuthInput({ label, error, type, className, ...props }: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div>
      <label htmlFor={props.id} className="font-mono text-[10px] uppercase text-muted-foreground">
        {label}
      </label>
      <div className={cn("mt-1.5 flex h-11 items-center rounded-lg bg-input ring-1 ring-border focus-within:ring-accent", error && "ring-destructive", className)}>
        <input {...props} type={inputType} aria-invalid={Boolean(error)} className="min-w-0 flex-1 bg-transparent px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60" />
        {isPassword ? (
          <button type="button" onClick={() => setVisible((current) => !current)} className="mr-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1.5 text-xs text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}