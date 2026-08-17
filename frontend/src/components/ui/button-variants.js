import { cva } from "class-variance-authority"

/**
 * Vive aparte del componente porque exportar una constante junto a un
 * componente desactiva el fast refresh de Vite en desarrollo.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    // Sin `uppercase`: Press Start 2P dibuja las mayusculas acentuadas con el
  // cuerpo comprimido, asi que el CSS convertia "Pronunciación" en
  // "PRONUNCIACIóN". Las etiquetas ya vienen escritas en la caja correcta.
  "font-mono tracking-wide rounded-none border-4",
    "transition-transform duration-100 pixel-btn",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:grayscale disabled:shadow-none disabled:translate-y-0",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-foreground shadow-pixel-md",
        accent:
          "bg-accent text-accent-foreground border-foreground shadow-pixel-md",
        destructive:
          "bg-destructive text-destructive-foreground border-foreground shadow-pixel-md",
        success:
          "bg-success text-success-foreground border-foreground shadow-pixel-md",
        outline:
          "bg-background text-foreground border-foreground shadow-pixel-md hover:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground border-foreground shadow-pixel-md",
        // Sin borde ni elevacion: para iconos y acciones terciarias donde un
        // marco duro competiria con el contenido.
        ghost:
          "border-transparent shadow-none text-foreground hover:bg-muted hover:text-foreground",
        link:
          "border-transparent shadow-none text-accent font-sans normal-case underline decoration-2 underline-offset-4 hover:text-foreground",
      },
      size: {
        default: "min-h-11 px-5 py-3 text-2xs md:text-xs [&_svg]:size-5",
        sm: "min-h-11 px-4 py-2 text-3xs md:text-2xs [&_svg]:size-4",
        lg: "min-h-14 px-8 py-4 text-xs md:text-sm [&_svg]:size-6",
        icon: "size-11 p-0 [&_svg]:size-5",
        "icon-lg": "size-14 p-0 [&_svg]:size-7",
        xs: "min-h-9 px-3 py-1.5 text-3xs [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export { buttonVariants }
