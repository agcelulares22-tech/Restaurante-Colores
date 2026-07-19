export function isUncertainArcaTransportError(message: string): boolean {
  return /timeout|tard.{0,12}demasiado|socket|connect|fetch failed|econnreset|epipe|etimedout|fecaesolicitar http 5\d\d/i.test(message);
}
