import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Formatea una fecha ISO a dd/mm/yyyy
 */
function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export async function generarPDFCarnet(carnet, qrUrl = '', esPreview = false) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.60, 53.98],
    compress: true,
  });

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Fondo azul
  doc.setFillColor(0, 70, 140);
  doc.rect(0, 0, w, h, 'F');

  // Borde blanco
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.rect(1, 1, w - 2, h - 2);

  // Encabezado
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('ASOCIACIÓN DEPARTAMENTAL DE PRODUCTORES DE COCA', w / 2, 4.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('ADEPCOCA', w / 2, 7, { align: 'center' });

  // Lema
  doc.setFontSize(3.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(200, 210, 255);
  doc.text('"Por el desarrollo del productor y la economía familiar"', w / 2, 9.5, { align: 'center' });

  // Título
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CARNET DE PRODUCTOR', w / 2, 12.5, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(200, 200, 255);
  doc.setLineWidth(0.2);
  doc.line(5, 13, w - 5, 13);

  // --- FOTO ---
  const photoX = 4;
  const photoY = 16;
  const photoW = 20;
  const photoH = 25;
  if (carnet.foto) {
    try {
      doc.addImage(carnet.foto, 'JPEG', photoX, photoY, photoW, photoH);
    } catch (e) {
      doc.setFillColor(200, 200, 200);
      doc.rect(photoX, photoY, photoW, photoH, 'F');
      doc.setTextColor(100);
      doc.setFontSize(4);
      doc.text('Sin foto', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }
  }

  // Código persona (encima de la foto)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(4);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cód pers: ${carnet.cod_persona || 'N/A'}`, photoX, photoY - 1.5);

  // Código socio (debajo de la foto)
  doc.setFontSize(4);
  doc.text(`Cód socio: ${carnet.cod_socio || 'N/A'}`, photoX, photoY + photoH + 2);

  // --- QR (a la altura de la foto, en la esquina superior derecha) ---
  const qrSize = 16;
  const qrX = w - qrSize - 3;
  const qrY = photoY + 1; // Alineado con la parte superior de la foto
  const qrData = qrUrl || `https://adepcoca.org/verificar/${carnet.id || carnet.cod_persona}`;

  try {
    const qrImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'L',
      margin: 1,
      width: qrSize * 4,
      color: { dark: '#000000', light: '#ffffff' },
    });
    doc.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (e) {
    doc.setFillColor(200, 200, 200);
    doc.rect(qrX, qrY, qrSize, qrSize, 'F');
  }

  // Texto "ESTADO PLURINACIONAL DE BOLIVIA" encima del QR
  doc.setFontSize(3.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 210, 255);
  doc.text('ESTADO PLURINACIONAL', qrX + qrSize / 2, qrY - 2.5, { align: 'center' });
  doc.setFontSize(3.5);
  doc.text('DE BOLIVIA', qrX + qrSize / 2, qrY - 0.5, { align: 'center' });

  // Texto "ESCANEA EL QR VERIFICA LA AUTENTICIDAD" debajo del QR
  doc.setFontSize(2.8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(180, 190, 220);
  doc.text('ESCANEA EL QR', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
  doc.text('VERIFICA LA AUTENTICIDAD', qrX + qrSize / 2, qrY + qrSize + 4.5, { align: 'center' });

  // --- DATOS DEL PRODUCTOR (entre foto y QR) ---
  const textX = photoX + photoW + 2.5;
  let textY = 18;
  const lineHeight = 4.2;
  const fontSize = 5.5;
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);

  const campos = [
    { label: 'Nombre:', value: `${carnet.nombres} ${carnet.primer_apellido} ${carnet.segundo_apellido || ''}`.trim() },
    { label: 'C.I.:', value: carnet.documento_identidad || '—' },
    { label: 'Nacimiento:', value: carnet.fecha_nacimiento || '—' },
    { label: 'Comunidad:', value: carnet.comunidad_descripcion || '—' },
    { label: 'Regional:', value: carnet.regional_descripcion || '—' },
    { label: 'Provincia:', value: carnet.provincia_descripcion || '—' },
  ];

  // Ancho máximo para los datos (dejando espacio para el QR)
  const maxTextWidth = w - textX - qrSize - 6;

  campos.forEach((campo) => {
    doc.setFont('helvetica', 'bold');
    const labelWidth = doc.getTextWidth(campo.label);
    doc.text(campo.label, textX, textY);
    doc.setFont('helvetica', 'normal');
    const valor = campo.value || '—';
    const valorAjustado = doc.splitTextToSize(valor, maxTextWidth - labelWidth - 1);
    doc.text(valorAjustado, textX + labelWidth + 0.5, textY);
    textY += lineHeight * (valorAjustado.length || 1);
  });

  // Línea separadora inferior
  textY += 1;
  doc.setDrawColor(200, 200, 255);
  doc.setLineWidth(0.2);
  doc.line(5, textY, w - 5, textY);
  textY += 1.5;

  // --- PRODUCTOR REGISTRADO y frases ---
  doc.setFontSize(3.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 210, 255);
  doc.text('PRODUCTOR REGISTRADO', textX, h - 6.5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(3.2);
  doc.setTextColor(180, 190, 220);
  doc.text('Acredita al titular como productor de hoja de coca.', textX, h - 3.5);

  // Fechas de emisión y vigencia
  doc.setFontSize(3.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 255);
  const fechaEmision = formatearFecha(carnet.fecha_emision);
  const fechaVigencia = formatearFecha(carnet.fecha_vigencia);
  doc.text(`Fecha emisión: ${fechaEmision}`, textX, h - 1.5);
  doc.text(`Vence: ${fechaVigencia}`, qrX, h - 1.5);

    // ============ MARCA DE AGUA (solo para previsualización) ============
  if (esPreview) {
    // Marca de agua grande y transparente en el centro
    doc.setFontSize(50);
    doc.setTextColor(200, 200, 200, 0.3); // Gris claro con opacidad
    doc.text(' ', w / 2, h / 2, { align: 'center' });

    // Texto adicional en la parte inferior
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text('VISTA PRELIMINAR - NO OFICIAL', w / 2, h - 2, { align: 'center' });
  }

  // Generar PDF como base64
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  return pdfBase64;
}

//export { generarPDFCarnet };