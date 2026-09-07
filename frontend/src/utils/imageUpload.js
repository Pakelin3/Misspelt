// Mismo límite que `api.validators.MAX_IMAGEN_BYTES` en el backend: el
// servidor es quien de verdad lo hace cumplir (incluso si esto se saltara),
// pero avisar aquí evita gastar la subida entera para que la rechacen al
// final. 10 MB es generoso para cualquier insignia o avatar real: las
// imágenes más pesadas medidas en este proyecto rondaban 1.5 MB.
export const MAX_IMAGEN_BYTES = 10 * 1024 * 1024;

export function formatearBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const unidades = ['KB', 'MB', 'GB'];
    let valor = bytes / 1024;
    let i = 0;
    while (valor >= 1024 && i < unidades.length - 1) {
        valor /= 1024;
        i += 1;
    }
    return `${valor.toFixed(1)} ${unidades[i]}`;
}
