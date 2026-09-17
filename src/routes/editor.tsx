import { lazy, Suspense } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
const ReadmeEditor = lazy(() => import("@/components/hub/readme-editor"));
export const Route = createFileRoute("/editor")({ head: () => ({ meta: [{ title: "Editor — LovableHub" }, { name: "description", content: "Edite e publique o README do repositório selecionado." }, { property: "og:title", content: "Editor — LovableHub" }, { property: "og:description", content: "Editor integrado para projetos GitHub." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: () => <ClientOnly fallback={<Loading/>}><Suspense fallback={<Loading/>}><ReadmeEditor/></Suspense></ClientOnly> });
function Loading(){return <div className="grid min-h-screen place-items-center bg-background"><LoaderCircle className="animate-spin text-primary"/></div>}