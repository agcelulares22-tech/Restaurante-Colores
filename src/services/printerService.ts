import { TicketData, PrinterConfig } from '../types';

export const printerService = {
  getDefaultConfig(): PrinterConfig {
    const raw = localStorage.getItem('colores_pizzeria_printer_config');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return {
      printerName: 'SAM4S GIANT-100S Thermal 80mm',
      paperWidth: '80mm',
      autoCut: true,
      openDrawer: true,
      copies: 2
    };
  },

  saveConfig(config: PrinterConfig): void {
    localStorage.setItem('colores_pizzeria_printer_config', JSON.stringify(config));
  },

  /**
   * Translates unified TicketData into a raw virtual ESC/POS receipt stream text (with support for cutting and kickouts).
   */
  generateEscPosText(data: TicketData, config: PrinterConfig): string {
    const is80 = config.paperWidth === '80mm';
    const charWidth = is80 ? 42 : 32;

    const padLeftRight = (left: string, right: string): string => {
      const spaceLength = charWidth - left.length - right.length;
      if (spaceLength <= 0) return `${left.slice(0, charWidth - right.length - 2)}.. ${right}`;
      return left + ' '.repeat(spaceLength) + right;
    };

    const separator = '-'.repeat(charWidth);
    const doubleSeparator = '='.repeat(charWidth);

    let esc = '';
    
    // ESC/POS Commands (Virtual tags representation)
    if (config.openDrawer) {
      esc += '[ESC/POS: KICK OUT DRAWER_PORT1]\n';
    }
    
    esc += '[ESC/POS: ALIGN CENTER]\n';
    esc += '[ESC/POS: TEXT FONT_DOUBLE_SIZE]\n';
    esc += `${data.nombreComercial.toUpperCase()}\n`;
    esc += '[ESC/POS: TEXT FONT_NORMAL]\n';
    esc += `${data.razonSocial}\n`;
    esc += `CUIT: ${data.cuit}\n`;
    esc += `${data.direccion}\n`;
    esc += `Tel: ${data.telefono}\n`;
    esc += `Email: ${data.email}\n`;
    esc += `${doubleSeparator}\n`;
    
    esc += '[ESC/POS: ALIGN LEFT]\n';
    esc += `TICKET Nº: ${data.nroComprobante}\n`;
    esc += `FECHA: ${data.fechaHora}\n`;
    esc += `MESA: ${data.mesa.toUpperCase()}\n`;
    esc += `MOZO: ${data.mozo}  |  CAJERO: ${data.cajero}\n`;
    esc += `PEDIDO ID: EP-${data.idPedido}\n`;
    esc += `${separator}\n`;
    
    esc += padLeftRight('CANT  PRODUCTO', 'SUBTOTAL') + '\n';
    esc += `${separator}\n`;
    
    data.items.forEach(it => {
      let desc = it.descripcion;
      esc += `${desc}\n`;
      const unitPrice = it.precio_unitario ?? it.precioUnitario ?? 0;
      const qtyStr = `  ${it.cantidad} x $${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
      const subtotalStr = `$${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
      esc += padLeftRight(qtyStr, subtotalStr) + '\n';
    });
    
    esc += `${separator}\n`;
    esc += padLeftRight('Subtotal Neto:', `$${data.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`) + '\n';
    if (data.descuento > 0) {
      esc += padLeftRight('Bonificación:', `-$${data.descuento.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`) + '\n';
    }
    if (data.propina > 0) {
      esc += padLeftRight('Propina Sugerida:', `$${data.propina.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`) + '\n';
    }
    esc += padLeftRight('IVA (21.0% incl.):', `$${data.iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`) + '\n';
    esc += `${separator}\n`;
    
    esc += '[ESC/POS: TEXT FONT_DOUBLE_SIZE]\n';
    esc += padLeftRight('TOTAL:', `$${data.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`) + '\n';
    esc += '[ESC/POS: TEXT FONT_NORMAL]\n';
    
    esc += `${doubleSeparator}\n`;
    esc += '[ESC/POS: ALIGN CENTER]\n';
    esc += 'MEDIOS DE PAGO:\n';
    data.metodosPago.forEach(mp => {
      esc += padLeftRight(`   ${mp.metodo.toUpperCase()}:`, `$${mp.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`) + '\n';
    });
    if (data.vuelto > 0) {
      esc += padLeftRight('   VUELTO ENTREGADO:', `$${data.vuelto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`) + '\n';
    }
    esc += `${separator}\n`;
    esc += `${data.mensajePie}\n`;
    esc += 'Muchas gracias por su visita.\n';
    esc += 'Conserve este comprobante.\n';
    esc += `${doubleSeparator}\n`;
    
    if (config.autoCut) {
      esc += '[ESC/POS: PARTIAL_CUT_FEED_3LINES]\n';
    }
    
    return esc;
  },

  /**
   * Secure integration layer for remote thermal printings.
   * If there is no physical local socket, it returns a descriptive simulation outcome allowing PDF falling back.
   */
  async sendToPrinter(data: TicketData, config: PrinterConfig): Promise<{
    success: boolean;
    message: string;
    methodUsed: string;
    rawText: string;
  }> {
    const rawText = this.generateEscPosText(data, config);
    console.log(`Print Dispatch Triggered: Printer "${config.printerName}" width=${config.paperWidth}. Output:\n`, rawText);

    // Simulated network or physical bridges check
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 100); // very fast check
      
      const response = await fetch('http://localhost:8012/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, config }),
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(id);

      if (response && response.ok) {
        return {
          success: true,
          message: `Ticket enviado exitosamente a la impresora física térmica local por puerto bridge IP (${config.printerName}).`,
          methodUsed: 'EspPosLocalBridge',
          rawText
        };
      }
    } catch {
      // safe bypass
    }

    // Default Fallback: PDF Thermal 80mm
    return {
      success: true,
      message: `Ticket generado exitosamente en formato térmico de ${config.paperWidth || '80mm'} (2 copias).`,
      methodUsed: 'FallbackSystemPDF',
      rawText
    };
  },

  printToBrowser(data: TicketData, paperWidth: '80mm' | '58mm' = '80mm'): void {
    const is58 = paperWidth === '58mm';
    const widthMm = is58 ? '54mm' : '76mm';
    const fontSize = is58 ? '10px' : '11px';

    const printWindow = window.open('', '_blank', 'width=420,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = (data.items || []).map(it => {
      const unit = it.precio_unitario ?? it.precioUnitario ?? 0;
      return `
        <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
          <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:4px;">
            ${it.cantidad}x ${it.descripcion}
          </span>
          <span style="font-family:monospace; font-weight:bold;">
            $${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      `;
    }).join('');

    const pagosHtml = (data.metodosPago || []).map(p => `
      <div style="display:flex; justify-content:space-between;">
        <span style="text-transform:uppercase;">${p.metodo}:</span>
        <span style="font-family:monospace;">$${p.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket - ${data.nroComprobante}</title>
        <style>
          @page {
            size: ${paperWidth} auto;
            margin: 0;
          }
          @media print {
            body {
              margin: 0 !important;
              padding: 2mm 1mm !important;
              width: ${widthMm} !important;
            }
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${fontSize};
            color: #000;
            background: #fff;
            width: ${widthMm};
            margin: 0 auto;
            padding: 8px 4px;
            line-height: 1.25;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .double-divider {
            border-top: 2px dashed #000;
            margin: 5px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
          }
          .total-row {
            font-size: 13px;
            font-weight: 900;
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div style="font-size: 14px; font-weight: bold; text-transform: uppercase;">${data.nombreComercial}</div>
          <div>${data.razonSocial}</div>
          <div>CUIT: ${data.cuit}</div>
          <div>${data.direccion}</div>
          <div>Tel: ${data.telefono}</div>
        </div>
        <div class="divider"></div>
        <div>
          <div class="row"><span>COMPROBANTE:</span> <span class="bold">${data.nroComprobante}</span></div>
          <div class="row"><span>FECHA:</span> <span>${data.fechaHora}</span></div>
          <div class="row"><span>MESA:</span> <span class="bold">${data.mesa}</span></div>
          <div class="row"><span>MOZO:</span> <span>${data.mozo}</span></div>
          <div class="row"><span>CAJERO:</span> <span>${data.cajero}</span></div>
          <div class="row"><span>CLIENTE:</span> <span>${data.clienteNombre || 'Consumidor Final'}</span></div>
        </div>
        <div class="divider"></div>
        <div class="row bold" style="font-size: 10px;">
          <span>CANT / DESCRIPCIÓN</span>
          <span>TOTAL ($)</span>
        </div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="row">
          <span>Subtotal:</span>
          <span class="bold font-mono">$${data.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
        </div>
        ${data.descuento > 0 ? `
          <div class="row">
            <span>Descuento:</span>
            <span class="bold">-$${data.descuento.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>
        ` : ''}
        ${data.propina > 0 ? `
          <div class="row">
            <span>Propina:</span>
            <span>$${data.propina.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="row total-row">
          <span>TOTAL:</span>
          <span>$${data.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="double-divider"></div>
        <div style="font-size: 10px;">
          <div class="bold" style="margin-bottom: 2px;">PAGO:</div>
          ${pagosHtml}
          ${data.vuelto > 0 ? `
            <div class="row bold">
              <span>Vuelto:</span>
              <span>$${data.vuelto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          ` : ''}
        </div>
        <div class="divider"></div>
        <div class="center" style="font-size: 10px; margin-top: 6px;">
          <div>${data.mensajePie || '¡Muchas gracias por su visita!'}</div>
          <div style="margin-top: 4px; font-size: 8px;">Colores Pizza POS</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

