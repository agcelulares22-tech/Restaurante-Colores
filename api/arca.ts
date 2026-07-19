"use strict";
import { VercelRequest, VercelResponse } from "@vercel/node";
import forge from "node-forge";
import https from "https";
import crypto from "node:crypto";
import { canUseArca, formatArcaDate, normalizeArcaRole, validateArcaInvoicePayload } from "../src/lib/arcaApiSecurity.js";
import { isUncertainArcaTransportError } from "../src/lib/arcaTransport.js";
import { withSerializedKey } from "../src/lib/serialQueue.js";

export type ArcaPemKind = "CERTIFICATE" | "PRIVATE KEY";

const PEM_HEADER = /-----BEGIN ([A-Z0-9 ]+)-----/;

export function normalizeArcaPem(value: string, kind: ArcaPemKind): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(kind === "CERTIFICATE" ? "El certificado está vacío." : "La clave privada está vacía.");
  }

  const normalized = value
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^(["'])([\s\S]*)\1$/, "$2")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n?/g, "\n")
    .trim();

  const label = normalized.match(PEM_HEADER)?.[1];
  const allowedLabels = kind === "CERTIFICATE"
    ? ["CERTIFICATE"]
    : ["PRIVATE KEY", "RSA PRIVATE KEY"];

  if (!label || !allowedLabels.includes(label)) {
    if (label === "ENCRYPTED PRIVATE KEY") {
      throw new Error("La clave privada está cifrada. Debe cargarse una clave PEM sin contraseña.");
    }
    throw new Error(
      kind === "CERTIFICATE"
        ? "El archivo no contiene un certificado X.509 PEM."
        : "El archivo no contiene una clave privada PEM compatible."
    );
  }

  const beginMarker = `-----BEGIN ${label}-----`;
  const endMarker = `-----END ${label}-----`;
  const beginIndex = normalized.indexOf(beginMarker);
  const endIndex = normalized.indexOf(endMarker, beginIndex + beginMarker.length);
  if (endIndex < 0) {
    throw new Error(`Falta el cierre ${endMarker}.`);
  }

  const body = normalized
    .slice(beginIndex + beginMarker.length, endIndex)
    .replace(/\s+/g, "");
  if (!body || !/^[A-Za-z0-9+/]+={0,2}$/.test(body) || body.length % 4 !== 0) {
    throw new Error("El contenido Base64 del archivo PEM es inválido o está truncado.");
  }

  const wrappedBody = body.match(/.{1,64}/g)?.join("\n") || "";
  return `${beginMarker}\n${wrappedBody}\n${endMarker}`;
}

const URLS = {
  homologacion: {
    wsaa: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
    wsfe: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
  },
  produccion: {
    wsaa: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
    wsfe: "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
  },
};

// Caché en memoria del servidor (persiste mientras la función esté tibia en Vercel)
const globalTaCache: { [cuit: string]: { token: string; sign: string; expiresAt: number } } = {};
const requestRateLimit = new Map<string, { count: number; resetAt: number }>();

interface ArcaServerConfig {
  cuit: number;
  key: string;
  cert: string;
  production: boolean;
  puntoVenta: number;
}

function readPositiveInteger(value: unknown, name: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} no está configurado correctamente.`);
  return parsed;
}

function getServerConfig(): ArcaServerConfig {
  // Compatibilidad transitoria: VITE_ARCA_CERT/KEY siguen disponibles solo en
  // el runtime de Vercel, pero vite.config.ts impide que entren al navegador.
  const cert = process.env.ARCA_CERT || process.env.VITE_ARCA_CERT || '';
  const key = process.env.ARCA_KEY || process.env.VITE_ARCA_KEY || '';
  const cuit = readPositiveInteger(process.env.ARCA_CUIT || process.env.VITE_ARCA_CUIT, 'ARCA_CUIT');
  const puntoVenta = readPositiveInteger(process.env.ARCA_PTO_VTA || process.env.VITE_ARCA_PTO_VTA || '1', 'ARCA_PTO_VTA');
  if (!cert || !key) throw new Error('El certificado o la clave privada ARCA no están configurados en el servidor.');
  return {
    cuit,
    puntoVenta,
    cert,
    key,
    production: String(process.env.ARCA_PROD || process.env.VITE_ARCA_PROD).toLowerCase() === 'true',
  };
}

async function authenticateArcaRequest(req: VercelRequest): Promise<{ id: string; role: string }> {
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) throw Object.assign(new Error('Iniciá sesión para usar la facturación fiscal.'), { statusCode: 401 });

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) throw Object.assign(new Error('La validación de usuarios no está configurada.'), { statusCode: 503 });

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
  });
  if (!authResponse.ok) throw Object.assign(new Error('La sesión es inválida o venció.'), { statusCode: 401 });
  const authUser = await authResponse.json() as { id?: string; email?: string };
  if (!authUser.id || !authUser.email) throw Object.assign(new Error('La sesión no identifica un usuario.'), { statusCode: 401 });

  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/usuarios?select=username,rol,activo`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) throw Object.assign(new Error('No se pudo verificar el perfil operativo.'), { statusCode: 403 });
  const profiles = await profileResponse.json() as Array<{ username?: string; rol?: string; activo?: boolean }>;
  const email = authUser.email.trim().toLowerCase();
  const username = email.split('@')[0];
  const profile = profiles.find(item => {
    const candidate = String(item.username || '').trim().toLowerCase();
    return candidate === username || candidate === email;
  });
  if (!profile || profile.activo === false || !canUseArca(profile.rol)) {
    throw Object.assign(new Error('Tu perfil no tiene permiso para emitir comprobantes fiscales.'), { statusCode: 403 });
  }
  return { id: authUser.id, role: normalizeArcaRole(profile.rol) };
}

function enforceRateLimit(actorId: string): void {
  const now = Date.now();
  const current = requestRateLimit.get(actorId);
  if (!current || current.resetAt <= now) {
    requestRateLimit.set(actorId, { count: 1, resetAt: now + 60_000 });
    return;
  }
  current.count += 1;
  if (current.count > 20) {
    throw Object.assign(new Error('Demasiadas solicitudes fiscales. Esperá un minuto e intentá nuevamente.'), { statusCode: 429 });
  }
}

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 25000): Promise<{ ok: boolean; status: number; text: () => Promise<string> }> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const reqOptions: https.RequestOptions = {
        method: options.method || "GET",
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: options.headers || {},
        ciphers: "DEFAULT:@SECLEVEL=1",
        timeout: timeoutMs,
      };

      const req = https.request(reqOptions, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({
            ok: (res.statusCode || 200) >= 200 && (res.statusCode || 200) < 300,
            status: res.statusCode || 200,
            text: async () => data,
          });
        });
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("El servidor de la AFIP / ARCA tardó demasiado en responder (límite de 25 segundos excedido). Por favor, intenta de nuevo en unos instantes."));
      });

      req.on("error", (err) => {
        reject(err);
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function buildTicketReqXml(service: string): string {
  const uniqueId = Math.floor(Math.random() * 1000000).toString();
  // Formato ISO-8601 completo compatible con xsd:dateTime sin milisegundos
  const genTime = new Date(Date.now() - 2 * 60 * 1000).toISOString().split('.')[0] + 'Z';
  const expTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${genTime}</generationTime>
    <expirationTime>${expTime}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;
}

// Firma el XML con el certificado y clave privada usando PKCS#7 / CMS
function signTicket(xml: string, cert: string, key: string): string {
  const certRaw = cert.includes("-----BEGIN") ? cert : Buffer.from(cert, "base64").toString("utf8");
  const keyRaw = key.includes("-----BEGIN") ? key : Buffer.from(key, "base64").toString("utf8");

  let certPem: string;
  let keyPem: string;
  try {
    certPem = normalizeArcaPem(certRaw, "CERTIFICATE");
  } catch (error: any) {
    throw new Error(`Certificado ARCA inválido: ${error?.message || String(error)}`);
  }
  try {
    keyPem = normalizeArcaPem(keyRaw, "PRIVATE KEY");
  } catch (error: any) {
    throw new Error(`Clave privada ARCA inválida: ${error?.message || String(error)}`);
  }

  let forgeCert: forge.pki.Certificate;
  let forgeKey: forge.pki.rsa.PrivateKey;
  try {
    forgeCert = forge.pki.certificateFromPem(certPem);
  } catch (error: any) {
    throw new Error(`Certificado ARCA inválido: ${error?.message || String(error)}`);
  }
  try {
    forgeKey = forge.pki.privateKeyFromPem(keyPem);
  } catch (error: any) {
    throw new Error(`Clave privada ARCA inválida: ${error?.message || String(error)}`);
  }

  const publicKey = forgeCert.publicKey as forge.pki.rsa.PublicKey;
  if (!publicKey?.n || !forgeKey?.n || publicKey.n.compareTo(forgeKey.n) !== 0) {
    throw new Error('El certificado ARCA y la clave privada no corresponden al mismo par criptográfico.');
  }

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(xml, "utf8");
  p7.addCertificate(forgeCert);
  p7.addSigner({
    key: forgeKey,
    certificate: forgeCert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date(),
      },
    ],
  });

  p7.sign();
  const bytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return forge.util.encode64(bytes).replace(/\r?\n|\r/g, "");
}

// Obtiene el token de WSAA enviando el ticket firmado
async function getWsaaToken(wsaaUrl: string, cms: string): Promise<{ token: string; sign: string }> {
  const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov.ar">
  <soap:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soap:Body>
</soap:Envelope>`;

  const response = await fetchWithTimeout(wsaaUrl, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
    body: soap,
  });

  if (!response.ok) {
    throw new Error(`WSAA HTTP ${response.status}: ${await response.text()}`);
  }

  const xml = await response.text();
  // Decodificar entidades HTML ya que AFIP devuelve el XML de login escapado dentro del SOAP Body
  const decodedXml = xml.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const token = decodedXml.match(/<token>([^<]+)<\/token>/)?.[1] || "";
  const sign = decodedXml.match(/<sign>([^<]+)<\/sign>/)?.[1] || "";

  if (!token || !sign) {
    throw new Error("WSAA retornó credenciales vacías o inválidas. Respuesta AFIP: " + xml.replace(/<\/?loginCmsReturn>/g, '').substring(0, 400));
  }

  return { token, sign };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const correlationId = String(req.headers['x-vercel-id'] || crypto.randomUUID());
  let authorizationSubmitted = false;
  res.setHeader('X-Correlation-Id', correlationId);

  try {
    const bodySize = Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8');
    if (bodySize > 100_000) return res.status(413).json({ error: 'La solicitud fiscal es demasiado grande.' });

    const actor = await authenticateArcaRequest(req);
    enforceRateLimit(actor.id);
    const { action, payload: rawPayload } = req.body ?? {};
    if (action !== 'test' && action !== 'createInvoice') {
      return res.status(400).json({ error: 'Acción fiscal no soportada.', correlationId });
    }

    const credentials = getServerConfig();
    const payload = action === 'createInvoice' ? validateArcaInvoicePayload(rawPayload) : undefined;

    const envUrls = credentials.production ? URLS.produccion : URLS.homologacion;

    let auth: { token: string; sign: string };
    let usingCachedToken = false;

    const cuitKey = `${credentials.production ? 'prod' : 'homo'}:${credentials.cuit}`;
    const cachedGlobal = globalTaCache[cuitKey];

    if (cachedGlobal && cachedGlobal.expiresAt > Date.now()) {
      auth = { token: cachedGlobal.token, sign: cachedGlobal.sign };
      usingCachedToken = true;
    } else {
      try {
        const ltrXml = buildTicketReqXml("wsfe");
        const cms = signTicket(ltrXml, credentials.cert, credentials.key);
        auth = await getWsaaToken(envUrls.wsaa, cms);

        globalTaCache[cuitKey] = {
          token: auth.token,
          sign: auth.sign,
          expiresAt: Date.now() + 10 * 60 * 60 * 1000
        };
      } catch (wsaaErr: any) {
        const detail = wsaaErr.cause ? ` (${wsaaErr.cause.message || String(wsaaErr.cause)})` : '';
        let errorMsg = `${wsaaErr.message || String(wsaaErr)}${detail}`;
        if (errorMsg.includes("alreadyAuthenticated")) {
          errorMsg = "La AFIP indica que ya posee un Token de Acceso activo para su CUIT y certificado. Para evitar este bloqueo preventivo, por favor espera de 5 a 10 minutos y vuelve a intentar.";
        }
        return res.status(502).json({ error: errorMsg, correlationId });
      }
    }

    async function performOperation(tokenObj: { token: string; sign: string }) {
      if (action === "test") {
        // En un test de conexión, tratamos de consultar el último comprobante autorizado para validar el token
        const soapLast = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fe="http://ar.gov.afip.dif.FEV1/">
  <soap:Header/>
  <soap:Body>
    <fe:FECompUltimoAutorizado>
      <fe:Auth>
        <fe:Token>${tokenObj.token}</fe:Token>
        <fe:Sign>${tokenObj.sign}</fe:Sign>
        <fe:Cuit>${credentials.cuit}</fe:Cuit>
      </fe:Auth>
      <fe:PtoVta>${credentials.puntoVenta}</fe:PtoVta>
      <fe:CbteTipo>6</fe:CbteTipo>
    </fe:FECompUltimoAutorizado>
  </soap:Body>
</soap:Envelope>`;

        const responseLast = await fetchWithTimeout(envUrls.wsfe, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado",
          },
          body: soapLast,
        });

        if (!responseLast.ok) {
          throw new Error(`WSFE FECompUltimoAutorizado HTTP ${responseLast.status}`);
        }
        const xmlLast = await responseLast.text();
        if (xmlLast.includes("soap:Fault") || xmlLast.includes("soapenv:Fault") || xmlLast.includes("Validation")) {
          const faultMsg = xmlLast.match(/<faultstring>([^<]+)<\/faultstring>/)?.[1] || "Error de autorización en AFIP";
          throw new Error(faultMsg);
        }
        return { success: true, message: "Conexión a ARCA establecida con éxito." };
      }

      if (action === "createInvoice") {
        if (!payload) {
          throw new Error("Payload de factura faltante");
        }

        const ptoVta = credentials.puntoVenta;
        const cbteTipo = payload.tipoComprobante;

        const soapLast = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fe="http://ar.gov.afip.dif.FEV1/">
  <soap:Header/>
  <soap:Body>
    <fe:FECompUltimoAutorizado>
      <fe:Auth>
        <fe:Token>${tokenObj.token}</fe:Token>
        <fe:Sign>${tokenObj.sign}</fe:Sign>
        <fe:Cuit>${credentials.cuit}</fe:Cuit>
      </fe:Auth>
      <fe:PtoVta>${ptoVta}</fe:PtoVta>
      <fe:CbteTipo>${cbteTipo}</fe:CbteTipo>
    </fe:FECompUltimoAutorizado>
  </soap:Body>
</soap:Envelope>`;

        const responseLast = await fetchWithTimeout(envUrls.wsfe, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado",
          },
          body: soapLast,
        });

        if (!responseLast.ok) {
          throw new Error(`WSFE FECompUltimoAutorizado HTTP ${responseLast.status}`);
        }

        const xmlLast = await responseLast.text();
        if (xmlLast.includes("soap:Fault") || xmlLast.includes("soapenv:Fault") || xmlLast.includes("Validation")) {
          const faultMsg = xmlLast.match(/<faultstring>([^<]+)<\/faultstring>/)?.[1] || "Error en WSFE al validar punto de venta";
          throw new Error(faultMsg);
        }

        const lastCbteNum = parseInt(xmlLast.match(/<CbteNro>(\d+)<\/CbteNro>/)?.[1] || "0");
        const nextCbteNum = lastCbteNum + 1;

        const isFacturaC = cbteTipo === 11;
        const baseImp = payload.neto;
        const importeIva = payload.ivaTotal;

        const ivaBlock = isFacturaC ? "" : `
            <fe:Iva>
              <fe:AlicIva>
                <fe:Id>5</fe:Id>
                <fe:BaseImp>${baseImp.toFixed(2)}</fe:BaseImp>
                <fe:Importe>${importeIva.toFixed(2)}</fe:Importe>
              </fe:AlicIva>
            </fe:Iva>`;

        const soapInvoice = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fe="http://ar.gov.afip.dif.FEV1/">
  <soap:Header/>
  <soap:Body>
    <fe:FECAESolicitar>
      <fe:Auth>
        <fe:Token>${tokenObj.token}</fe:Token>
        <fe:Sign>${tokenObj.sign}</fe:Sign>
        <fe:Cuit>${credentials.cuit}</fe:Cuit>
      </fe:Auth>
      <fe:FeCAEReq>
        <fe:FeCabReq>
          <fe:CantReg>1</fe:CantReg>
          <fe:PtoVta>${ptoVta}</fe:PtoVta>
          <fe:CbteTipo>${cbteTipo}</fe:CbteTipo>
        </fe:FeCabReq>
        <fe:FeDetReq>
          <fe:FECAEDetRequest>
            <fe:Concepto>1</fe:Concepto>
            <fe:DocTipo>${payload.cliente?.tipoDoc || 99}</fe:DocTipo>
            <fe:DocNro>${payload.cliente?.nroDoc || 0}</fe:DocNro>
            <fe:CbteDesde>${nextCbteNum}</fe:CbteDesde>
            <fe:CbteHasta>${nextCbteNum}</fe:CbteHasta>
            <fe:CbteFch>${formatArcaDate()}</fe:CbteFch>
            <fe:CondicionIVAReceptorId>${payload.cliente?.condicionIva || 5}</fe:CondicionIVAReceptorId>
            <fe:ImpTotal>${payload.total.toFixed(2)}</fe:ImpTotal>
            <fe:ImpTotConc>0.00</fe:ImpTotConc>
            <fe:ImpNeto>${baseImp.toFixed(2)}</fe:ImpNeto>
            <fe:ImpOpEx>0.00</fe:ImpOpEx>
            <fe:ImpTrib>0.00</fe:ImpTrib>
            <fe:ImpIVA>${importeIva.toFixed(2)}</fe:ImpIVA>
            <fe:MonId>PES</fe:MonId>
            <fe:MonCotiz>1</fe:MonCotiz>
            ${ivaBlock}
          </fe:FECAEDetRequest>
        </fe:FeDetReq>
      </fe:FeCAEReq>
    </fe:FECAESolicitar>
  </soap:Body>
</soap:Envelope>`;

        authorizationSubmitted = true;
        const responseInvoice = await fetchWithTimeout(envUrls.wsfe, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "http://ar.gov.afip.dif.FEV1/FECAESolicitar",
          },
          body: soapInvoice,
        });

        if (!responseInvoice.ok) {
          throw new Error(`WSFE FECAESolicitar HTTP ${responseInvoice.status}`);
        }

        const xmlInvoice = await responseInvoice.text();
        const getTag = (tag: string) => xmlInvoice.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`))?.[1] || "";
        const cae = getTag("CAE");
        const vto = getTag("CAEFchVto");
        const resultado = getTag("Resultado");

        const obs: Array<{ code: number; msg: string }> = [];
        const obsBlocks = xmlInvoice.match(/<Obs>.*?<\/Obs>/gs) || [];
        obsBlocks.forEach((block) => {
          const code = parseInt(block.match(/<Code>(\d+)<\/Code>/)?.[1] || "0");
          const msg = block.match(/<Msg>([^<]*)<\/Msg>/)?.[1] || "";
          if (code) obs.push({ code, msg });
        });

        // Parsear también la etiqueta <Err> (Errores estructurales)
        const errBlocks = xmlInvoice.match(/<Err>.*?<\/Err>/gs) || [];
        errBlocks.forEach((block) => {
          const code = parseInt(block.match(/<Code>(\d+)<\/Code>/)?.[1] || "0");
          const msg = block.match(/<Msg>([^<]*)<\/Msg>/)?.[1] || "";
          if (code) obs.push({ code, msg });
        });

        if (resultado === "R") {
          const errors = obs.map(o => `[${o.code}] ${o.msg}`).join("; ");
          return {
            success: false,
            resultado,
            observaciones: obs,
            error: `ARCA rechazó la solicitud: ${errors || "Error de estructura / validación interna"}`
          };
        }

        return {
          success: true,
          resultado,
          cae,
          vencimiento: vto,
          CodAutorizacion: cae,
          CAE: cae,
          Vencimiento: vto,
          CAEFchVto: vto,
          nroCmp: nextCbteNum
        };
      }
      throw new Error(`Acción '${action}' no soportada.`);
    }

    const operationKey = `${cuitKey}:${credentials.puntoVenta}:${payload?.tipoComprobante ?? 'test'}`;
    const runOperation = (tokenObj: { token: string; sign: string }) => (
      action === 'createInvoice'
        ? withSerializedKey(operationKey, () => performOperation(tokenObj))
        : performOperation(tokenObj)
    );

    try {
      const opResult = await runOperation(auth);
      if (opResult.success === false) {
        return res.status(422).json({ ...opResult, correlationId });
      }
      return res.json({ ...opResult, correlationId });
    } catch (opErr: any) {
      // Si falló usando el token cacheado, reintentar con uno nuevo
      if (usingCachedToken && action === 'test') {
        try {
          const ltrXml = buildTicketReqXml("wsfe");
          const cms = signTicket(ltrXml, credentials.cert, credentials.key);
          auth = await getWsaaToken(envUrls.wsaa, cms);
          
          globalTaCache[cuitKey] = {
            token: auth.token,
            sign: auth.sign,
            expiresAt: Date.now() + 10 * 60 * 60 * 1000
          };

          const opResult = await runOperation(auth);
          if (opResult.success === false) {
            return res.status(422).json({ ...opResult, correlationId });
          }
          return res.json({ ...opResult, correlationId });
        } catch (retryErr: any) {
          const detail = retryErr.cause ? ` (${retryErr.cause.message || String(retryErr.cause)})` : '';
          let errorMsg = `${retryErr.message || String(retryErr)}${detail}`;
          if (errorMsg.includes("alreadyAuthenticated")) {
            errorMsg = "La AFIP indica que ya existe un Token de Acceso activo para este certificado y no permite generar uno nuevo. Por favor, espera de 5 a 10 minutos para que el servidor de la AFIP libere la sesión o vuelve a intentar.";
          }
          return res.status(502).json({ error: errorMsg, correlationId });
        }
      } else {
        const message = opErr.message || String(opErr);
        if (authorizationSubmitted && isUncertainArcaTransportError(message)) {
          return res.status(504).json({
            error: 'El resultado de ARCA es incierto. No vuelvas a emitir hasta reconciliar el comprobante con ARCA.',
            uncertain: true,
            correlationId,
          });
        }
        if (usingCachedToken) delete globalTaCache[cuitKey];
        return res.status(502).json({ error: message, correlationId });
      }
    }
  } catch (err: any) {
    console.error("ARCA proxy handler error", { correlationId, message: err?.message || String(err) });
    const detail = err.cause ? ` (${err.cause.message || String(err.cause)})` : '';
    let msg = `${err.message || String(err)}${detail}`;
    if (msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("connect") || msg.toLowerCase().includes("und_err") || msg.includes("fetch failed")) {
      msg = `Error de red al conectar con AFIP: ${msg}. Por favor, vuelve a intentar en unos instantes.`;
    }
    const statusCode = Number(err?.statusCode) || 500;
    return res.status(statusCode).json({ error: msg, correlationId });
  }
}
