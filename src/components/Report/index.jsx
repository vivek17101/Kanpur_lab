import {
  PDFViewer,
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import { LabContext } from "../../context/LabContext";
export default function Report() {
  const { sampleDetails, selectedTests } = useContext(LabContext);

  Font.register({
    family: "Ubuntu",
    src: "https://fonts.gstatic.com/s/ubuntu/v20/4iCs6KVjbNBYlgoKcg72nU6AF7xm.woff2",
  });

  Font.register({
    family: "Roboto",
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
    viewer: {
      width: "100%",
      height:
        window.innerHeight -
        (document.getElementById("header").offsetHeight +
          document.getElementById("footer").offsetHeight +
          100),
    },
    page: {
      padding: "20px 28px",
      fontFamily: "Ubuntu",
    },
    titleContainer: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
      textAlign: "center",
    },
    sampleDetails: {
      fontSize: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 20,
    },
    report: {
      marginTop: 20,
      borderTop: "1px solid black",
      borderLeft: "1px solid black",
      borderRight: "1px solid black",
    },
    row: {
      flexDirection: "row",
      borderBottom: "1px solid black",
    },
    testNameCol: {
      flexGrow: 1,
      width: 100 % -250,
      fontSize: 16,
      padding: "8px",
    },
    ValueCol: {
      minWidth: 100,
      width: 100,
      flexShrink: 0,
      borderLeft: "1px solid black",
      borderRight: "1px solid black",
      fontSize: 16,
      padding: "8px",
    },
    normalValue: {
      minWidth: 150,
      width: 150,
      flexShrink: 0,
      fontSize: 16,
      padding: "8px",
    },
  });

  return (
    <PDFViewer style={styles.viewer}>
      <Document
        title={`${sampleDetails.name.split(" ").join("")}_${
          sampleDetails.dateOfTest
        }`}
      >
        <Page size="A4" style={styles.page}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Laboratory Name</Text>
          </View>
          <View style={styles.sampleDetails}>
            <View>
              <Text>Name: {sampleDetails.name}</Text>
              <Text style={styles["mt-1"]}>
                Date of Test: {sampleDetails.dateOfTest}
              </Text>
            </View>
            <View>
              <Text>Sex/ Age: {sampleDetails.sexAndAge}</Text>
              <Text style={styles["mt-1"]}>
                reference: {sampleDetails.reference}
              </Text>
            </View>
          </View>
          <View style={styles.report}>
            <View style={styles.row}>
              <View style={styles.testNameCol}>
                <Text>Test</Text>
              </View>
              <View style={styles.ValueCol}>
                <Text>Value</Text>
              </View>
              <View style={styles.normalValue}>
                <Text>Normal Values</Text>
              </View>
            </View>
            {selectedTests.map((test) => (
              <View style={styles.row} key={uuidv4()}>
                <View style={styles.testNameCol}>
                  <Text>{test.name}</Text>
                </View>
                <View style={styles.ValueCol}>
                  <Text>{`${test.value} ${test.unit}`}</Text>
                </View>
                <View style={styles.normalValue}>
                  {Array.isArray(test.referenceValue) ? (
                    test.referenceValue.map((test) => <Text>{test}</Text>)
                  ) : (
                    <Text>{test.referenceValue}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
}
