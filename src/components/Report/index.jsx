import {
  PDFViewer,
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { useContext, useMemo } from "react";
import { LabContext } from "../../context/LabContext";
import labData from "../../data/labTests";

Font.register({
  family: "Ubuntu",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/ubuntu/v20/4iCs6KVjbNBYlgoKcg72nU6AF7xm.woff2",
      fontStyle: "normal",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/ubuntu/v20/4iCv6KVjbNBYlgoCxCvjvWyNPYZvg7UI.woff2",
      fontStyle: "normal",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: "18px 24px",
    fontFamily: "Ubuntu",
    fontSize: 11,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  topText: {
    fontSize: 11,
    fontWeight: 700,
  },
  phoneBlock: {
    textAlign: "right",
    fontSize: 10,
    lineHeight: 1.3,
    fontWeight: 700,
  },
  brandBox: {
    border: "2px solid #c01717",
    backgroundColor: "#c01717",
    marginTop: 4,
    marginBottom: 6,
    paddingVertical: 3,
  },
  brandText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 1,
  },
  consultant: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 2,
  },
  address: {
    textAlign: "center",
    color: "#b12a2a",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 12,
  },
  dottedLineRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    marginRight: 4,
  },
  fillLine: {
    borderBottom: "1px dotted #000",
    minHeight: 16,
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  fillText: {
    fontSize: 11,
    paddingHorizontal: 2,
  },
  splitGap: {
    width: 12,
  },
  table: {
    border: "1px solid #000",
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
  },
  noBottomBorder: {
    borderBottom: 0,
  },
  col: {
    padding: 6,
    justifyContent: "center",
  },
  colWithBorder: {
    borderLeft: "1px solid #000",
  },
  colTitle: {
    fontWeight: 700,
    fontSize: 11,
  },
  colSubTitle: {
    fontSize: 10,
    color: "#b12a2a",
    fontWeight: 700,
  },
  testsBlock: {
    marginTop: 4,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 7,
  },
  testName: {
    width: "49%",
    fontSize: 11,
  },
  testValueLine: {
    borderBottom: "1px dotted #000",
    minHeight: 14,
    width: "51%",
    justifyContent: "flex-end",
    paddingBottom: 1,
  },
  noteBox: {
    marginTop: 12,
    backgroundColor: "#b31212",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  noteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
  },
  footerRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  hindiText: {
    width: "72%",
    fontSize: 12,
    fontWeight: 700,
  },
  chemistText: {
    fontSize: 16,
    fontWeight: 700,
  },
});

function LineField({ label, value, width = "100%" }) {
  return (
    <View style={[styles.dottedLineRow, { width }]}> 
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.fillLine, { flexGrow: 1 }]}> 
        <Text style={styles.fillText}>{value || ""}</Text>
      </View>
    </View>
  );
}

export default function Report() {
  const { sampleDetails, selectedTests } = useContext(LabContext);

  const headerHeight = document.getElementById("header")?.offsetHeight || 0;
  const footerHeight = document.getElementById("footer")?.offsetHeight || 0;
  const viewerHeight = Math.max(window.innerHeight - (headerHeight + footerHeight + 100), 320);

  const selectedByName = useMemo(() => {
    const map = {};
    selectedTests.forEach((item) => {
      map[item.name] = item;
    });
    return map;
  }, [selectedTests]);

  const testsForReport = useMemo(
    () =>
      labData.map((test) => ({
        ...test,
        value: selectedByName[test.name]?.value || "",
        unit: selectedByName[test.name]?.unit || test.unit || "",
      })),
    [selectedByName]
  );

  return (
    <PDFViewer style={{ width: "100%", height: viewerHeight, border: "none" }}>
      <Document
        title={`${(sampleDetails.name || "Report").split(" ").join("")}_${
          sampleDetails.dateOfTest
        }`}
      >
        <Page size="A4" style={styles.page}>
          <View style={styles.topRow}>
            <Text style={styles.topText}>Test Report</Text>
            <Text style={styles.phoneBlock}>M. 94161-37706{"\n"}M. 79881-87028{"\n"}M. 93063-59224</Text>
          </View>

          <View style={styles.brandBox}>
            <Text style={styles.brandText}>KANPUR LABORATORY</Text>
          </View>
          <Text style={styles.consultant}>CONSULTANT & ANALYST</Text>
          <Text style={styles.address}>Gali No. 19, Peoda Road, Bypass, KAITHAL-136027 (Hry)</Text>

          <LineField label="Supplied by M/s." value={sampleDetails.name} />

          <View style={styles.dottedLineRow}>
            <LineField label="C/o." value={sampleDetails.CO} width="52%" />
            <View style={styles.splitGap} />
            <LineField label="Nature of Sample" value={sampleDetails.reference} width="46%" />
          </View>

          <LineField label="To M/s." value={sampleDetails.name} />

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.col, { width: "34%" }]}>
                <Text style={styles.colTitle}>Result of Analysis</Text>
              </View>
              <View style={[styles.col, styles.colWithBorder, { width: "33%" }]}>
                <Text style={[styles.colTitle, { textAlign: "center", color: "#b12a2a" }]}>AS IT IS</Text>
              </View>
              <View style={[styles.col, styles.colWithBorder, { width: "33%" }]}>
                <Text style={[styles.colSubTitle, { textAlign: "center" }]}>Sample Not Drawn By Kanpur Laboratory</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={[styles.col, { width: "34%" }]}>
                <Text>Code No./S.No..........................</Text>
              </View>
              <View style={[styles.col, styles.colWithBorder, { width: "33%" }]}>
                <Text>Date of Seal..........................</Text>
              </View>
              <View style={[styles.col, styles.colWithBorder, { width: "33%" }]}>
                <Text>Received on ..........................</Text>
              </View>
            </View>

            <View style={[styles.tableRow, styles.noBottomBorder]}>
              <View style={[styles.col, { width: "34%" }]}>
                <Text>Lorry No. ..........................</Text>
              </View>
              <View style={[styles.col, styles.colWithBorder, { width: "33%" }]}>
                <Text>Bags ............ Wt. ............</Text>
              </View>
              <View style={[styles.col, styles.colWithBorder, { width: "33%" }]}>
                <Text>Con. of Sample ............</Text>
              </View>
            </View>
          </View>

          <View style={styles.testsBlock}>
            {testsForReport.map((test) => (
              <View style={styles.testRow} key={test.id}>
                <Text style={styles.testName}>{test.name}</Text>
                <View style={styles.testValueLine}>
                  <Text style={styles.fillText}>{test.value ? `${test.value}${test.unit ? ` ${test.unit}` : ""}` : ""}</Text>
                </View>
              </View>
            ))}
            <View style={styles.testRow}>
              <Text style={styles.testName}>Opinion</Text>
              <View style={styles.testValueLine} />
            </View>
            <View style={styles.testRow}>
              <Text style={styles.testName}>Fee Charged Rs.</Text>
              <View style={styles.testValueLine} />
            </View>
          </View>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Note :- Sample will be Re-analysed only with in TEN Days after that SAMPLE WILL be destroyed.
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.hindiText}>Any unfairly earned money may support our work, but facing its consequences remains inevitable.</Text>
            <Text style={styles.chemistText}>CHEMIST</Text>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
}
