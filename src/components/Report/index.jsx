/**
 * Report/index.jsx — html2canvas + jsPDF
 * Install: npm install html2canvas jspdf
 *
 * FIXES APPLIED:
 * 1. BLANK PDF  → container now uses opacity:0 at left:0 (not visibility:hidden at left:-9999px)
 *                 html2canvas requires the element to be in normal layout flow to paint correctly.
 * 2. LOGO 404  → loadImageAsBase64 now accepts any src (import path, blob URL, or absolute URL).
 *                 Pass your imported logo URL into captureTemplate/generatePDF instead of
 *                 hard-coding "/kanpur_lab_logo.png" which 404s in many deploy setups.
 * 3. CLIPPING  → windowHeight now uses el.scrollHeight instead of fixed 1123.
 * 4. SCROLL    → scrollY: -window.scrollY so captures aren't offset by page scroll position.
 * 5. RENDER WAIT → bumped from 300ms → 600ms for images to fully paint before capture.
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import labData from "../../data/labTests";

// ─── Import logo via bundler (resolves correctly in CRA / Vite / Next.js) ────
// If your logo lives elsewhere, adjust this import path accordingly.
// Using a bundler import guarantees the correct hashed/resolved URL at all times.
import kanpurLabLogo from "../../assets/kanpur_lab_logo.png";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Constants ───────────────────────────────────────────────────────────────
const RED   = "#CC0000";
const DKRED = "#990000";

// ─── Logo — load as base64 so html2canvas always captures it ─────────────────
// Accepts any src string: bundler-imported URL, blob URL, or absolute URL.
// FIX #2: Previously hard-coded "/kanpur_lab_logo.png" which 404s when the
//         public folder isn't served at root, or in production builds.
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
    img.onerror = () => resolve(null); // silently skip if missing
    img.src = src;
  });
}

// ─── Inline SVG symbols (no external files needed) ───────────────────────────

const SWASTIK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g fill="none" stroke="#000" stroke-width="12" stroke-linecap="square">
    <line x1="50" y1="10" x2="50" y2="90"/>
    <line x1="10" y1="50" x2="90" y2="50"/>
    <polyline points="50,10 75,10"/>
    <polyline points="90,50 90,75"/>
    <polyline points="50,90 25,90"/>
    <polyline points="10,50 10,25"/>
  </g>
  <circle cx="30" cy="30" r="5" fill="#000"/>
  <circle cx="70" cy="30" r="5" fill="#000"/>
  <circle cx="70" cy="70" r="5" fill="#000"/>
  <circle cx="30" cy="70" r="5" fill="#000"/>
</svg>
`)}`;

const OM_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text x="50" y="78" font-family="serif" font-size="80"
        text-anchor="middle" fill="#CC0000">ॐ</text>
</svg>
`)}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page: {
    width: "794px",
    minHeight: "1123px",
    backgroundColor: "#fff",
    fontFamily: "'Noto Sans', Arial, sans-serif",
    fontSize: "10px",
    padding: "10px 12px",
    boxSizing: "border-box",
  },
  outerBorder: {
    border: "2px solid #000",
    padding: "6px 8px",
    boxSizing: "border-box",
    position: "relative",
  },
  innerBorder: {
    border: "0.5px solid #000",
    padding: "6px 8px",
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 0.06,
    textAlign: "center",
    pointerEvents: "none",
    zIndex: 0,
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  watermarkBanner: {
    backgroundColor: "#000",
    color: "#fff",
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "8px",
    padding: "4px 24px",
    marginTop: "8px",
    display: "inline-block",
  },
  headerRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2px",
    position: "relative",
    zIndex: 1,
  },
  headerLeft:   { width: "40px", flexShrink: 0 },
  headerCenter: { flex: 1, display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: "10px" },
  testReportTitle: { fontSize: "13px", fontWeight: "bold", fontStyle: "italic" },
  symbolImg: { width: "28px", height: "28px", objectFit: "contain" },
  logoImg:   { width: "38px", height: "38px", objectFit: "contain" },
  phoneBlock: { textAlign: "right", fontSize: "8px", fontWeight: "bold", lineHeight: "1.7", whiteSpace: "nowrap", flexShrink: 0 },
  brandBox: { backgroundColor: RED, padding: "5px 8px", marginBottom: "4px", marginTop: "3px", textAlign: "center" },
  brandText: { color: "#fff", fontSize: "22px", fontWeight: "bold", letterSpacing: "2px" },
  consultantRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" },
  consultantText: { fontSize: "11px", fontWeight: "bold" },
  datedRow: { display: "flex", alignItems: "baseline", gap: "4px" },
  datedLabel: { fontSize: "9px", fontWeight: "bold" },
  datedValue: { fontSize: "9px", borderBottom: "1px dotted #CCCCCC", minWidth: "70px", paddingBottom: "1px" },
  address: { textAlign: "center", color: RED, fontSize: "9px", fontWeight: "bold", marginBottom: "5px" },
  fieldRow: { display: "flex", alignItems: "flex-end", marginBottom: "5px", gap: "3px" },
  fieldLabel: { fontSize: "9.5px", fontWeight: "bold", whiteSpace: "nowrap" },
  fieldValueLine: { borderBottom: "1px dotted #CCCCCC", flexGrow: 1, minHeight: "13px", paddingBottom: "1px" },
  fieldValue: { fontSize: "9.5px", fontWeight: "bold", color: DKRED },
  table: { border: "1px solid #000", marginTop: "6px", marginBottom: "2px", position: "relative", zIndex: 1 },
  tableHeaderRow: { display: "flex", backgroundColor: "#F5F5F5", borderBottom: "0.8px solid #000" },
  tableSubRow:    { display: "flex", backgroundColor: "#F5F5F5", borderBottom: "0.5px solid #000" },
  col0: { width: "34%", padding: "3px 5px", fontSize: "8px", boxSizing: "border-box" },
  col1: { width: "33%", padding: "3px 5px", fontSize: "8px", borderLeft: "0.8px solid #000", borderRight: "0.8px solid #000", boxSizing: "border-box" },
  col2: { width: "33%", padding: "3px 5px", fontSize: "8px", boxSizing: "border-box" },
  colTitle:    { fontWeight: "bold", fontSize: "9px" },
  colTitleRed: { fontWeight: "bold", fontSize: "9px", color: RED, textAlign: "center", display: "block" },
  colSubTitle: { fontWeight: "bold", fontSize: "7.5px", color: RED, textAlign: "center", display: "block" },
  testRow:    { display: "flex", alignItems: "flex-end", borderBottom: "0.3px solid #CCCCCC", padding: "2.5px 4px", position: "relative", zIndex: 1 },
  testRowAlt: { backgroundColor: "#FAFAFA" },
  testName:   { width: "49%", fontSize: "9px" },
  testValueLine: { borderBottom: "1px dotted #CCCCCC", width: "51%", minHeight: "13px", paddingBottom: "1px" },
  testValue: { fontSize: "9px", fontWeight: "bold", color: RED },
  stampWrap:  { display: "flex", justifyContent: "center", margin: "6px 0", zIndex: 1 },
  stampOuter: { width: "60px", height: "60px", borderRadius: "50%", border: "1.5px solid #888", display: "flex", alignItems: "center", justifyContent: "center" },
  stampInner: { width: "48px", height: "48px", borderRadius: "50%", border: "0.8px solid #888", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" },
  stampText:  { fontSize: "8px", fontWeight: "bold", color: "#555", lineHeight: "1.4" },
  noteBox:  { backgroundColor: RED, padding: "3px 6px", marginTop: "4px", zIndex: 1 },
  noteText: { color: "#fff", fontSize: "7.5px", fontWeight: "bold", textAlign: "center" },
  footerRow:   { marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 1 },
  hindiText:   { fontSize: "9px", fontStyle: "italic", width: "72%", lineHeight: "1.6" },
  chemistText: { fontSize: "10px", fontWeight: "bold" },
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
export function ReportTemplate({ reportData, innerRef, logoSrc }) {
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

          {/* ── Watermark ─────────────────────────────────────────────── */}
          {logoSrc && (
            <div style={S.watermark}>
              <img src={logoSrc} alt="" style={{ width: "220px", display: "block" }} />
            </div>
          )}

          {/* ── Header ────────────────────────────────────────────────── */}
          <div style={S.headerRow}>
            <div style={S.headerLeft}>
              {logoSrc && <img src={logoSrc} style={S.logoImg} alt="Kanpur Lab" />}
            </div>
            <div style={S.headerCenter}>
              <img src={SWASTIK_SVG} style={S.symbolImg} alt="swastik" />
              <span style={S.testReportTitle}>Test Report</span>
              <img src={OM_SVG} style={S.symbolImg} alt="om" />
            </div>
            <div style={S.phoneBlock}>
              M. 94161-37706<br />
              M. 79881-87028<br />
              M. 93063-59224
            </div>
          </div>

          {/* ── Red banner ────────────────────────────────────────────── */}
          <div style={S.brandBox}>
            <span style={S.brandText}>KANPUR LABORATORY</span>
          </div>

          {/* ── Consultant & Dated ────────────────────────────────────── */}
          <div style={S.consultantRow}>
            <span style={S.consultantText}>CONSULTANT &amp; ANALYST</span>
            <div style={S.datedRow}>
              <span style={S.datedLabel}>Dated</span>
              <span style={S.datedValue}>{reportData.dated || ""}</span>
            </div>
          </div>

          {/* ── Address ───────────────────────────────────────────────── */}
          <div style={S.address}>
            Gali No. 19, Peoda Road, Byepass, KAITHAL-136027 (Hry)
          </div>

          {/* ── Fields ────────────────────────────────────────────────── */}
          <DotField label="Report No."       value={reportData.reportNumber} />
          <DotField label="Supplied by M/s." value={reportData.supplierName} />
          <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
            <DotField label="C/o."              value={reportData.CO}              style={{ width: "52%", marginBottom: 0 }} />
            <DotField label="Nature of Sample:" value={reportData.sampleReference} style={{ width: "46%", marginBottom: 0 }} />
          </div>
          <DotField label="To M/s." value={reportData.toMs} />

          {/* ── Analysis table ────────────────────────────────────────── */}
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

          {/* ── Test rows ─────────────────────────────────────────────── */}
          {allRows.map((test, i) => (
            <div key={test.id || test.name}
              style={{ ...S.testRow, ...(i % 2 === 0 ? S.testRowAlt : {}) }}>
              <div style={S.testName}>{test.name}</div>
              <div style={S.testValueLine}>
                <span style={S.testValue}>
                  {test.value ? `${test.value}${test.unit ? ` ${test.unit}` : ""}` : ""}
                </span>
              </div>
            </div>
          ))}

          {/* ── Stamp ─────────────────────────────────────────────────── */}
          <div style={S.stampWrap}>
            <div style={S.stampOuter}>
              <div style={S.stampInner}>
                <span style={S.stampText}>KANPUR<br />LAB</span>
              </div>
            </div>
          </div>

          {/* ── Note bar ──────────────────────────────────────────────── */}
          <div style={S.noteBox}>
            <span style={S.noteText}>
              Note :- Sample will be Re-analysed only with in TEN Days after that SAMPLE WILL be destroyed.
            </span>
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
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

// ─── captureTemplate — shared capture logic ───────────────────────────────────
// FIX #1 (blank PDF): container now uses opacity:0 positioned at left:0 top:0.
//   - visibility:hidden at left:-9999px causes html2canvas to render a blank
//     white canvas because the element is outside the browser's paint viewport.
//   - opacity:0 keeps the element fully painted in normal layout flow, so
//     html2canvas can traverse the DOM and capture every pixel correctly.
// FIX #2 (logo): logoSrc is now passed in from outside (bundler-resolved import),
//   instead of being hard-coded as "/kanpur_lab_logo.png" inside this function.
// FIX #3 (clipping): windowHeight uses el.scrollHeight (actual content height).
// FIX #4 (scroll offset): scrollY: -window.scrollY corrects for page scroll.
// FIX #5 (render wait): 600ms instead of 300ms for images to fully paint.
async function captureTemplate(reportData, logoSrc) {
  const container = document.createElement("div");

  // ✅ FIX #1 — opacity:0 + on-screen position lets html2canvas paint correctly
  container.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",            // on-screen (was left:-9999px — caused blank canvas)
    "width:794px",
    "opacity:0",         // invisible to user (was visibility:hidden — broke paint)
    "pointer-events:none",
    "z-index:99999",
  ].join(";");

  document.body.appendChild(container);

  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container);

  await new Promise((resolve) => {
    root.render(
      <ReportTemplate reportData={reportData} innerRef={null} logoSrc={logoSrc} />
    );
    // ✅ FIX #5 — 600ms (was 300ms) gives images time to fully paint
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
      scrollY: -window.scrollY, // ✅ FIX #4 — account for page scroll offset
      windowWidth: 794,
      windowHeight: el.scrollHeight, // ✅ FIX #3 — actual height, not fixed 1123
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

// ─── generatePDF — save to disk ───────────────────────────────────────────────
// FIX #2: logoSrc param replaces the internal loadImageAsBase64("/kanpur_lab_logo.png") call.
// Call this as: generatePDF(reportData, undefined, logoBase64)
// where logoBase64 = await loadImageAsBase64(kanpurLabLogo)  ← bundler import at top
export async function generatePDF(reportData, filename, logoSrc) {
  const doc = await captureTemplate(reportData, logoSrc);
  doc.save(
    filename ||
    `${(reportData.reportNumber || reportData.supplierName || "report")
      .replace(/[\s/]+/g, "-")}.pdf`
  );
}

// ─── generatePDFBlob — return Blob (for Web Share / WhatsApp) ─────────────────
export async function generatePDFBlob(reportData, logoSrc) {
  const doc = await captureTemplate(reportData, logoSrc);
  return doc.output("blob");
}

// ─── ReportDownloadLink ───────────────────────────────────────────────────────
export function ReportDownloadLink({ reportData, children }) {
  const [loading, setLoading] = useState(false);
  // Pre-load logo base64 once when this component mounts
  const [logoSrc, setLogoSrc] = useState(null);

  useEffect(() => {
    // ✅ FIX #2 — use bundler-imported URL, not a hard-coded public path
    loadImageAsBase64(kanpurLabLogo).then(setLogoSrc);
  }, []);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await generatePDF(reportData, undefined, logoSrc);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [reportData, loading, logoSrc]);

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

// ─── Default export — preview only ───────────────────────────────────────────
export default function Report({ sample }) {
  const reportData = useMemo(() => getReportDataFromSample(sample), [sample]);
  const [logoSrc, setLogoSrc] = useState(null);

  useEffect(() => {
    // ✅ FIX #2 — bundler import, not "/kanpur_lab_logo.png"
    loadImageAsBase64(kanpurLabLogo).then(setLogoSrc);
  }, []);

  if (!reportData) return null;

  return (
    <div style={{ overflowX: "auto", border: "1px solid #ccc", background: "#f0f0f0", padding: "12px" }}>
      <div style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "794px" }}>
        <ReportTemplate reportData={reportData} innerRef={null} logoSrc={logoSrc} />
      </div>
    </div>
  );
}