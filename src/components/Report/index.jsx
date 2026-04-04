import {
  PDFViewer,
  Page,
  Text,
  View,
  Document,
  StyleSheet,
} from "@react-pdf/renderer";
import { useContext, useMemo, useState, useEffect } from "react";
import { LabContext } from "../../context/LabContext";
import labData from "../../data/labTests";

const RED    = "#CC0000";
const DKRED  = "#990000";
const LGRAY  = "#F5F5F5";
const ROWALT = "#FAFAFA";

const styles = StyleSheet.create({
  page: { padding: "10px 12px", fontFamily: "Helvetica", fontSize: 10 },

  outerBorder: { border: "2px solid #000", padding: "6px 8px" },
  innerBorder: { border: "0.5px solid #000", padding: "6px 8px" },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
  testReportTitle: { fontSize: 13, fontWeight: "bold", fontStyle: "italic" },
  phoneBlock: { textAlign: "right", fontSize: 8, fontWeight: "bold", lineHeight: 1.5 },

  brandBox: { backgroundColor: RED, paddingVertical: 4, marginBottom: 5, marginTop: 2 },
  brandText: { color: "#fff", textAlign: "center", fontSize: 22, fontWeight: "bold", letterSpacing: 1 },

  consultantRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 },
  consultantText: { fontSize: 11, fontWeight: "bold" },
  datedRow: { flexDirection: "row", alignItems: "baseline" },
  datedLabel: { fontSize: 9, fontWeight: "bold", marginRight: 3 },
  datedValue: { fontSize: 9, borderBottom: "1px dotted #CCCCCC", minWidth: 70, paddingBottom: 1 },

  address: { textAlign: "center", color: RED, fontSize: 9, fontWeight: "bold", marginBottom: 8 },

  fieldRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6 },
  fieldLabel: { fontSize: 9.5, fontWeight: "bold", marginRight: 3 },
  fieldValueLine: { borderBottom: "1px dotted #CCCCCC", flexGrow: 1, minHeight: 13, justifyContent: "flex-end", paddingBottom: 1 },
  fieldValue: { fontSize: 9.5, fontWeight: "bold", color: DKRED },
  splitGap: { width: 8 },

  table: { border: "0.8px solid #000", marginTop: 6, marginBottom: 2 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: LGRAY, borderBottom: "0.5px solid #000" },
  tableSubRow: { flexDirection: "row", backgroundColor: LGRAY, borderBottom: "0.5px solid #000" },
  col0: { width: "34%", padding: "4px 5px" },
  col1: { width: "33%", padding: "4px 5px", borderLeft: "0.5px solid #000" },
  col2: { width: "33%", padding: "4px 5px", borderLeft: "0.5px solid #000" },
  colTitle:    { fontWeight: "bold", fontSize: 9 },
  colTitleRed: { fontWeight: "bold", fontSize: 9, color: RED, textAlign: "center" },
  colSubTitle: { fontWeight: "bold", fontSize: 7.5, color: RED, textAlign: "center" },
  subText:     { fontSize: 8 },

  testRow: { flexDirection: "row", alignItems: "flex-end", borderBottom: "0.3px solid #CCCCCC", paddingVertical: 3, paddingHorizontal: 4 },
  testRowAlt: { backgroundColor: ROWALT },
  testName: { width: "49%", fontSize: 9 },
  testValueLine: { borderBottom: "1px dotted #CCCCCC", width: "51%", minHeight: 13, justifyContent: "flex-end", paddingBottom: 1 },
  testValue: { fontSize: 9, fontWeight: "bold", color: RED },

  stampWrap: { alignItems: "center", marginVertical: 6 },
  stampOuter: { width: 56, height: 56, borderRadius: 28, border: "1.5px solid #888", alignItems: "center", justifyContent: "center" },
  stampInner: { width: 46, height: 46, borderRadius: 23, border: "0.8px solid #888", alignItems: "center", justifyContent: "center" },
  stampText:  { fontSize: 8, fontWeight: "bold", color: "#555", textAlign: "center" },

  noteBox:  { backgroundColor: RED, paddingVertical: 3, paddingHorizontal: 5, marginTop: 4 },
  noteText: { color: "#fff", fontSize: 7.5, fontWeight: "bold", textAlign: "center" },

  footerRow:   { marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  hindiText:   { fontSize: 9, fontStyle: "italic", width: "72%" },
  chemistText: { fontSize: 10, fontWeight: "bold" },
});

function DotField({ label, value, width, grow = true }) {
  return (
    <View style={[styles.fieldRow, width ? { width } : {}]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldValueLine, !grow && { flexGrow: 0, flexShrink: 1, flexBasis: "auto", minWidth: 40 }]}>
        <Text style={styles.fieldValue}>{value || ""}</Text>
      </View>
    </View>
  );
}

export default function Report() {
  const { sampleDetails, selectedTests } = useContext(LabContext);
  const [viewerHeight, setViewerHeight] = useState(500);

  useEffect(() => {
    const header = document.getElementById("header");
    const footer = document.getElementById("footer");
    const used = (header?.offsetHeight || 0) + (footer?.offsetHeight || 0) + 100;
    setViewerHeight(Math.max(window.innerHeight - used, 320));
  }, []);

  const selectedByName = useMemo(() => {
    const map = {};
    selectedTests.forEach((item) => { map[item.name] = item; });
    return map;
  }, [selectedTests]);

  const testsForReport = useMemo(
    () => labData.map((test) => ({
      ...test,
      value: selectedByName[test.name]?.value || "",
      unit: selectedByName[test.name]?.unit || test.unit || "",
    })),
    [selectedByName]
  );

  const allRows = [
    ...testsForReport,
    { id: "opinion", name: "Opinion",         value: "", unit: "" },
    { id: "fee",     name: "Fee Charged Rs.", value: "", unit: "" },
  ];

  return (
    <PDFViewer style={{ width: "100%", height: viewerHeight, border: "none" }}>
      <Document title={`${(sampleDetails.name || "Report").split(" ").join("")}_${sampleDetails.dateOfTest}`}>
        <Page size="A4" style={styles.page}>
          <View style={styles.outerBorder}>
            <View style={styles.innerBorder}>

              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.testReportTitle}>Test Report</Text>
                <Text style={styles.phoneBlock}>{"M. 94161-37706\nM. 79881-87028\nM. 93063-59224"}</Text>
              </View>

              {/* Red banner */}
              <View style={styles.brandBox}>
                <Text style={styles.brandText}>KANPUR LABORATORY</Text>
              </View>

              {/* Consultant + Dated */}
              <View style={styles.consultantRow}>
                <Text style={styles.consultantText}>CONSULTANT &amp; ANALYST</Text>
                <View style={styles.datedRow}>
                  <Text style={styles.datedLabel}>Dated</Text>
                  <Text style={styles.datedValue}>{sampleDetails.dated || ""}</Text>
                </View>
              </View>

              {/* Address */}
              <Text style={styles.address}>
                Gali No. 19, Peoda Road, Byepass, KAITHAL-136027 (Hry)
              </Text>

              {/* Field rows */}
              <DotField label="Supplied by M/s." value={sampleDetails.name} />
              <View style={styles.fieldRow}>
                <DotField label="C/o." value={sampleDetails.CO} width="52%" grow={false} />
                <View style={styles.splitGap} />
                <DotField label="Nature of Sample:" value={sampleDetails.reference} width="46%" grow={false} />
              </View>
              <DotField label="To M/s." value={sampleDetails.toMs} />

              {/* Table */}
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <View style={styles.col0}><Text style={styles.colTitle}>Result of Analysis</Text></View>
                  <View style={styles.col1}><Text style={styles.colTitleRed}>AS IT IS</Text></View>
                  <View style={styles.col2}><Text style={styles.colSubTitle}>Sample Not Drawn By Kanpur Laboratory</Text></View>
                </View>
                <View style={styles.tableSubRow}>
                  <View style={styles.col0}><Text style={styles.subText}>Code No./S.No..........................</Text></View>
                  <View style={styles.col1}><Text style={styles.subText}>Date of Seal..........................</Text></View>
                  <View style={styles.col2}><Text style={styles.subText}>Received on ..........................</Text></View>
                </View>
                <View style={[styles.tableSubRow, { borderBottom: 0 }]}>
                  <View style={styles.col0}><Text style={styles.subText}>Lorry No. ..........................</Text></View>
                  <View style={styles.col1}><Text style={styles.subText}>Bags ............ Wt. ............</Text></View>
                  <View style={styles.col2}><Text style={styles.subText}>Con. of Sample ............</Text></View>
                </View>
              </View>

              {/* Test rows */}
              {allRows.map((test, i) => (
                <View key={test.id} style={[styles.testRow, i % 2 === 0 ? styles.testRowAlt : {}]}>
                  <Text style={styles.testName}>{test.name}</Text>
                  <View style={styles.testValueLine}>
                    <Text style={styles.testValue}>
                      {test.value ? `${test.value}${test.unit ? ` ${test.unit}` : ""}` : ""}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Stamp */}
              <View style={styles.stampWrap}>
                <View style={styles.stampOuter}>
                  <View style={styles.stampInner}>
                    <Text style={styles.stampText}>{"KANPUR\nLAB"}</Text>
                  </View>
                </View>
              </View>

              {/* Note bar */}
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>
                  Note :- Sample will be Re-analysed only with in TEN Days after that SAMPLE WILL be destroyed.
                </Text>
              </View>

              {/* Footer */}
              <View style={styles.footerRow}>
                <Text style={styles.hindiText}>
                  {"Unfairly earned money may support our work,\nbut its consequences must still be faced."}
                </Text>
                <Text style={styles.chemistText}>CHEMIST</Text>
              </View>

            </View>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
}
