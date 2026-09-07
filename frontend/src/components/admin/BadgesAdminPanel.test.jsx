import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BadgesAdminPanel from '@/components/admin/BadgesAdminPanel';
import { toast } from 'sonner';

/**
 * El backend ahora normaliza cualquier insignia a 80x80 al guardarla (recorta
 * al cuadrado y reescala con Pillow, ver `api/image_processing.py`), así que
 * exigir "80x80 exactos" en el cliente pasó de ser una ayuda a ser un muro
 * sin motivo: el profesor sube el PNG que tiene y la app lo rechazaba aunque
 * el servidor lo iba a arreglar de todas formas.
 *
 * Estos tests fijan el comportamiento nuevo: el único rechazo real es un
 * archivo que no es imagen o que supera el tope de peso (ese lo aplica
 * `ImageUploadField`, compartido con el panel de avatares); cualquier otra
 * medida se acepta con un aviso de que se ajustará sola, y solo la
 * proporción no cuadrada mantiene un aviso propio porque ESA sí degrada el
 * resultado (el recorte se come parte del icono).
 */

vi.mock('@/utils/useAxios', () => ({
    default: () => ({
        get: vi.fn((url) => {
            if (url.startsWith('/avatars')) return Promise.resolve({ data: [] });
            return Promise.resolve({ data: { results: [], count: 0 } });
        }),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    }),
}));

vi.mock('sonner', () => ({
    toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

// jsdom no implementa `createObjectURL`/`revokeObjectURL`.
beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
});

// jsdom tampoco decodifica imagenes de verdad: se sustituye `Image` por un
// doble que "carga" de forma asincrona (como el real) con las medidas que
// cada test necesite, controladas a traves de `proximaMedida`.
let proximaMedida = { width: 80, height: 80 };

class ImagenFalsa {
    set src(_valor) {
        Promise.resolve().then(() => {
            this.width = proximaMedida.width;
            this.height = proximaMedida.height;
            this.onload?.();
        });
    }
}

async function abrirFormularioYElegirArchivo(archivo) {
    render(<BadgesAdminPanel />);
    fireEvent.click(await screen.findByRole('button', { name: /nueva/i }));

    const inputArchivo = screen.getByLabelText('Icono / Imagen');
    fireEvent.change(inputArchivo, { target: { files: [archivo] } });
}

describe('BadgesAdminPanel: subida de la imagen de una insignia', () => {
    const ImagenOriginal = global.Image;

    beforeEach(() => {
        global.Image = ImagenFalsa;
        proximaMedida = { width: 80, height: 80 };
    });

    afterEach(() => {
        global.Image = ImagenOriginal;
    });

    it('acepta una insignia de 1024x1024 en vez de rechazarla: el servidor la reescala', async () => {
        proximaMedida = { width: 1024, height: 1024 };
        const archivo = new File(['contenido'], 'insignia.png', { type: 'image/png' });

        await abrirFormularioYElegirArchivo(archivo);

        await waitFor(() => expect(toast.info).toHaveBeenCalled());
        expect(toast.error).not.toHaveBeenCalled();
        // El aviso informa, no bloquea: la vista previa se actualiza con el archivo elegido.
        expect(screen.getByAltText('Vista previa de la insignia')).toHaveAttribute('src', 'blob:mock-url');
    });

    it('avisa (sin rechazar) cuando la imagen no es cuadrada, porque el recorte degrada el resultado', async () => {
        proximaMedida = { width: 200, height: 80 };
        const archivo = new File(['contenido'], 'insignia.png', { type: 'image/png' });

        await abrirFormularioYElegirArchivo(archivo);

        await waitFor(() => expect(toast.warning).toHaveBeenCalled());
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('sigue rechazando un archivo que no es una imagen soportada', async () => {
        const archivo = new File(['contenido'], 'insignia.gif', { type: 'image/gif' });

        await abrirFormularioYElegirArchivo(archivo);

        expect(toast.error).toHaveBeenCalledWith(
            'Formato de imagen no válido',
            expect.objectContaining({ description: expect.any(String) }),
        );
    });

    it('rechaza un archivo que supera el tope de peso antes de medir sus dimensiones', async () => {
        const archivoPesado = new File(['contenido'], 'insignia.png', { type: 'image/png' });
        Object.defineProperty(archivoPesado, 'size', { value: 11 * 1024 * 1024 });

        await abrirFormularioYElegirArchivo(archivoPesado);

        expect(toast.error).toHaveBeenCalledWith(
            'El archivo pesa demasiado',
            expect.objectContaining({ description: expect.stringContaining('11.0 MB') }),
        );
        // Al rechazarse en `ImageUploadField`, el handler del panel ni se llega a ejecutar.
        expect(toast.info).not.toHaveBeenCalled();
        expect(toast.warning).not.toHaveBeenCalled();
    });
});
