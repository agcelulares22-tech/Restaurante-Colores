export function createClientPedidoId(existingIds: number[] = [], now = Date.now(), random = Math.random()): number {
  // ID corto: segundos desde medianoche de hoy (max 86400) + random 3 dígitos
  // Resultado: número de 6-9 dígitos, siempre seguro para JS
  const d = new Date(now);
  const segundosDia = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  const rnd = Math.floor(random * 1000); // 0-999
  const candidate = segundosDia * 1000 + rnd; // max: 86400000 (9 dígitos)

  const maxExisting = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  return candidate > maxExisting ? candidate : maxExisting + 1;
}
