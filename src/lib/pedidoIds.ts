export function createClientPedidoId(existingIds: string[] = [], now = Date.now(), random = Math.random()): string {
  const randomPart = Math.floor(random * 1000);
  const candidate = now * 1000 + randomPart;
  const numericIds = existingIds.map(id => Number(id) || 0);
  const maxExisting = Math.max(1000, ...numericIds);
  const finalId = candidate > maxExisting ? candidate : maxExisting + 1;
  return String(finalId);
}
