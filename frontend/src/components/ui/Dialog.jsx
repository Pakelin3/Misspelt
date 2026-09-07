import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Dialogo accesible del sistema de diseño.
 *
 * Radix aporta de fabrica lo que los overlays hechos a mano no tenian:
 * `role="dialog"` + `aria-modal`, trampa de foco, cierre con Escape, retorno del
 * foco al disparador y bloqueo del scroll del documento. La identidad pixel se
 * añade encima; la accesibilidad no se reimplementa.
 */
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        data-slot="dialog-overlay"
        className={cn(
            "fixed inset-0 z-modal bg-foreground/60 supports-backdrop-filter:backdrop-blur-sm",
            "data-[state=open]:motion-safe:animate-in data-[state=closed]:motion-safe:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-150",
            className,
        )}
        {...props}
    />
))
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef(
    ({ className, children, showCloseButton = true, ...props }, ref) => (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                ref={ref}
                data-slot="dialog-content"
                className={cn(
                    "fixed top-1/2 left-1/2 z-modal w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
                    "max-w-[calc(100%-2rem)] overlay-max-h overflow-y-auto",
                    "bg-card text-card-foreground pixel-border p-6 md:p-8",
                    "focus-visible:outline-none",
                    "data-[state=open]:motion-safe:animate-in data-[state=closed]:motion-safe:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-150",
                    className,
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close
                        data-slot="dialog-close"
                        className="absolute top-4 right-4 flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
                    >
                        <XIcon aria-hidden="true" className="size-6" />
                        <span className="sr-only">Cerrar</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    ),
)
DialogContent.displayName = "DialogContent"

function DialogHeader({ className, ...props }) {
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex flex-col gap-2 border-b-4 border-muted pb-4 mb-6 pr-12", className)}
            {...props}
        />
    )
}

function DialogFooter({ className, ...props }) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn("flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end", className)}
            {...props}
        />
    )
}

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        data-slot="dialog-title"
        className={cn("font-mono text-lg md:text-2xl text-foreground uppercase leading-snug", className)}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        data-slot="dialog-description"
        className={cn("font-sans text-lg text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
}
