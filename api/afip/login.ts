import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import https from "https";
import forge from "node-forge";

const AFIP_URLS = {
  homologacion: {
    wsaa: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
    wsfe: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
  },
  produccion: {
    wsaa: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
    wsfe: "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
  },
};

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { service, ticketReq, cert, key } = req.body;

    // Decodificar la solicitud de ticket req (XML)
    const rawXml = Buffer.from(ticketReq, "base64").toString("utf8");

    // Limpiar y preparar certificados
    const certRaw = cert.includes("-----BEGIN") ? cert : Buffer.from(cert, "base64").toString("utf8");
    const keyRaw = key.includes("-----BEGIN") ? key : Buffer.from(key, "base64").toString("utf8");

    const certPem = sanitizeAndRepairPem(certRaw, "CERTIFICATE");
    const keyPem = sanitizeAndRepairPem(keyRaw, "PRIVATE KEY");

    let forgeCert;
    try {
      forgeCert = forge.pki.certificateFromPem(certPem);
    } catch (err: any) {
      throw new Error(`Error al parsear el Certificado PEM (largo ${certPem.length}): ${err.message}. Empieza con: "${certPem.substring(0, 60)}"`);
    }

    let forgeKey;
    try {
      forgeKey = forge.pki.privateKeyFromPem(keyPem);
    } catch (err: any) {
      throw new Error(`Error al parsear la Clave Privada PEM (largo ${keyPem.length}): ${err.message}. Empieza con: "${keyPem.substring(0, 60)}"`);
    } 

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(rawXml, "utf8");
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
    const cms = forge.util.encode64(bytes).replace(/\r?\n|\r/g, "");

    const env = AFIP_URLS[req.body.cuit === "99999999999" ? "homologacion" : "produccion"];
    const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov.ar">
  <soap:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(env.wsaa, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
      body: soap,
    });

    const xml = await response.text();
    res.setHeader("Content-Type", "text/xml");
    res.status(200).send(xml);
  } catch (err: any) {
    console.error("AFIP WSAA error:", err);
    let msg = err.message || String(err);
    if (msg.includes("fetch failed") || msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("connect") || msg.toLowerCase().includes("und_err")) {
      msg = "Los servidores de pruebas (Homologación) de AFIP / ARCA no responden o se encuentran fuera de servicio temporalmente en este momento. Por favor, espera unos instantes y vuelve a intentar.";
    }
    res.status(500).json({ error: msg });
  }
}
