"use strict";
import { VercelRequest, VercelResponse } from "@vercel/node";
import forge from "node-forge";

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

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await globalThis.fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      throw new Error("El servidor de la AFIP / ARCA tardó demasiado en responder (límite de 25 segundos excedido). Por favor, intenta de nuevo en unos instantes.");
    }
    throw err;
  }
}

function buildTicketReqXml(service: string): string {
  const uniqueId = Math.floor(Math.random() * 1000000).toString();
  // Formato ISO-8601 completo compatible con xsd:dateTime sin milisegundos
  const genTime = new Date(Date.now() - 2 * 60 * 1000).toISOString().split('.')[0] + 'Z';
  const expTime = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';

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

function sanitizeAndRepairPem(pem: string, defaultType: "CERTIFICATE" | "PRIVATE KEY"): string {
  let cleaned = pem.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  let type: string = defaultType;
  if (cleaned.includes("RSA PRIVATE KEY")) {
    type = "RSA PRIVATE KEY";
  } else if (cleaned.includes("PRIVATE KEY")) {
    type = "PRIVATE KEY";
  } else if (cleaned.includes("CERTIFICATE")) {
    type = "CERTIFICATE";
  }

  const beginHeader = `-----BEGIN ${type}-----`;
  const endHeader = `-----END ${type}-----`;

  if (!cleaned.includes(beginHeader)) {
    cleaned = beginHeader + "\n" + cleaned;
  }
  if (!cleaned.includes(endHeader)) {
    // Remove any trailing dashes or partial headers at the end
    cleaned = cleaned.replace(/---+[^\-]*$/, "").trim();
    cleaned = cleaned + "\n" + endHeader;
  }
  return cleaned;
}

// Firma el XML con el certificado y clave privada usando PKCS#7 / CMS
function signTicket(xml: string, cert: string, key: string): string {
  const certRaw = cert.includes("-----BEGIN") ? cert : Buffer.from(cert, "base64").toString("utf8");
  const keyRaw = key.includes("-----BEGIN") ? key : Buffer.from(key, "base64").toString("utf8");

  const certPem = sanitizeAndRepairPem(certRaw, "CERTIFICATE");
  const keyPem = sanitizeAndRepairPem(keyRaw, "PRIVATE KEY");

  const forgeCert = forge.pki.certificateFromPem(certPem);
  const forgeKey = forge.pki.privateKeyFromPem(keyPem);

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
      },
    ],
  });

  p7.sign();
  return forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes());
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

  try {
    const { action, credentials, payload } = req.body;

    if (!credentials || !credentials.cuit || !credentials.key || !credentials.cert) {
      return res.status(400).json({ error: "Credenciales de ARCA incompletas o faltantes" });
    }

    const envUrls = credentials.production ? URLS.produccion : URLS.homologacion;

    let auth: { token: string; sign: string };
    let newWsaaTokenRequested = false;
    let usingClientToken = false;

    if (req.body.wsaaToken && req.body.wsaaToken.token && req.body.wsaaToken.sign) {
      auth = req.body.wsaaToken;
      usingClientToken = true;
    } else {
      const ltrXml = buildTicketReqXml("wsfe");
      const cms = signTicket(ltrXml, credentials.cert, credentials.key);
      auth = await getWsaaToken(envUrls.wsaa, cms);
      newWsaaTokenRequested = true;
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
      <fe:PtoVta>1</fe:PtoVta>
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

        const ptoVta = payload.puntoVenta || 1;
        const cbteTipo = payload.tipoComprobante || 6;

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
        const baseImp = isFacturaC ? payload.total : (payload.neto || (payload.total / 1.21));
        const importeIva = isFacturaC ? 0 : (payload.ivaTotal || (payload.total - baseImp));

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
            <fe:CbteFch>${new Date().toISOString().split('T')[0].replace(/-/g, "")}</fe:CbteFch>
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

    try {
      const opResult = await performOperation(auth);
      if (opResult.success === false) {
        return res.status(422).json(opResult);
      }
      return res.json({
        ...opResult,
        wsaaToken: newWsaaTokenRequested ? auth : undefined
      });
    } catch (opErr: any) {
      // Si falló usando el token cacheado, reintentar con uno nuevo
      if (usingClientToken) {
        try {
          const ltrXml = buildTicketReqXml("wsfe");
          const cms = signTicket(ltrXml, credentials.cert, credentials.key);
          auth = await getWsaaToken(envUrls.wsaa, cms);
          
          const opResult = await performOperation(auth);
          if (opResult.success === false) {
            return res.status(422).json(opResult);
          }
          return res.json({
            ...opResult,
            wsaaToken: auth
          });
        } catch (retryErr: any) {
          return res.status(500).json({ error: retryErr.message || String(retryErr) });
        }
      } else {
        return res.status(500).json({ error: opErr.message || String(opErr) });
      }
    }
  } catch (err: any) {
    console.error("ARCA proxy handler error:", err);
    let msg = err.message || String(err);
    if (msg.includes("fetch failed") || msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("connect") || msg.toLowerCase().includes("und_err")) {
      msg = "Los servidores de pruebas (Homologación) de AFIP / ARCA no responden o se encuentran fuera de servicio temporalmente en este momento. Por favor, espera unos instantes y vuelve a intentar.";
    }
    return res.status(500).json({ error: msg });
  }
}