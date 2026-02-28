import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = (props) => {
    const { theme = "system" } = useTheme()

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
                    <Loader2Icon className="size-4 animate-spin" />
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
                    description: "text-xs tracking-wide !text-black font-normal opacity-90 empty:hidden",
                    actionButton: "bg-primary text-primary-foreground font-mono text-[10px] pixel-border-primary pixel-btn px-4 py-2",
                    cancelButton: "bg-muted text-muted-foreground font-mono text-[10px] pixel-border pixel-btn px-4 py-2",
                    icon: "group-data-[type=error]:text-destructive group-data-[type=success]:text-primary group-data-[type=warning]:text-accent group-data-[type=info]:text-blue-500",
                    success: "!border-primary",
                    error: "!border-destructive",
                    warning: "!border-accent",
                    info: "!border-blue-500",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }