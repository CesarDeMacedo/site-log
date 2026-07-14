import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { RFI_STATUS_LABELS, rfiDisplayStatus, type RfiDisplayStatus } from "@/lib/rfi-logic";
import { REPORT_STATUS_ORDER, rfiStatusBreakdown } from "@/lib/report-logic";
import type { Project, Rfi } from "@/lib/types";

// Client-facing document: light background with the app's blueprint accent.
const BLUEPRINT = "#2E6F9E";
const BLUEPRINT_BRIGHT = "#4FA6D8";
const TEXT = "#1C2733";
const MUTED = "#5C6B7A";
const LINE = "#D8DFE6";
const ZEBRA = "#F4F7FA";

const STATUS_COLOR: Record<RfiDisplayStatus, string> = {
  open: BLUEPRINT,
  in_review: "#B47A1E",
  overdue: "#C74E2F",
  answered: "#3A8A61",
  closed: MUTED,
};

function statusLabel(status: RfiDisplayStatus): string {
  return status === "overdue" ? "Overdue" : RFI_STATUS_LABELS[status];
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: TEXT,
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 44,
  },
  kicker: {
    fontSize: 7.5,
    letterSpacing: 1.5,
    color: BLUEPRINT,
    marginBottom: 4,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: BLUEPRINT_BRIGHT,
    paddingBottom: 10,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  projectName: { fontSize: 17, fontFamily: "Helvetica-Bold" },
  headerMeta: { fontSize: 8, color: MUTED, marginTop: 3 },
  generated: { fontSize: 8, color: MUTED, textAlign: "right" },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statBox: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderLeftWidth: 3,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  statLabel: { fontSize: 7, letterSpacing: 0.8, color: MUTED, marginBottom: 3 },
  statValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: TEXT,
    paddingBottom: 4,
    marginBottom: 1,
  },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.8, color: MUTED },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: LINE,
    paddingVertical: 5,
    alignItems: "flex-start",
  },
  mono: { fontFamily: "Courier", fontSize: 8 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
  },
  colNumber: { width: 58 },
  colSubject: { flex: 1, paddingRight: 8 },
  colContractor: { width: 90, paddingRight: 6 },
  colStatus: { width: 62 },
  colCreated: { width: 62 },
  colLink: { width: 78 },
});

function LinkCell({ href }: { href: string | null }) {
  if (!href) return <Text style={{ color: MUTED }}>—</Text>;
  return (
    <Link src={href} style={{ color: BLUEPRINT, textDecoration: "underline" }}>
      View link
    </Link>
  );
}

export function RfiReportDocument({
  project,
  rfis,
  today,
}: {
  project: Project;
  rfis: Rfi[];
  today: string;
}) {
  const breakdown = rfiStatusBreakdown(rfis, today);
  const closedCount = breakdown.answered + breakdown.closed;
  const openCount = rfis.length - closedCount;

  return (
    <Document
      title={`${project.name} — RFI Report`}
      author="RFI Log"
      creator="RFI Log — Construction Administration Tracker"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.kicker}>RFI LOG · CONSTRUCTION ADMINISTRATION</Text>
            <Text style={styles.projectName}>{project.name}</Text>
            <Text style={styles.headerMeta}>
              {[
                project.general_contractor &&
                  `General Contractor: ${project.general_contractor}`,
                project.pm_name && `PM: ${project.pm_name}`,
              ]
                .filter(Boolean)
                .join("   ·   ") || " "}
            </Text>
          </View>
          <View>
            <Text style={styles.generated}>RFI REPORT</Text>
            <Text style={styles.generated}>Generated {today}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.statBox, { borderLeftColor: TEXT }]}>
            <Text style={styles.statLabel}>TOTAL RFIS</Text>
            <Text style={styles.statValue}>{rfis.length}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: BLUEPRINT_BRIGHT }]}>
            <Text style={styles.statLabel}>OPEN (ALL)</Text>
            <Text style={styles.statValue}>{openCount}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: "#3A8A61" }]}>
            <Text style={styles.statLabel}>CLOSED / ANSWERED</Text>
            <Text style={styles.statValue}>{closedCount}</Text>
          </View>
          {REPORT_STATUS_ORDER.map((status) => (
            <View
              key={status}
              style={[styles.statBox, { borderLeftColor: STATUS_COLOR[status] }]}
            >
              <Text style={styles.statLabel}>{statusLabel(status).toUpperCase()}</Text>
              <Text style={[styles.statValue, { color: STATUS_COLOR[status] }]}>
                {breakdown[status]}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.tableHeader} fixed>
          <Text style={[styles.th, styles.colNumber]}>NUMBER</Text>
          <Text style={[styles.th, styles.colSubject]}>SUBJECT</Text>
          <Text style={[styles.th, styles.colContractor]}>CONTRACTOR</Text>
          <Text style={[styles.th, styles.colStatus]}>STATUS</Text>
          <Text style={[styles.th, styles.colCreated]}>CREATED</Text>
          <Text style={[styles.th, styles.colLink]}>DESIGN PACKAGE</Text>
          <Text style={[styles.th, styles.colLink]}>BLUE BIN SECTION</Text>
        </View>

        {rfis.length === 0 && (
          <View style={styles.row}>
            <Text style={{ color: MUTED }}>No RFIs recorded for this project.</Text>
          </View>
        )}
        {rfis.map((rfi, i) => {
          const display = rfiDisplayStatus(rfi, today);
          return (
            <View
              key={rfi.id}
              style={[styles.row, ...(i % 2 === 1 ? [{ backgroundColor: ZEBRA }] : [])]}
              wrap={false}
            >
              <Text style={[styles.mono, styles.colNumber, { color: BLUEPRINT }]}>
                {rfi.rfi_number}
              </Text>
              <Text style={styles.colSubject}>{rfi.description}</Text>
              <Text style={[styles.colContractor, { color: MUTED }]}>
                {rfi.contractor ?? "—"}
              </Text>
              <Text
                style={[
                  styles.colStatus,
                  { color: STATUS_COLOR[display], fontFamily: "Helvetica-Bold" },
                ]}
              >
                {statusLabel(display).toUpperCase()}
              </Text>
              <Text style={[styles.mono, styles.colCreated, { color: MUTED }]}>
                {rfi.created_at.slice(0, 10)}
              </Text>
              <View style={styles.colLink}>
                <LinkCell href={rfi.link_design_package} />
              </View>
              <View style={styles.colLink}>
                <LinkCell href={rfi.link_blue_bin_section} />
              </View>
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>RFI LOG · CONSTRUCTION ADMINISTRATION TRACKER</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
