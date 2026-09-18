import type { ReactNode } from "react";
interface PageHeadingProps { eyebrow: string; title: string; description: string; action?: ReactNode; }
export function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) { return <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p><h1 className="mt-2 font-display text-3xl font-semibold">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</header>; }
