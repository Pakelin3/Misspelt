import React, { useRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { MAX_IMAGEN_BYTES } from '@/utils/imageUpload';
import { toast } from 'sonner';

/**
 * ImageUploadField sustituye al `<input type="file">` real por un boton
 * grande (mas facil de acertar y de estilar). Eso solo es accesible si el
 * input sigue enlazado a una label real y si el click del boton visible
 * llega de verdad al input oculto: si algo de eso se rompe, un usuario de
 * teclado o lector de pantalla ya no puede subir una imagen aunque los
 * usuarios de raton no noten nada.
 *
 * Tambien es el unico lugar que aplica el tope de peso, compartido por los
 * paneles de insignias y de avatares: antes ninguno de los dos comprobaba
 * nada aqui (el de avatares repetia su propio limite a mano y el de
 * insignias no comprobaba peso en absoluto).
 */
vi.mock('sonner', () => ({
    toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

const Sujeto = (props) => {
    const fileInputRef = useRef(null);
    return <ImageUploadField id="avatar-file" fileInputRef={fileInputRef} onFileChange={() => {}} {...props} />;
};

describe('ImageUploadField', () => {
    it('el input de fichero esta asociado a su label visible', () => {
        render(<Sujeto label="Imagen del avatar" alt="Vista previa del avatar" />);
        const input = screen.getByLabelText('Imagen del avatar');
        expect(input).toHaveAttribute('type', 'file');
    });

    it('sin label visible, usa el alt como nombre accesible del input', () => {
        // BadgeForm e Avatares a veces omiten `label` y confian en el `alt`
        // para dar contexto por voz; si esa label sr-only desapareciera, el
        // input pasaria a llamarse "" para un lector de pantalla.
        render(<Sujeto alt="Vista previa de la insignia" />);
        const input = screen.getByLabelText('Vista previa de la insignia');
        expect(input).toHaveAttribute('type', 'file');
    });

    it('el boton visible dispara el input de fichero oculto', () => {
        const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');
        render(<Sujeto alt="Vista previa" label="Imagen" />);

        fireEvent.click(screen.getByRole('button'));

        expect(clickSpy).toHaveBeenCalledTimes(1);
        clickSpy.mockRestore();
    });

    it('el input de fichero real permanece oculto a la vista', () => {
        render(<Sujeto alt="Vista previa" label="Imagen" />);
        expect(screen.getByLabelText('Imagen')).toHaveClass('hidden');
    });

    it('sin vista previa, muestra el texto de marcador de posicion', () => {
        render(<Sujeto alt="Vista previa" placeholderText="SUBIR IMAGEN" />);
        expect(screen.getByText('SUBIR IMAGEN')).toBeInTheDocument();
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('con vista previa, muestra la imagen con el alt correcto', () => {
        render(<Sujeto alt="Vista previa del avatar de Ana" previewUrl="blob:avatar-123" />);
        const img = screen.getByRole('img', { name: 'Vista previa del avatar de Ana' });
        expect(img).toHaveAttribute('src', 'blob:avatar-123');
    });

    it('la imagen de vista previa usa carga diferida', () => {
        render(<Sujeto alt="Vista previa" previewUrl="blob:avatar-123" />);
        expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
    });

    it('propaga el evento de cambio de fichero al handler del panel', () => {
        const onFileChange = vi.fn();
        render(<Sujeto alt="Vista previa" label="Imagen" onFileChange={onFileChange} />);

        const archivo = new File(['contenido'], 'avatar.png', { type: 'image/png' });
        fireEvent.change(screen.getByLabelText('Imagen'), { target: { files: [archivo] } });

        expect(onFileChange).toHaveBeenCalledTimes(1);
    });

    it('renderiza el texto de ayuda pasado por el panel', () => {
        render(
            <Sujeto
                alt="Vista previa"
                helper={<p>Recomendado: 128x128px</p>}
            />,
        );
        expect(screen.getByText('Recomendado: 128x128px')).toBeInTheDocument();
    });

    it('rechaza un archivo que supera el tope de peso y no llama al handler del panel', () => {
        const onFileChange = vi.fn();
        render(<Sujeto alt="Vista previa" label="Imagen" onFileChange={onFileChange} />);

        const archivoPesado = new File(['contenido'], 'insignia.png', { type: 'image/png' });
        Object.defineProperty(archivoPesado, 'size', { value: MAX_IMAGEN_BYTES + 1 });

        const input = screen.getByLabelText('Imagen');
        fireEvent.change(input, { target: { files: [archivoPesado] } });

        expect(onFileChange).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(
            'El archivo pesa demasiado',
            expect.objectContaining({ description: expect.any(String) }),
        );
        // Se limpia el input para que el usuario pueda reintentar con el mismo nombre de archivo.
        expect(input.value).toBe('');
    });

    it('acepta un archivo que no mide 80x80: aqui no hay ninguna comprobacion de dimensiones', () => {
        // El tamano ya no lo decide el cliente (lo normaliza el servidor), y
        // este componente compartido nunca comprobo dimensiones: solo peso.
        // Cualquier imagen dentro del tope de peso debe llegar al handler.
        const onFileChange = vi.fn();
        render(<Sujeto alt="Vista previa" label="Imagen" onFileChange={onFileChange} />);

        const archivoGrandeEnPixeles = new File(['contenido'], 'insignia-1024.png', { type: 'image/png' });
        fireEvent.change(screen.getByLabelText('Imagen'), { target: { files: [archivoGrandeEnPixeles] } });

        expect(onFileChange).toHaveBeenCalledTimes(1);
        expect(toast.error).not.toHaveBeenCalled();
    });
});
