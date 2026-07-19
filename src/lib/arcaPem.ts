export type ArcaPemKind = 'CERTIFICATE' | 'PRIVATE KEY';

const PEM_HEADER = /-----BEGIN ([A-Z0-9 ]+)-----/;

export function normalizeArcaPem(value: string, kind: ArcaPemKind): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(kind === 'CERTIFICATE' ? 'El certificado está vacío.' : 'La clave privada está vacía.');
  }

  const normalized = value
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^(["'])([\s\S]*)\1$/, '$2')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n?/g, '\n')
    .trim();

  const label = normalized.match(PEM_HEADER)?.[1];
  const allowedLabels = kind === 'CERTIFICATE'
    ? ['CERTIFICATE']
    : ['PRIVATE KEY', 'RSA PRIVATE KEY'];
  if (!label || !allowedLabels.includes(label)) {
    if (label === 'ENCRYPTED PRIVATE KEY') {
      throw new Error('La clave privada está cifrada. Debe cargarse una clave PEM sin contraseña.');
    }
    throw new Error(kind === 'CERTIFICATE'
      ? 'El archivo no contiene un certificado X.509 PEM.'
      : 'El archivo no contiene una clave privada PEM compatible.');
  }

  const beginMarker = `-----BEGIN ${label}-----`;
  const endMarker = `-----END ${label}-----`;
  const beginIndex = normalized.indexOf(beginMarker);
  const endIndex = normalized.indexOf(endMarker, beginIndex + beginMarker.length);
  if (endIndex < 0) throw new Error(`Falta el cierre ${endMarker}.`);

  const body = normalized.slice(beginIndex + beginMarker.length, endIndex).replace(/\s+/g, '');
  if (!body || !/^[A-Za-z0-9+/]+={0,2}$/.test(body) || body.length % 4 !== 0) {
    throw new Error('El contenido Base64 del archivo PEM es inválido o está truncado.');
  }

  return `${beginMarker}\n${body.match(/.{1,64}/g)?.join('\n') || ''}\n${endMarker}`;
}
