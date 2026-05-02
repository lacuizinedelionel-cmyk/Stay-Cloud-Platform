import * as XLSX from 'xlsx';

export interface PaymentRow {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference?: string | null;
  createdAt: string;
}

export interface DailyRow {
  date: string;
  revenue: number;
}

export interface PayStats {
  totalRevenue: number;
  cash: number;
  mtnMobileMoney: number;
  orangeMoney: number;
  card: number;
  cashPercent: number;
  mtnPercent: number;
  orangePercent: number;
  cardPercent: number;
}

const METHOD_LABELS: Record<string, string> = {
  CASH:             'Espèces / Cash',
  MTN_MOBILE_MONEY: 'MTN MoMo',
  ORANGE_MONEY:     'Orange Money',
  CARD:             'Carte / Card',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Complété',
  PENDING:   'En attente',
  CANCELLED: 'Annulé',
};

function fmtDate(iso: string, lang: 'fr' | 'en' = 'fr') {
  return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function applyHeaderStyle(ws: XLSX.WorkSheet, range: string) {
  const ref = XLSX.utils.decode_range(range);
  for (let C = ref.s.c; C <= ref.e.c; C++) {
    const cell = XLSX.utils.encode_cell({ r: ref.s.r, c: C });
    if (!ws[cell]) continue;
    ws[cell].s = {
      font:    { bold: true, color: { rgb: 'FFFFFF' } },
      fill:    { patternType: 'solid', fgColor: { rgb: '1A2341' } },
      border:  { bottom: { style: 'thin', color: { rgb: 'F5A623' } } },
      alignment: { horizontal: 'center' },
    };
  }
}

export function exportAnalyticsToExcel(opts: {
  businessName: string;
  payments:     PaymentRow[];
  dailyChart:   DailyRow[];
  payStats:     PayStats | null;
  lang?:        'fr' | 'en';
}) {
  const { businessName, payments, dailyChart, payStats, lang = 'fr' } = opts;
  const wb = XLSX.utils.book_new();
  const now = new Date().toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB');

  /* ── Sheet 1 : Résumé / Summary ── */
  const isFr = lang === 'fr';
  const summaryData = [
    [isFr ? 'Rapport généré le' : 'Report generated on', now],
    [isFr ? 'Enseigne' : 'Business', businessName],
    [],
    [isFr ? 'RÉSUMÉ FINANCIER' : 'FINANCIAL SUMMARY'],
    [isFr ? 'Revenu total' : 'Total revenue', payStats?.totalRevenue ?? 0, 'FCFA'],
    [isFr ? 'Espèces / Cash' : 'Cash', payStats?.cash ?? 0, 'FCFA', `${payStats?.cashPercent?.toFixed(1) ?? 0}%`],
    ['MTN MoMo', payStats?.mtnMobileMoney ?? 0, 'FCFA', `${payStats?.mtnPercent?.toFixed(1) ?? 0}%`],
    ['Orange Money', payStats?.orangeMoney ?? 0, 'FCFA', `${payStats?.orangePercent?.toFixed(1) ?? 0}%`],
    [isFr ? 'Carte bancaire' : 'Card', payStats?.card ?? 0, 'FCFA', `${payStats?.cardPercent?.toFixed(1) ?? 0}%`],
    [],
    [isFr ? 'Nombre de transactions' : 'Number of transactions', payments.length],
    [isFr ? 'Transactions complétées' : 'Completed transactions', payments.filter(p => p.status === 'COMPLETED').length],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws1, isFr ? 'Résumé' : 'Summary');

  /* ── Sheet 2 : Transactions ── */
  const txHeaders = isFr
    ? ['ID', 'Date', 'Mode de paiement', 'Montant (FCFA)', 'Statut', 'Référence']
    : ['ID', 'Date', 'Payment method', 'Amount (XAF)', 'Status', 'Reference'];

  const txRows = payments.map(p => [
    p.id,
    fmtDate(p.createdAt, lang),
    METHOD_LABELS[p.method] ?? p.method,
    p.amount,
    (isFr ? STATUS_LABELS[p.status] : p.status) ?? p.status,
    p.reference ?? '',
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  ws2['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 18 }];
  applyHeaderStyle(ws2, `A1:F1`);
  XLSX.utils.book_append_sheet(wb, ws2, isFr ? 'Transactions' : 'Transactions');

  /* ── Sheet 3 : Évolution CA / Revenue Trend ── */
  const caHeaders = isFr
    ? ['Date', 'Chiffre d\'affaires (FCFA)']
    : ['Date', 'Revenue (XAF)'];

  const caRows = dailyChart.map(d => [d.date, d.revenue]);
  const ws3 = XLSX.utils.aoa_to_sheet([caHeaders, ...caRows]);
  ws3['!cols'] = [{ wch: 14 }, { wch: 24 }];
  applyHeaderStyle(ws3, `A1:B1`);
  XLSX.utils.book_append_sheet(wb, ws3, isFr ? 'Évolution CA' : 'Revenue trend');

  /* ── Téléchargement ── */
  const datePart = new Date().toISOString().slice(0, 10);
  const filename  = `${businessName.replace(/\s+/g, '_')}_rapport_${datePart}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportTransactionsToCsv(opts: {
  businessName: string;
  payments:     PaymentRow[];
  lang?:        'fr' | 'en';
}) {
  const { businessName, payments, lang = 'fr' } = opts;
  const isFr = lang === 'fr';

  const headers = isFr
    ? ['ID', 'Date', 'Mode de paiement', 'Montant (FCFA)', 'Statut', 'Référence']
    : ['ID', 'Date', 'Payment method', 'Amount (XAF)', 'Status', 'Reference'];

  const rows = payments.map(p => [
    p.id,
    fmtDate(p.createdAt, lang),
    METHOD_LABELS[p.method] ?? p.method,
    p.amount,
    (isFr ? STATUS_LABELS[p.status] : p.status) ?? p.status,
    p.reference ?? '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${businessName.replace(/\s+/g, '_')}_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
