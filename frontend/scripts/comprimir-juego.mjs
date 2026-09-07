/**
 * Pre-comprime los archivos del juego exportado desde Godot.
 *
 * Por que hace falta
 * ------------------
 * El export web de Godot deja `index.wasm` (~34 MB) y `index.pck` junto al
 * resto en `public/game/`. Son archivos estaticos que nadie comprime por su
 * cuenta: medido contra el servidor de desarrollo, la respuesta llegaba con
 * `content-length: 35739700` y **sin** `content-encoding`. Es decir, el
 * jugador se descargaba los 34 MB enteros, y el bundle completo pasaba de los
 * 79 MB.
 *
 * Y comprime muy bien, porque el wasm es codigo:
 *
 *     index.wasm   34.1 MB  ->  9.5 MB gzip  ->  7.9 MB brotli   (-77%)
 *     index.js      0.3 MB  ->  0.1 MB                          (-76%)
 *
 * El `.pck` comprime menos (los .ogg de dentro ya estan comprimidos), pero
 * tambien baja.
 *
 * No se comprime al vuelo en cada peticion: brotli sobre 34 MB tarda
 * suficiente como para que cada recarga del navegador se notara. Se genera una
 * vez, tras cada exportacion desde Godot.
 *
 * Uso
 * ---
 *     npm run comprimir-juego
 *
 * Genera un `.br` y un `.gz` al lado de cada archivo. En desarrollo los sirve
 * el plugin `servirJuegoComprimido` de `vite.config.js`. En produccion los
 * copia `vite build` a `dist/game/` y hay que decirle al servidor que los use
 * (ver el README de ese plugin).
 */
import { createReadStream, createWriteStream } from 'node:fs';
import { stat, readdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const DIRECTORIO_JUEGO = path.resolve(aqui, '../public/game');

// Solo lo que merece la pena: los archivos grandes y de texto/codigo. Las
// imagenes (.png) ya vienen comprimidas y volver a comprimirlas no aporta.
const EXTENSIONES = ['.wasm', '.pck', '.js', '.html'];

// Por debajo de esto el ahorro no compensa ni la peticion ni el archivo extra.
const MINIMO_BYTES = 1024;

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

const comprimir = async (origen, destino, transformador) => {
    await pipeline(createReadStream(origen), transformador, createWriteStream(destino));
    return (await stat(destino)).size;
};

const main = async () => {
    let entradas;
    try {
        entradas = await readdir(DIRECTORIO_JUEGO);
    } catch {
        console.error(`No existe ${DIRECTORIO_JUEGO}. Exporta el juego desde Godot primero.`);
        process.exitCode = 1;
        return;
    }

    const objetivos = entradas.filter(
        (f) => EXTENSIONES.includes(path.extname(f)) && !f.endsWith('.br') && !f.endsWith('.gz'),
    );

    if (objetivos.length === 0) {
        console.error(`No hay nada que comprimir en ${DIRECTORIO_JUEGO}.`);
        process.exitCode = 1;
        return;
    }

    let original = 0;
    let brotli = 0;

    for (const nombre of objetivos.sort()) {
        const ruta = path.join(DIRECTORIO_JUEGO, nombre);
        const { size } = await stat(ruta);
        if (size < MINIMO_BYTES) continue;

        const tamBr = await comprimir(ruta, `${ruta}.br`, zlib.createBrotliCompress({
            params: {
                // 5 en lugar de 11: el 11 tarda minutos sobre 34 MB y el archivo
                // final apenas baja un 2%. No merece la espera en cada export.
                [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
                [zlib.constants.BROTLI_PARAM_SIZE_HINT]: size,
            },
        }));
        const tamGz = await comprimir(ruta, `${ruta}.gz`, zlib.createGzip({ level: 6 }));

        original += size;
        brotli += tamBr;

        const ahorro = (100 - (tamBr * 100) / size).toFixed(0);
        console.log(
            `  ${nombre.padEnd(24)} ${mb(size).padStart(9)}  ->  br ${mb(tamBr).padStart(8)}`
            + `  gz ${mb(tamGz).padStart(8)}   (-${ahorro}%)`,
        );
    }

    console.log(
        `\n  total  ${mb(original)}  ->  ${mb(brotli)} con brotli`
        + `  (-${(100 - (brotli * 100) / original).toFixed(0)}%)`,
    );
};

main();
