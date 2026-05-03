import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceOptions {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessLogo?: string;
  clientName?: string;
  tableNumber?: string;
  invoiceNumber: string;
  date: string;
  items: InvoiceItem[];
  paymentMethod?: string;
  withTVA?: boolean;
  tvaRate?: number;
}

const NAVY: [number, number, number] = [12, 24, 46];
const GOLD: [number, number, number] = [245, 166, 35];
const GRAY: [number, number, number] = [110, 110, 110];
const LIGHT: [number, number, number] = [248, 248, 248];

export async function generateInvoicePDF(opts: InvoiceOptions): Promise<void> {
  const {
    businessName,
    businessAddress = 'Douala, Cameroun',
    businessPhone,
    businessLogo,
    clientName,
    tableNumber,
    invoiceNumber,
    date,
    items,
    paymentMethod = 'Espèces',
    withTVA = false,
    tvaRate = 19.25,
  } = opts;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 20;
  let y = M;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 50, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 48, W, 2.5, 'F');

  if (businessLogo) {
    try {
      doc.addImage(businessLogo, 'PNG', W - M - 26, 10, 18, 18);
    } catch {
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...GOLD);
  doc.text(businessName.toUpperCase(), M, y + 10);

  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text('FACTURE', W - M, y + 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(businessAddress, M, y + 19);
  if (businessPhone) doc.text(businessPhone, M, y + 25);

  doc.setTextColor(200, 200, 200);
  doc.text(`N° ${invoiceNumber}`, W - M, y + 19, { align: 'right' });
  doc.text(`Date : ${date}`, W - M, y + 25, { align: 'right' });

  y = 62;

  if (clientName || tableNumber) {
    doc.setFillColor(...LIGHT);
    doc.roundedRect(M, y, W - 2 * M, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text('CLIENT / TABLE', M + 5, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    if (clientName) doc.text(clientName, M + 5, y + 14);
    if (tableNumber) doc.text(`Table ${tableNumber}`, W - M - 5, y + 11, { align: 'right' });
    y += 28;
  } else {
    y += 8;
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tvaAmount = withTVA ? Math.round(subtotal * tvaRate / 100) : 0;
  const total = subtotal + tvaAmount;

  autoTable(doc, {
    startY: y,
    head: [['Désignation', 'Qté', 'Prix unitaire', 'Total']],
    body: items.map(item => [
      item.name,
      item.quantity,
      `${item.unitPrice.toLocaleString('fr-FR')} FCFA`,
      `${(item.quantity * item.unitPrice).toLocaleString('fr-FR')} FCFA`,
    ]),
    margin: { left: M, right: M },
    headStyles: {
      fillColor: NAVY,
      textColor: GOLD,
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 4,
    },
    bodyStyles: { textColor: [30, 30, 30], fontSize: 9, cellPadding: 3.5 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 48, halign: 'right' },
      3: { cellWidth: 48, halign: 'right', fontStyle: 'bold' },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  const TW = 88;
  const TX = W - M - TW;

  if (withTVA) {
    doc.setFillColor(...LIGHT);
    doc.rect(TX, y, TW, 30, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text('Sous-total HT :', TX + 5, y + 8);
    doc.text(`${subtotal.toLocaleString('fr-FR')} FCFA`, TX + TW - 5, y + 8, { align: 'right' });
    doc.text(`TVA (${tvaRate}%) :`, TX + 5, y + 16);
    doc.text(`${tvaAmount.toLocaleString('fr-FR')} FCFA`, TX + TW - 5, y + 16, { align: 'right' });
    doc.setFillColor(...NAVY);
    doc.rect(TX, y + 22, TW, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total TTC :', TX + 5, y + 30);
    doc.text(`${total.toLocaleString('fr-FR')} FCFA`, TX + TW - 5, y + 30, { align: 'right' });
    y += 42;
  } else {
    doc.setFillColor(...NAVY);
    doc.rect(TX, y, TW, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total :', TX + 5, y + 8);
    doc.text(`${total.toLocaleString('fr-FR')} FCFA`, TX + TW - 5, y + 8, { align: 'right' });
    y += 20;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text(`Mode de paiement : ${paymentMethod}`, M, y + 2);
  y += 14;

  const qrText = `FACTURE:${invoiceNumber}|${businessName}|${total}FCFA|${date}`;
  const qrDataUrl = await QRCode.toDataURL(qrText, {
    width: 100,
    margin: 1,
    color: { dark: '#0C182E', light: '#FFFFFF' },
  });
  const QS = 30;
  doc.addImage(qrDataUrl, 'PNG', W - M - QS, y, QS, QS);
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text('Scanner pour vérifier', W - M - QS / 2, y + QS + 4, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Merci pour votre confiance !', M, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.text('Conservez ce document comme preuve d\'achat.', M, y + 16);

  const FY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(M, FY - 5, W - M, FY - 5);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    'Généré par LB Stay Cloud  ·  lbstay.cm  ·  Plateforme SaaS pour entreprises africaines',
    W / 2, FY, { align: 'center' }
  );

  doc.save(`facture-${invoiceNumber}.pdf`);
}

export async function generateStockReportPDF(
  businessName: string,
  products: {
    name: string;
    category: string;
    stock: number;
    minStock: number;
    price: number;
    supplierName?: string | null;
  }[]
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 15;
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  let y = M;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 42, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 40, W, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...GOLD);
  doc.text(businessName.toUpperCase(), M, y + 9);

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('RAPPORT DE STOCK', W - M, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Généré le ${date}`, M, y + 18);
  doc.text(`${products.length} produit(s) répertorié(s)`, W - M, y + 18, { align: 'right' });

  y = 52;

  const critCount = products.filter(p => p.stock === 0).length;
  const lowCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const totalValue = products.reduce((s, p) => s + p.stock * p.price, 0);

  const stats = [
    { label: 'Produits en rupture', value: critCount.toString(), color: [200, 40, 40] as [number, number, number] },
    { label: 'Stock bas', value: lowCount.toString(), color: [180, 120, 0] as [number, number, number] },
    { label: 'Valeur totale stock', value: `${totalValue.toLocaleString('fr-FR')} FCFA`, color: [20, 120, 70] as [number, number, number] },
    { label: 'Total produits', value: products.length.toString(), color: NAVY },
  ];

  const bw = (W - 2 * M - 15) / 4;
  stats.forEach((s, i) => {
    const bx = M + i * (bw + 5);
    doc.setFillColor(...LIGHT);
    doc.roundedRect(bx, y, bw, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(s.label, bx + 4, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...s.color);
    doc.text(s.value, bx + 4, y + 11.5);
  });

  y += 22;

  autoTable(doc, {
    startY: y,
    head: [['Produit', 'Catégorie', 'Fournisseur', 'Stock', 'Min.', 'Statut', 'Prix unitaire', 'Valeur stock']],
    body: products.map(p => {
      const status = p.stock === 0 ? 'RUPTURE' : p.stock <= p.minStock ? 'STOCK BAS' : 'OK';
      return [
        p.name, p.category, p.supplierName ?? '—',
        p.stock, p.minStock, status,
        `${p.price.toLocaleString('fr-FR')} FCFA`,
        `${(p.stock * p.price).toLocaleString('fr-FR')} FCFA`,
      ];
    }),
    margin: { left: M, right: M },
    headStyles: { fillColor: NAVY, textColor: GOLD, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: LIGHT },
    willDrawCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const v = String(data.cell.raw);
        if (v === 'RUPTURE') data.cell.styles.textColor = [210, 40, 40];
        else if (v === 'STOCK BAS') data.cell.styles.textColor = [180, 120, 0];
        else data.cell.styles.textColor = [20, 140, 80];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 26, halign: 'center' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const FY = doc.internal.pageSize.getHeight() - 10;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(M, FY - 4, W - M, FY - 4);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Généré par LB Stay Cloud  ·  lbstay.cm', W / 2, FY, { align: 'center' });

  doc.save(`rapport-stock-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function generateInvoiceNumber(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const r = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `LB-${d}-${r}`;
}
