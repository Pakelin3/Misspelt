import React from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Paginación "ANTERIOR / PÁG X DE Y / SIGUIENTE" que Badges y Avatares
 * repetían con el mismo marcado. Solo se muestra cuando el panel decide
 * renderizarla (los llamadores siguen ocultándola si totalPages <= 1).
 */
export default function AdminPagination({ currentPage, totalPages, onPageChange }) {
    return (
        <div className="flex justify-between items-center mt-6 pt-4 border-t-4 border-foreground w-full">
            <Button
                variant="accent"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                ANTERIOR
            </Button>
            {/* `role="status"` con aria-live: al pulsar anterior/siguiente el numero
                cambiaba visualmente pero un lector de pantalla no anunciaba nada. */}
            <span
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="font-mono text-sm bg-foreground text-background px-3 py-1 font-bold"
            >
                Página {currentPage} de {totalPages}
            </span>
            <Button
                variant="accent"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                SIGUIENTE
            </Button>
        </div>
    );
}
