import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

/**
 * Botón de carga de imagen con vista previa, compartido por los paneles de
 * insignias y avatares (ambos repetían el mismo botón punteado + input file
 * oculto + overlay de "Upload" al hacer hover). El estilo exacto del botón y
 * de la imagen de vista previa se pasa por prop porque cada panel usa un
 * tamaño y un `object-fit` distintos; lo que se comparte es la estructura,
 * la accesibilidad (label + input) y el comportamiento de click-para-abrir.
 */
export default function ImageUploadField({
    id,
    fileInputRef,
    previewUrl,
    onFileChange,
    alt,
    label,
    labelClassName = 'text-xs font-bold uppercase self-start',
    placeholderIcon: PlaceholderIcon = ImageIcon,
    placeholderText = 'Click para subir',
    buttonClassName,
    imageClassName,
    helper,
}) {
    return (
        <div className="flex flex-col items-center gap-3">
            {label && (
                <label htmlFor={id} className={labelClassName}>
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className={buttonClassName}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt={alt} loading="lazy" className={imageClassName} />
                ) : (
                    <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
                        <PlaceholderIcon className="w-8 h-8 mb-2" aria-hidden="true" />
                        <span className="text-2xs">{placeholderText}</span>
                    </div>
                )}

                <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-8 h-8 text-background" aria-hidden="true" />
                </div>
            </button>
            {!label && (
                <label htmlFor={id} className="sr-only">
                    {alt}
                </label>
            )}
            <input
                id={id}
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={onFileChange}
            />
            {helper}
        </div>
    );
}
