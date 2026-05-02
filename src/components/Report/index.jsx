import { useMemo, useState, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import labData from '../../data/labTests';

import kanpurLabLogo from '../../assets/kanpur_lab_logo.png';
import kanpurLabWaterMark from '../../assets/kanpur_lab_WaterMark.png';
import swastikPng from '../../assets/Swastika_Symbol.png';
import omPng from '../../assets/OM_Symbol.png';
import chemistSignPng from '../../assets/chemist_sign.png';

const RED = '#CC0000';
const DKRED = '#990000';

// Converts image assets to data URLs so preview and PDF capture render consistently.
async function loadImageAsBase64(src) {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN');
}

const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const tens_w = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];
const digits = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

function intToWords(n) {
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + intToWords(-n);
  if (n < 20) return ones[n];
  if (n < 100) return tens_w[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000)
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + intToWords(n % 100) : '');
  if (n < 100000)
    return (
      intToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + intToWords(n % 1000) : '')
    );
  return String(n);
}

export function numberToWords(value, isPercent = false) {
  if (value === '' || value === null || value === undefined) return '';
  const str = String(value).trim();
  const match = str.match(/^([+-]?\d+\.?\d*)(.*)$/);
  if (!match) return str;
  const numStr = match[1];
  const num = parseFloat(numStr);
  if (isNaN(num)) return str;

  const dotIdx = numStr.indexOf('.');
  let words;
  if (dotIdx === -1) {
    words = intToWords(Math.abs(Math.round(num)));
  } else {
    const intPart = Math.floor(Math.abs(num));
    const decStr = numStr.slice(dotIdx + 1);
    const decWords = decStr
      .split('')
      .map((d) => digits[parseInt(d)])
      .join(' ');
    words = intToWords(intPart) + ' point ' + decWords;
  }
  return isPercent ? words + ' percent' : words;
}

export function getReportDataFromSample(sample, fallbackTests = []) {
  if (!sample) return null;
  return {
    reportNumber: sample.reportNumber || '',
    sampleNo: sample.sampleNo || '',
    supplierName: sample.supplierName || '',
    CO: sample.CO || '',
    toMs: sample.toMs || '',
    dated: formatDate(sample.dateOfTest || sample.updatedAt || sample.createdAt),
    dateOfSeal: formatDate(sample.dateOfSeal),
    dateReceived: formatDate(sample.dateReceived),
    sampleReference: sample.sampleReference || '',
    lorryNo: sample.lorryNo || '',
    bags: sample.bags || '',
    weight: sample.weight || '',
    conditionOfSample: sample.conditionOfSample || '',
    tests: Array.isArray(sample.tests) ? sample.tests : fallbackTests,
  };
}

// Shared inline style map used by the preview and PDF renderer.
const S = {
  page: {
    width: '794px',
    minHeight: '1123px',
    backgroundColor: '#fff',
    fontFamily: "'Noto Sans', 'Mangal', Arial, sans-serif",
    fontSize: '10px',
    padding: '14px 16px',
    boxSizing: 'border-box',
  },
  outerBorder: {
    border: '2.5px solid #000',
    padding: '0',
    boxSizing: 'border-box',
    position: 'relative',
    minHeight: '1091px',
  },
  innerBorder: {
    border: '1px solid #000',
    margin: '4px',
    padding: '8px 10px',
    position: 'relative',
    boxSizing: 'border-box',
    minHeight: '1079px',
    display: 'flex',
    flexDirection: 'column',
  },
  watermark: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    opacity: 0.12,
    textAlign: 'center',
    pointerEvents: 'none',
    zIndex: 0,
    userSelect: 'none',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    marginBottom: '10px',
    position: 'relative',
    zIndex: 1,
  },
  headerLeft: { width: '56px', flexShrink: 0 },
  headerCenter: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '14px',
  },
  testReportTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontFamily: 'Georgia, serif',
  },
  symbolImg: { width: '36px', height: '36px', objectFit: 'contain' },
  logoImg: { width: '70px', height: '50px', objectFit: 'contain' },
  phoneBlock: {
    textAlign: 'right',
    fontSize: '10px',
    fontWeight: 'bold',
    lineHeight: '1.8',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  brandBox: {
    backgroundColor: RED,
    padding: '8px 8px',
    marginBottom: '8px',
    marginTop: '6px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  brandText: {
    color: '#fff',
    fontSize: '26px',
    fontWeight: '900',
    letterSpacing: '2px',
    fontFamily: "'Segoe UI Black', 'Arial Black', 'Impact', sans-serif",
    WebkitTextStroke: '0.5px rgba(255,255,255,0.4)',
    textShadow: '1px 1px 0 rgba(0,0,0,0.3)',
    fontStyle: 'italic',
  },
  consultantRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '2px',
    position: 'relative',
    zIndex: 1,
  },
  consultantText: { fontSize: '13px', fontWeight: 'bold' },
  datedRow: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  datedLabel: { fontSize: '11px', fontWeight: 'bold' },
  datedValue: {
    fontSize: '11px',
    borderBottom: '1px dotted #999',
    minWidth: '80px',
    paddingBottom: '1px',
  },
  address: {
    textAlign: 'center',
    color: RED,
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '12px',
    position: 'relative',
    zIndex: 1,
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: '12px',
    gap: '8px',
    position: 'relative',
    zIndex: 1,
  },
  fieldLabel: { fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  fieldValueLine: {
    borderBottom: '1px dotted #888',
    flexGrow: 1,
    minHeight: '14px',
    paddingBottom: '1px',
  },
  fieldValue: { fontSize: '11px', fontWeight: 'bold', color: DKRED },
  table: {
    border: '1px solid #000',
    marginTop: '6px',
    marginBottom: '0px',
    position: 'relative',
    zIndex: 1,
    width: '100%',
    boxSizing: 'border-box',
  },
  tableHeaderRow: {
    display: 'flex',
    backgroundColor: 'transparent',
    borderBottom: '1px solid #000',
  },
  tableSubRow: {
    display: 'flex',
    backgroundColor: 'transparent',
    borderBottom: '1px solid #000',
  },
  col0: { width: '34%', padding: '6px 6px', fontSize: '10px', boxSizing: 'border-box' },
  col1: {
    width: '33%',
    padding: '6px 6px',
    fontSize: '10px',
    borderLeft: '1px solid #000',
    borderRight: '1px solid #000',
    boxSizing: 'border-box',
  },
  col2: { width: '33%', padding: '6px 6px', fontSize: '10px', boxSizing: 'border-box' },
  colTitle: { fontWeight: 'bold', fontSize: '11px' },
  colTitleRed: {
    fontWeight: 'bold',
    fontSize: '11px',
    color: RED,
    textAlign: 'center',
    display: 'block',
  },
  colSubTitle: {
    fontWeight: 'bold',
    fontSize: '9.5px',
    color: RED,
    textAlign: 'center',
    display: 'block',
  },
  tableSubLabel: { fontSize: '10px', fontWeight: 'bold', color: '#000' },
  tableSubValue: { fontSize: '10px', fontWeight: 'bold', color: DKRED, marginLeft: '8px' },
  testRow: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '0.5px solid #DDDDDD',
    padding: '10px 6px',
    position: 'relative',
    zIndex: 1,
  },
  testRowAlt: { backgroundColor: 'transparent' },
  testName: {
    width: '22%',
    fontSize: '11px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  testValueLine: {
    borderBottom: '1px dotted #999',
    flexGrow: 1,
    minHeight: '24px',
    paddingBottom: '1px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  testValue: { fontSize: '13px', fontWeight: 'bold', color: RED },
  testValueWords: { fontSize: '13px', color: '#333', fontStyle: 'italic', marginTop: '1px' },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    borderTop: '1.5px solid #aaa',
    borderBottom: '0.5px solid #DDDDDD',
    padding: '14px 6px',
    position: 'relative',
    zIndex: 1,
    backgroundColor: '#fafafa',
  },
  summaryName: {
    width: '22%',
    fontSize: '11px',
    flexShrink: 0,
    fontStyle: 'italic',
    color: '#444',
    display: 'flex',
    alignItems: 'center',
  },
  summaryValueLine: {
    borderBottom: '1px dotted #bbb',
    flexGrow: 1,
    minHeight: '16px',
    paddingBottom: '1px',
  },
  spacer: { flexGrow: 1 },
  noteBox: {
    backgroundColor: RED,
    padding: '4px 8px',
    marginTop: '4px',
    zIndex: 1,
    position: 'relative',
  },
  noteText: {
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footerRow: {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 1,
    position: 'relative',
  },
  hindiText: { fontSize: '11.5px', width: '60%', lineHeight: '1.8' },
  signatureBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  signatureImg: {
    width: '110px',
    height: '50px',
    objectFit: 'contain',
    display: 'block',
  },
  signatureLine: {
    width: '110px',
    borderTop: '1px solid #000',
    marginBottom: '2px',
  },
  chemistText: { fontSize: '11px', fontWeight: 'bold', textAlign: 'center' },
};

// Renders a labeled value line used in the report header details.
function DotField({ label, value, style = {} }) {
  return (
    <div style={{ ...S.fieldRow, ...style }}>
      <span style={S.fieldLabel}>{label}</span>
      <div style={S.fieldValueLine}>
        <span style={S.fieldValue}>{value || ''}</span>
      </div>
    </div>
  );
}

// Builds the printable report layout used by both preview and export.
export function ReportTemplate({
  reportData,
  innerRef,
  logoSrc,
  waterMarkSrc,
  swastikSrc,
  omSrc,
  signSrc,
}) {
  const selectedByName = {};
  const storedTests = Array.isArray(reportData.tests) ? reportData.tests : [];
  storedTests.forEach((item) => {
    selectedByName[item.name] = item;
  });

  const baseRows = labData.map((test) => ({
    ...test,
    value: selectedByName[test.name]?.value || '',
    unit: selectedByName[test.name]?.unit || test.unit || '',
  }));
  const customRows = storedTests.filter((t) => !labData.some((item) => item.name === t.name));

  const testRows = [...baseRows, ...customRows];
  const summaryRows = [
    { id: 'opinion', name: 'Opinion' },
    { id: 'fee', name: 'Fee Charged Rs.' },
  ];

  return (
    <div style={S.page} ref={innerRef}>
      <div style={S.outerBorder}>
        <div style={S.innerBorder}>
          {waterMarkSrc && (
            <div style={S.watermark}>
              <img src={waterMarkSrc} alt="" style={{ width: '240px', display: 'block' }} />
            </div>
          )}
          <div style={S.headerRow}>
            <div style={S.headerLeft}>
              {logoSrc && <img src={logoSrc} style={S.logoImg} alt="Kanpur Lab" />}
            </div>
            <div style={S.headerCenter}>
              {swastikSrc && <img src={swastikSrc} style={S.symbolImg} alt="swastik" />}
              <span style={S.testReportTitle}>Test Report</span>
              {omSrc && <img src={omSrc} style={S.symbolImg} alt="om" />}
            </div>
            <div style={S.phoneBlock}>
              M. 94161-37706
              <br />
              M. 79881-87028
              <br />
              M. 93063-59224
            </div>
          </div>
          <div style={S.brandBox}>
            <span style={S.brandText}>KANPUR LABORATORY</span>
          </div>
          <div style={S.consultantRow}>
            <span style={S.consultantText}>CONSULTANT &amp; ANALYST</span>
            <div style={S.datedRow}>
              <span style={S.datedLabel}>Dated</span>
              <span style={S.datedValue}>{reportData.dated || ''}</span>
            </div>
          </div>
          <div style={S.address}>Gali No. 19, Peoda Road, Byepass, KAITHAL-136027 (Hry)</div>
          <DotField label="Report No." value={reportData.reportNumber} />
          <DotField label="Supplied by M/s." value={reportData.supplierName} />
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '12px',
              zIndex: 1,
              position: 'relative',
            }}
          >
            <DotField
              label="C/o."
              value={reportData.CO}
              style={{ width: '52%', marginBottom: 0 }}
            />
            <DotField
              label="Sample Type:"
              value={reportData.sampleReference}
              style={{ width: '46%', marginBottom: 0 }}
            />
          </div>
          <DotField label="To M/s." value={reportData.toMs} />
          <div style={S.table}>
            <div style={S.tableHeaderRow}>
              <div style={S.col0}>
                <span style={S.colTitle}>Result of Analysis</span>
              </div>
              <div style={S.col1}>
                <span style={S.colTitleRed}>AS IT IS</span>
              </div>
              <div style={S.col2}>
                <span style={S.colSubTitle}>Sample Not Drawn By Kanpur Laboratory</span>
              </div>
            </div>
            <div style={S.tableSubRow}>
              <div style={S.col0}>
                <span style={S.tableSubLabel}>Code No./S.No.</span>
                <span style={S.tableSubValue}>
                  {reportData.sampleNo || reportData.reportNumber || '....................'}
                </span>
              </div>
              <div style={S.col1}>
                <span style={S.tableSubLabel}>Date of Seal</span>
                <span style={S.tableSubValue}>
                  {reportData.dateOfSeal || '....................'}
                </span>
              </div>
              <div style={S.col2}>
                <span style={S.tableSubLabel}>Received on</span>
                <span style={S.tableSubValue}>
                  {reportData.dateReceived || '....................'}
                </span>
              </div>
            </div>
            <div style={{ ...S.tableSubRow, borderBottom: 'none' }}>
              <div style={S.col0}>
                <span style={S.tableSubLabel}>Lorry No.</span>
                <span style={S.tableSubValue}>{reportData.lorryNo || '....................'}</span>
              </div>
              <div style={S.col1}>
                <span style={S.tableSubLabel}>Bags</span>
                <span style={S.tableSubValue}>{reportData.bags || '........'}</span>
                <span style={{ ...S.tableSubLabel, marginLeft: '10px' }}>Wt.</span>
                <span style={S.tableSubValue}>{reportData.weight || '........'}</span>
              </div>
              <div style={S.col2}>
                <span style={S.tableSubLabel}>Con. of Sample</span>
                <span style={S.tableSubValue}>{reportData.conditionOfSample || '........'}</span>
              </div>
            </div>
          </div>
          {testRows.map((test, i) => {
            const rawUnit = (test.unit || '').trim();
            const isPercent = rawUnit === '%';
            const unitSuffix = rawUnit ? (isPercent ? ' %' : ` ${rawUnit}`) : '';
            const displayValue = test.value ? `${test.value}${unitSuffix}` : '';
            const words = test.value ? numberToWords(test.value, isPercent) : '';
            return (
              <div
                key={test.id || test.name}
                style={{ ...S.testRow, ...(i % 2 === 0 ? S.testRowAlt : {}) }}
              >
                <div style={S.testName}>{test.name}</div>
                <div style={S.testValueLine}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={S.testValue}>{displayValue}</span>
                    {words && <span style={S.testValueWords}>({words})</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {summaryRows.map((row) => (
            <div key={row.id} style={S.summaryRow}>
              <div style={S.summaryName}>{row.name}</div>
              <div style={S.summaryValueLine} />
            </div>
          ))}
          <div style={S.spacer} />
          <div style={S.noteBox}>
            <span style={S.noteText}>
              Note :- Sample will be Re-analysed only with in TEN Days after that SAMPLE WILL be
              destroyed.
            </span>
          </div>
          <div style={S.footerRow}>
            <div style={S.hindiText}>
              अन्यायपूर्वक कमाया हुआ धन हमारे काम आ जाए यह नियम नहीं
              <br />
              परन्तु उसका दण्ड, भोगना पड़ेगा - यह नियम है।
            </div>
            <div style={S.signatureBlock}>
              {signSrc && <img src={signSrc} alt="Chemist Signature" style={S.signatureImg} />}
              <div style={S.signatureLine} />
              <span style={S.chemistText}>CHEMIST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Renders the report off-screen and captures it for PDF creation.
async function captureTemplate(reportData, logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc) {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;top:0;left:0;width:794px;opacity:0;pointer-events:none;z-index:99999;';
  document.body.appendChild(container);

  const { createRoot } = await import('react-dom/client');
  const root = createRoot(container);

  await new Promise((resolve) => {
    root.render(
      <ReportTemplate
        reportData={reportData}
        innerRef={null}
        logoSrc={logoSrc}
        waterMarkSrc={waterMarkSrc}
        swastikSrc={swastikSrc}
        omSrc={omSrc}
        signSrc={signSrc}
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
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: 794,
      windowHeight: el.scrollHeight,
    });
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    doc.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      doc.internal.pageSize.getWidth(),
      doc.internal.pageSize.getHeight()
    );
    return doc;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

// Downloads a PDF file for the provided report data.
export async function generatePDF(
  reportData,
  filename,
  logoSrc,
  waterMarkSrc,
  swastikSrc,
  omSrc,
  signSrc
) {
  const doc = await captureTemplate(reportData, logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc);
  doc.save(
    filename ||
      `${(reportData.reportNumber || reportData.supplierName || 'report').replace(
        /[\s/]+/g,
        '-'
      )}.pdf`
  );
}

// Returns a PDF blob for share workflows.
export async function generatePDFBlob(
  reportData,
  logoSrc,
  waterMarkSrc,
  swastikSrc,
  omSrc,
  signSrc
) {
  const doc = await captureTemplate(reportData, logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc);
  return doc.output('blob');
}

// Loads the report image assets once for preview and export.
export function useReportAssets() {
  const [logoSrc, setLogoSrc] = useState(null);
  const [waterMarkSrc, setWaterMarkSrc] = useState(null);
  const [swastikSrc, setSwastikSrc] = useState(null);
  const [omSrc, setOmSrc] = useState(null);
  const [signSrc, setSignSrc] = useState(null);

  useEffect(() => {
    loadImageAsBase64(kanpurLabLogo).then(setLogoSrc);
    loadImageAsBase64(kanpurLabWaterMark).then(setWaterMarkSrc);
    loadImageAsBase64(swastikPng).then(setSwastikSrc);
    loadImageAsBase64(omPng).then(setOmSrc);
    loadImageAsBase64(chemistSignPng).then(setSignSrc);
  }, []);

  return { logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc };
}

// Wraps report downloads with loading state handling.
export function ReportDownloadLink({ reportData, children }) {
  const [loading, setLoading] = useState(false);
  const { logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc } = useReportAssets();

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await generatePDF(reportData, undefined, logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [reportData, loading, logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc]);

  return (
    <span
      onClick={handleClick}
      style={{ cursor: loading ? 'wait' : 'pointer', display: 'inline-block' }}
    >
      {typeof children === 'function' ? children({ loading }) : loading ? 'Generating…' : children}
    </span>
  );
}

// Shows an on-screen preview of the report layout.
export default function Report({ sample }) {
  const reportData = useMemo(() => getReportDataFromSample(sample), [sample]);
  const { logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc } = useReportAssets();

  if (!reportData) return null;

  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid #ccc',
        background: '#f0f0f0',
        padding: '12px',
      }}
    >
      <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '794px' }}>
        <ReportTemplate
          reportData={reportData}
          innerRef={null}
          logoSrc={logoSrc}
          waterMarkSrc={waterMarkSrc}
          swastikSrc={swastikSrc}
          omSrc={omSrc}
          signSrc={signSrc}
        />
      </div>
    </div>
  );
}
