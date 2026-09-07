import React from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';

/**
 * Diálogo de confirmación de borrado compartido por los paneles CRUD del
 * admin (insignias, diccionario, avatares, granjas). Antes cada panel
 * repetía el mismo Dialog + DialogHeader/Footer con un botón "Cancelar" y
 * uno "destructive"; esto centraliza esa forma sin cambiar el marcado ni el
 * comportamiento de ninguno de ellos.
 */
export default function ConfirmDeleteDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-destructive">{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
