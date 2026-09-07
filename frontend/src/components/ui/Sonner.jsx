import { useTheme } from "@/context/theme-context"
import { Toaster as Sonner } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = (props) => {
    // Antes leia el tema de next-themes, cuyo Provider no existia en la app:
    // siempre devolvia "system" e ignoraba el selector del usuario.
    const { theme } = useTheme()

    return (
        <Sonner
            theme={theme}
            className="toaster group"
            icons={{
                success: (
                    <CircleCheckIcon className="size-4" />
                ),
                info: (
                    <InfoIcon className="size-4" />
                ),
                warning: (
                    <TriangleAlertIcon className="size-4" />
                ),
                error: (
                    <OctagonXIcon className="size-4" />
                ),
                loading: (
                    <Loader2Icon className="size-4 motion-safe:animate-spin" />
                ),
            }}
            style={{
                "--normal-bg": "hsl(var(--card))",
                "--normal-text": "hsl(var(--foreground))",
                "--normal-border": "hsl(var(--foreground))",
                "--border-radius": "0px",
            }}
            toastOptions={{
                classNames: {
                    toast: "group toast bg-card text-foreground pixel-border rounded-none font-mono p-4 flex gap-3 w-full",
                    title: "font-bold text-md tracking-tight uppercase text-foreground",
                    description: "font-sans text-base tracking-wide text-muted-foreground font-normal empty:hidden",
                    actionButton: "bg-primary text-primary-foreground font-mono text-2xs pixel-border-primary pixel-btn px-4 py-2",
                    cancelButton: "bg-muted text-muted-foreground font-mono text-2xs pixel-border pixel-btn px-4 py-2",
                    icon: "group-data-[type=error]:text-destructive group-data-[type=success]:text-success group-data-[type=warning]:text-accent-strong group-data-[type=info]:text-info",
                    success: "!border-success",
                    error: "!border-destructive",
                    warning: "!border-accent-strong",
                    info: "!border-info",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }