// Semáforo de rendimiento (>=80 bien, >=50 regular, resto mal) usado por
// StatGauge, el historial de partidas y la evaluación del Oráculo. Antes
// estaba duplicado en dos sitios de ProfilePage.jsx con colores crudos de
// Tailwind (bg-green-500, bg-yellow-500, bg-red-500); ahora usa los tokens
// semánticos success/warning/destructive del contrato de UI.
// Vive en lib/ porque tambien lo consume GamePage, no solo el perfil.
export function getPerformanceTextClass(value) {
    if (value >= 80) return 'text-success';
    if (value >= 50) return 'text-warning';
    return 'text-destructive';
}

export function getPerformanceBgClass(value) {
    if (value >= 80) return 'bg-success';
    if (value >= 50) return 'bg-warning';
    return 'bg-destructive';
}
