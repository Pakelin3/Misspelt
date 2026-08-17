import React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

/**
 * Boton del sistema de diseño.
 *
 * Habla el mismo idioma que el resto del producto: esquinas duras, borde de 4px y
 * elevacion escalonada del pixel-art. Antes era el scaffold shadcn por defecto
 * (`rounded-md`, sombra suave), asi que cada pantalla acababa reimplementando su
 * propio boton a mano en lugar de usar este.
 *
 * Todas las variantes cumplen 44x44px de area tactil salvo `xs`, reservada para
 * controles densos de escritorio. Las variantes viven en `./button-variants`.
 */
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      // Un <button> sin `type` dentro de un formulario lo envia sin querer.
      type={asChild ? undefined : (props.type ?? "button")}
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
