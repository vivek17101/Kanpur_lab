/**
 * Report/index.jsx — html2canvas + jsPDF  (v4 — PNG symbols)
 *
 * CHANGES FROM v3:
 * ─────────────────────────────────────────────────────────────────────
 * [SYMBOLS] Removed hand-drawn SWASTIK_SVG / OM_SVG base64 constants
 * [SYMBOLS] Now imports Swastika_Symbol.png + OM_Symbol.png via bundler
 * [SYMBOLS] Both converted to base64 on mount via loadImageAsBase64()
 * [SYMBOLS] swastikSrc / omSrc threaded as props through all render paths
 * ─────────────────────────────────────────────────────────────────────
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import labData from "../../data/labTests";

// ── Import assets via bundler ─────────────────────────────────────────────────
import kanpurLabLogo from "../../assets/kanpur_lab_logo.png";
import swastikPng    from "../../assets/Swastika_Symbol.png";
import omPng         from "../../assets/OM_Symbol.png";

// ─── Constants ────────────────────────────────────────────────────────────────
const RED   = "#CC0000";
const DKRED = "#990000";

// ─── Base64 loader ────────────────────────────────────────────────────────────
async function loadImageAsBase64(src) {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN");
}

export function getReportDataFromSample(sample, fallbackTests = []) {
  if (!sample) return null;
  return {
    reportNumber:      sample.reportNumber      || "",
    supplierName:      sample.supplierName      || "",
    CO:                sample.CO                || "",
    toMs:              sample.toMs              || "",
    dated:             formatDate(sample.dateOfTest || sample.updatedAt || sample.createdAt),
    dateOfSeal:        formatDate(sample.dateOfSeal),
    dateReceived:      formatDate(sample.dateReceived),
    sampleReference:   sample.sampleReference   || "",
    lorryNo:           sample.lorryNo           || "",
    bags:              sample.bags              || "",
    weight:            sample.weight            || "",
    conditionOfSample: sample.conditionOfSample || "",
    tests:             Array.isArray(sample.tests) ? sample.tests : fallbackTests,
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    width: "794px",
    minHeight: "1083px",
    backgroundColor: "#fff",
    fontFamily: "'Noto Sans', 'Mangal', Arial, sans-serif",
    fontSize: "10px",
    padding: "14px 16px",
    boxSizing: "border-box",
  },
  outerBorder: {
    border: "2.5px solid #000",
    padding: "0",
    boxSizing: "border-box",
    position: "relative",
  },
  innerBorder: {
    border: "1px solid #000",
    margin: "4px",
    padding: "8px 10px",
    position: "relative",
    boxSizing: "border-box",
  },

  watermark: {
    position: "absolute",
    top: "70%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 0.15,
    textAlign: "center",
    pointerEvents: "none",
    zIndex: 0,
    userSelect: "none",
  },

  // ── Header ──────────────────────────────────────────────────────────
  headerRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
    position: "relative",
    zIndex: 1,
  },
  headerLeft:   { width: "56px", flexShrink: 0 },
  headerCenter: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: "14px",
  },
  testReportTitle: {
    fontSize: "14px",
    fontWeight: "bold",
    fontStyle: "italic",
    fontFamily: "Georgia, serif",
  },
  symbolImg: { width: "36px", height: "36px", objectFit: "contain" },
  logoImg:   { width: "50px", height: "50px", objectFit: "contain" },
  phoneBlock: {
    textAlign: "right",
    fontSize: "8.5px",
    fontWeight: "bold",
    lineHeight: "1.8",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  // ── Brand banner ────────────────────────────────────────────────────
  brandBox: {
    backgroundColor: RED,
    padding: "6px 8px",
    marginBottom: "5px",
    marginTop: "4px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  brandText: {
    color: "#fff",
    fontSize: "26px",
    fontWeight: "900",
    letterSpacing: "3px",
    fontFamily: "Impact, 'Arial Black', Arial, sans-serif",
    WebkitTextStroke: "0.5px rgba(255,255,255,0.4)",
    textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
    fontStyle: "italic",
  },

  // ── Consultant row ──────────────────────────────────────────────────
  consultantRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "2px",
    position: "relative",
    zIndex: 1,
  },
  consultantText: { fontSize: "11.5px", fontWeight: "bold" },
  datedRow:       { display: "flex", alignItems: "baseline", gap: "4px" },
  datedLabel:     { fontSize: "9.5px", fontWeight: "bold" },
  datedValue: {
    fontSize: "9.5px",
    borderBottom: "1px dotted #999",
    minWidth: "80px",
    paddingBottom: "1px",
  },
  address: {
    textAlign: "center",
    color: RED,
    fontSize: "9.5px",
    fontWeight: "bold",
    marginBottom: "6px",
    position: "relative",
    zIndex: 1,
  },

  // ── DotField ────────────────────────────────────────────────────────
  fieldRow: {
    display: "flex",
    alignItems: "flex-end",
    marginBottom: "6px",
    gap: "3px",
    position: "relative",
    zIndex: 1,
  },
  fieldLabel:     { fontSize: "9.5px", fontWeight: "bold", whiteSpace: "nowrap" },
  fieldValueLine: {
    borderBottom: "1px dotted #888",
    flexGrow: 1,
    minHeight: "14px",
    paddingBottom: "1px",
  },
  fieldValue: { fontSize: "9.5px", fontWeight: "bold", color: DKRED },

  // ── Table ────────────────────────────────────────────────────────────
  table: {
    border: "1px solid #000",
    marginTop: "6px",
    marginBottom: "0px",
    position: "relative",
    zIndex: 1,
    width: "100%",
    boxSizing: "border-box",
  },
  tableHeaderRow: {
    display: "flex",
    backgroundColor: "transparent",
    borderBottom: "1px solid #000",
  },
  tableSubRow: {
    display: "flex",
    backgroundColor: "transparent",
    borderBottom: "1px solid #000",
  },
  col0: { width: "34%", padding: "4px 6px", fontSize: "8.5px", boxSizing: "border-box" },
  col1: {
    width: "33%",
    padding: "4px 6px",
    fontSize: "8.5px",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    boxSizing: "border-box",
  },
  col2: { width: "33%", padding: "4px 6px", fontSize: "8.5px", boxSizing: "border-box" },
  colTitle:    { fontWeight: "bold", fontSize: "9.5px" },
  colTitleRed: { fontWeight: "bold", fontSize: "9.5px", color: RED, textAlign: "center", display: "block" },
  colSubTitle: { fontWeight: "bold", fontSize: "8px",   color: RED, textAlign: "center", display: "block" },

  // ── Test rows ────────────────────────────────────────────────────────
  testRow: {
    display: "flex",
    alignItems: "flex-end",
    borderBottom: "0.5px solid #DDDDDD",
    padding: "3px 6px",
    position: "relative",
    zIndex: 1,
  },
  testRowAlt: { backgroundColor: "transparent" },
  testName:   { width: "46%", fontSize: "9px", flexShrink: 0 },
  testValueLine: {
    borderBottom: "1px dotted #999",
    flexGrow: 1,
    minHeight: "14px",
    paddingBottom: "1px",
  },
  testValue: { fontSize: "9px", fontWeight: "bold", color: RED },

  // ── Note bar ─────────────────────────────────────────────────────────
  noteBox: {
    backgroundColor: RED,
    padding: "4px 8px",
    marginTop: "4px",
    zIndex: 1,
    position: "relative",
  },
  noteText: {
    color: "#fff",
    fontSize: "8px",
    fontWeight: "bold",
    textAlign: "center",
  },

  // ── Footer ───────────────────────────────────────────────────────────
  footerRow: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    zIndex: 1,
    position: "relative",
  },
  hindiText:   { fontSize: "9.5px", width: "74%", lineHeight: "1.8" },
  chemistText: { fontSize: "11px",  fontWeight: "bold" },
};

// ─── DotField ─────────────────────────────────────────────────────────────────
function DotField({ label, value, style = {} }) {
  return (
    <div style={{ ...S.fieldRow, ...style }}>
      <span style={S.fieldLabel}>{label}</span>
      <div style={S.fieldValueLine}>
        <span style={S.fieldValue}>{value || ""}</span>
      </div>
    </div>
  );
}

// ─── ReportTemplate ───────────────────────────────────────────────────────────
export function ReportTemplate({ reportData, innerRef, logoSrc, swastikSrc, omSrc }) {
  const selectedByName = {};
  const storedTests = Array.isArray(reportData.tests) ? reportData.tests : [];
  storedTests.forEach((item) => { selectedByName[item.name] = item; });

  const baseRows = labData.map((test) => ({
    ...test,
    value: selectedByName[test.name]?.value || "",
    unit:  selectedByName[test.name]?.unit  || test.unit || "",
  }));
  const customRows = storedTests.filter((t) => !labData.some((item) => item.name === t.name));
  const allRows = [
    ...baseRows,
    ...customRows,
    { id: "opinion", name: "Opinion",         value: "", unit: "" },
    { id: "fee",     name: "Fee Charged Rs.", value: "", unit: "" },
  ];

  return (
    <div style={S.page} ref={innerRef}>
      <div style={S.outerBorder}>
        <div style={S.innerBorder}>

          {/* ── Watermark ──────────────────────────────────────────────── */}
          {logoSrc && (
            <div style={S.watermark}>
              <img src={logoSrc} alt="" style={{ width: "240px", display: "block" }} />
            </div>
          )}

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={S.headerRow}>
            <div style={S.headerLeft}>
              {logoSrc && <img src={logoSrc} style={S.logoImg} alt="Kanpur Lab" />}
            </div>
            <div style={S.headerCenter}>
              {/* PNG symbols — base64 loaded via loadImageAsBase64() for html2canvas */}
              {swastikSrc && (
                <img src={swastikSrc} style={S.symbolImg} alt="swastik" />
              )}
              <span style={S.testReportTitle}>Test Report</span>
              {omSrc && (
                <img src={omSrc} style={S.symbolImg} alt="om" />
              )}
            </div>
            <div style={S.phoneBlock}>
              M. 94161-37706<br />
              M. 79881-87028<br />
              M. 93063-59224
            </div>
          </div>

          {/* ── Brand banner ────────────────────────────────────────────── */}
          <div style={S.brandBox}>
            <span style={S.brandText}>KANPUR LABORATORY</span>
          </div>

          {/* ── Consultant & Dated ──────────────────────────────────────── */}
          <div style={S.consultantRow}>
            <span style={S.consultantText}>CONSULTANT &amp; ANALYST</span>
            <div style={S.datedRow}>
              <span style={S.datedLabel}>Dated</span>
              <span style={S.datedValue}>{reportData.dated || ""}</span>
            </div>
          </div>

          {/* ── Address ─────────────────────────────────────────────────── */}
          <div style={S.address}>
            Gali No. 19, Peoda Road, Byepass, KAITHAL-136027 (Hry)
          </div>

          {/* ── Fields ──────────────────────────────────────────────────── */}
          <DotField label="Report No."       value={reportData.reportNumber} />
          <DotField label="Supplied by M/s." value={reportData.supplierName} />
          <div style={{ display: "flex", gap: "10px", marginBottom: "6px", zIndex: 1, position: "relative" }}>
            <DotField label="C/o."              value={reportData.CO}              style={{ width: "52%", marginBottom: 0 }} />
            <DotField label="Nature of Sample:" value={reportData.sampleReference} style={{ width: "46%", marginBottom: 0 }} />
          </div>
          <DotField label="To M/s." value={reportData.toMs} />

          {/* ── Analysis table ──────────────────────────────────────────── */}
          <div style={S.table}>
            <div style={S.tableHeaderRow}>
              <div style={S.col0}><span style={S.colTitle}>Result of Analysis</span></div>
              <div style={S.col1}><span style={S.colTitleRed}>AS IT IS</span></div>
              <div style={S.col2}><span style={S.colSubTitle}>Sample Not Drawn By Kanpur Laboratory</span></div>
            </div>
            <div style={S.tableSubRow}>
              <div style={S.col0}>Code No./S.No. {reportData.reportNumber || "...................."}</div>
              <div style={S.col1}>Date of Seal {reportData.dateOfSeal || "...................."}</div>
              <div style={S.col2}>Received on {reportData.dateReceived || "...................."}</div>
            </div>
            <div style={{ ...S.tableSubRow, borderBottom: "none" }}>
              <div style={S.col0}>Lorry No. {reportData.lorryNo || "...................."}</div>
              <div style={S.col1}>Bags {reportData.bags || "........"} Wt. {reportData.weight || "........"}</div>
              <div style={S.col2}>Con. of Sample {reportData.conditionOfSample || "........"}</div>
            </div>
          </div>

          {/* ── Test rows ───────────────────────────────────────────────── */}
          {allRows.map((test, i) => (
            <div
              key={test.id || test.name}
              style={{ ...S.testRow, ...(i % 2 === 0 ? S.testRowAlt : {}) }}
            >
              <div style={S.testName}>{test.name}</div>
              <div style={S.testValueLine}>
                <span style={S.testValue}>
                  {test.value ? `${test.value}${test.unit ? ` ${test.unit}` : ""}` : ""}
                </span>
              </div>
            </div>
          ))}

          {/* ── Note bar ────────────────────────────────────────────────── */}
          <div style={S.noteBox}>
            <span style={S.noteText}>
              Note :- Sample will be Re-analysed only with in TEN Days after that SAMPLE WILL be destroyed.
            </span>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={S.footerRow}>
            <div style={S.hindiText}>
              अन्यायपूर्वक कमाया हुआ धन हमारे काम आ जाए यह नियम नहीं<br />
              परन्तु उसका दण्ड, भोगना पड़ेगा - यह नियम है।
            </div>
            <span style={S.chemistText}>CHEMIST</span>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── captureTemplate ──────────────────────────────────────────────────────────
async function captureTemplate(reportData, logoSrc, swastikSrc, omSrc) {
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:794px",
    "opacity:0",
    "pointer-events:none",
    "z-index:99999",
  ].join(";");
  document.body.appendChild(container);

  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container);

  await new Promise((resolve) => {
    root.render(
      <ReportTemplate
        reportData={reportData}
        innerRef={null}
        logoSrc={logoSrc}
        swastikSrc={swastikSrc}
        omSrc={omSrc}
      />
    );
    setTimeout(resolve, 600);
  });

  const el = container.firstChild;

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: 794,
      windowHeight: el.scrollHeight,
    });

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    doc.addImage(
      canvas.toDataURL("image/jpeg", 0.97),
      "JPEG",
      0, 0,
      doc.internal.pageSize.getWidth(),
      doc.internal.pageSize.getHeight()
    );
    return doc;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

// ─── generatePDF ──────────────────────────────────────────────────────────────
export async function generatePDF(reportData, filename, logoSrc, swastikSrc, omSrc) {
  const doc = await captureTemplate(reportData, logoSrc, swastikSrc, omSrc);
  doc.save(
    filename ||
    `${(reportData.reportNumber || reportData.supplierName || "report")
      .replace(/[\s/]+/g, "-")}.pdf`
  );
}

// ─── generatePDFBlob ──────────────────────────────────────────────────────────
export async function generatePDFBlob(reportData, logoSrc, swastikSrc, omSrc) {
  const doc = await captureTemplate(reportData, logoSrc, swastikSrc, omSrc);
  return doc.output("blob");
}

// ─── ReportDownloadLink ───────────────────────────────────────────────────────
export function ReportDownloadLink({ reportData, children }) {
  const [loading,    setLoading]    = useState(false);
  const [logoSrc,    setLogoSrc]    = useState(null);
  const [swastikSrc, setSwastikSrc] = useState(null);
  const [omSrc,      setOmSrc]      = useState(null);

  useEffect(() => {
    loadImageAsBase64(kanpurLabLogo).then(setLogoSrc);
    loadImageAsBase64(swastikPng).then(setSwastikSrc);
    loadImageAsBase64(omPng).then(setOmSrc);
  }, []);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await generatePDF(reportData, undefined, logoSrc, swastikSrc, omSrc);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [reportData, loading, logoSrc, swastikSrc, omSrc]);

  return (
    <span
      onClick={handleClick}
      style={{ cursor: loading ? "wait" : "pointer", display: "inline-block" }}
    >
      {typeof children === "function"
        ? children({ loading })
        : loading ? "Generating…" : children}
    </span>
  );
}

// ─── Default export — preview ─────────────────────────────────────────────────
export default function Report({ sample }) {
  const reportData = useMemo(() => getReportDataFromSample(sample), [sample]);
  const [logoSrc,    setLogoSrc]    = useState(null);
  const [swastikSrc, setSwastikSrc] = useState(null);
  const [omSrc,      setOmSrc]      = useState(null);

  useEffect(() => {
    loadImageAsBase64(kanpurLabLogo).then(setLogoSrc);
    loadImageAsBase64(swastikPng).then(setSwastikSrc);
    loadImageAsBase64(omPng).then(setOmSrc);
  }, []);

  if (!reportData) return null;

  return (
    <div style={{ overflowX: "auto", border: "1px solid #ccc", background: "#f0f0f0", padding: "12px" }}>
      <div style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "794px" }}>
        <ReportTemplate
          reportData={reportData}
          innerRef={null}
          logoSrc={logoSrc}
          swastikSrc={swastikSrc}
          omSrc={omSrc}
        />
      </div>
    </div>
  );
}