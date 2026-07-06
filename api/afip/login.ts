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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { service, ticketReq, cert, key } = req.body;

    // Decodificar la solicitud de ticket req (XML)
    const rawXml = Buffer.from(ticketReq, "base64").toString("utf8");

    // Limpiar y preparar certificados
    const certPem = cert.includes("-----BEGIN") ? cert.trim() : Buffer.from(cert, "base64").toString("utf8").trim();
    const keyPem = key.includes("-----BEGIN") ? key.trim() : Buffer.from(key, "base64").toString("utf8").trim();

    const forgeCert = forge.pki.certificateFromPem(certPem);
    const forgeKey = forge.pki.privateKeyFromPem(keyPem);

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
    res.status(500).json({ error: err.message });
  }
}
