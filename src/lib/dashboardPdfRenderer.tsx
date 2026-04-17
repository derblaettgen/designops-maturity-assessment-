import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import type { DimensionWithScore } from './scoring';
import type { Costs } from './waste';

// Register Inter font for better typography
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fQSQ.ttf',
});

const styles = StyleSheet.create({
  document: {
    fontSize: 10,
    fontFamily: 'Inter',
  },
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#004C93',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004C93',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004C93',
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 6,
  },
  kpiContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: '23%',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004C93',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 10,
    color: '#666',
    lineHeight: 1.3,
  },
  kpiBadge: {
    fontSize: 8,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  dimensionRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
    alignItems: 'center',
  },
  dimensionLabel: {
    width: '25%',
    fontSize: 10,
    fontWeight: '500',
    color: '#333',
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#004C93',
  },
  dimensionValue: {
    width: '15%',
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#004C93',
  },
  tableContainer: {
    marginBottom: 20,
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#004C93',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#004C93',
    flex: 1,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#333',
  },
  highlightBox: {
    backgroundColor: '#f0f7ff',
    border: '1px solid #004C93',
    padding: 16,
    marginBottom: 20,
    borderRadius: 4,
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004C93',
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 11,
    color: '#666',
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
  },
  pageBreak: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

interface DashboardPdfProps {
  overallScore: number;
  dimensionScores: DimensionWithScore[];
  maturityLevel: string;
  maturityLabel: string;
  marketDelta: number;
  gapToTopPerformer: number;
  gapToMarketAvg: number;
  currentWaste: number;
  annualSaving: number;
  costs: Costs;
  respondentBranch?: string;
  respondentSize?: string;
  respondentRegion?: string;
}

interface KpiCardPdfProps {
  level: string;
  value: string;
  label: string;
  badge?: string;
}

const KpiCardPdf: React.FC<KpiCardPdfProps> = ({ level, value, label, badge }) => {
  const borderColors: Record<string, string> = {
    critical: '#d32f2f',
    low: '#f57c00',
    mid: '#fbc02d',
    good: '#388e3c',
    excellent: '#1976d2',
  };

  const borderColor = borderColors[level] || '#999';

  return (
    <View style={[styles.kpiCard, { borderLeftColor: borderColor }]}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {badge && <Text style={styles.kpiBadge}>{badge}</Text>}
    </View>
  );
};

const DimensionBarPdf: React.FC<{ name: string; score: number }> = ({
  name,
  score,
}) => {
  const percentage = Math.min((score / 5) * 100, 100);

  return (
    <View style={styles.dimensionRow}>
      <Text style={styles.dimensionLabel}>{name}</Text>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.dimensionValue}>{score.toFixed(2)}</Text>
    </View>
  );
};

export const DashboardPdf: React.FC<DashboardPdfProps> = ({
  overallScore,
  dimensionScores,
  maturityLevel,
  maturityLabel,
  marketDelta,
  gapToTopPerformer,
  currentWaste,
  annualSaving,
  respondentBranch,
  respondentSize,
  respondentRegion,
}) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatScore = (score: number) => {
    return score.toFixed(2);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📊 DesignOps Maturity Report</Text>
          <Text style={styles.subtitle}>
            Individuelle Auswertung mit Benchmark-Vergleich (DACH 2026)
          </Text>
          {respondentBranch && (
            <Text style={styles.subtitle}>
              {respondentBranch}
              {respondentSize ? ` • ${respondentSize}` : ''}
              {respondentRegion ? ` • ${respondentRegion}` : ''}
            </Text>
          )}
        </View>

        {/* KPI Cards */}
        <Text style={styles.sectionTitle}>Gesamtüberblick</Text>
        <View style={styles.kpiContainer}>
          <KpiCardPdf
            level={maturityLevel}
            value={formatScore(overallScore)}
            label="Gesamtscore"
          />
          <KpiCardPdf
            level={maturityLevel}
            value={maturityLabel}
            label="Reifegradstufe"
          />
          <KpiCardPdf
            level={marketDelta >= 0 ? 'good' : 'low'}
            value={formatScore(Math.abs(marketDelta))}
            label={marketDelta >= 0 ? 'Über Marktdurchschnitt' : 'Unter Marktdurchschnitt'}
          />
          <KpiCardPdf
            level="critical"
            value={formatScore(gapToTopPerformer)}
            label="Gap zu Top-Performer"
          />
        </View>

        {/* Dimension Scores */}
        <Text style={styles.sectionTitle}>Dimensionen im Detail</Text>
        {dimensionScores.map(dim => (
          <DimensionBarPdf key={dim.key} name={dim.name} score={dim.score} />
        ))}

        {/* Waste & ROI Section */}
        <View style={styles.pageBreak} />

        <Text style={styles.sectionTitle}>💰 Kosteneinsparung & ROI</Text>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightValue}>
            {formatNumber(annualSaving)}
          </Text>
          <Text style={styles.highlightLabel}>
            Jährliches Einsparpotenzial bei Optimierung zur Reifegradstufe 4.0
          </Text>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
              Metrik
            </Text>
            <Text style={styles.tableHeaderCell}>Aktuell</Text>
            <Text style={styles.tableHeaderCell}>Zielzustand</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.2, fontWeight: 'bold' }]}>
              Jährliche Kosten (Waste)
            </Text>
            <Text style={styles.tableCell}>
              {formatNumber(currentWaste)}
            </Text>
            <Text style={styles.tableCell}>
              {formatNumber(currentWaste - annualSaving)}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.2, fontWeight: 'bold' }]}>
              Einsparung / Jahr
            </Text>
            <Text style={styles.tableCell}>—</Text>
            <Text style={styles.tableCell}>
              {formatNumber(annualSaving)}
            </Text>
          </View>
        </View>

        {/* Respondent Info */}
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>Ihr Profil</Text>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>
              Branch:
            </Text>
            <Text style={styles.tableCell}>
              {respondentBranch || '—'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>
              Organisationsgröße:
            </Text>
            <Text style={styles.tableCell}>
              {respondentSize || '—'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>
              Region:
            </Text>
            <Text style={styles.tableCell}>
              {respondentRegion || '—'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            DesignOps Maturity Survey 2026 • Erstellt am{' '}
            {new Date().toLocaleDateString('de-DE')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

interface DashboardPdfDownloadProps extends DashboardPdfProps {
  filename?: string;
}

export const DashboardPdfDownload: React.FC<DashboardPdfDownloadProps> = (
  props
) => {
  const filename = props.filename || `DesignOps-Report-${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={<DashboardPdf {...props} />}
      fileName={filename}
      style={{
        padding: '10px 20px',
        backgroundColor: '#004C93',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        fontSize: '14px',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {({ loading }) =>
        loading ? '⏳ PDF wird erstellt...' : '📥 PDF herunterladen'
      }
    </PDFDownloadLink>
  );
};
