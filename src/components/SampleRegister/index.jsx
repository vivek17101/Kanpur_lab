import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import labData from "../../data/labTests";
import {
  createSample,
  deleteSample,
  getSample,
  getSamples,
  getSampleStats,
  updateSample,
} from "../../services/sampleApi";
import { getSuppliers } from "../../services/supplierApi";
import Button, { ButtonLabel } from "../Button";
import ConfirmModal from "../ConfirmModal";
import Report, {
  getReportDataFromSample,
  ReportDownloadLink,
  generatePDFBlob,
  useReportAssets,
} from "../Report";
import Toast from "../Toast";
import styles from "./SampleRegister.module.css";

const SAMPLE_TYPES = ["Rice Bran","Cotton Seed","Cotton Cake","Mustard Seeds","Mustard Cake","DOC","Dal"];

function getEmptyForm() {
  return {
    sampleNo: "", supplierName: "", CO: "", toMs: "", sampleReference: "",
    dateOfSeal: "", dateReceived: new Date().toISOString().split("T")[0],
    dateOfTest: "", lorryNo: "", bags: "", weight: "", conditionOfSample: "",
  };
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN");
}

function normalizeTests(sampleTests = []) {
  const testsByName = {};
  sampleTests.forEach((t) => { testsByName[t.name] = t; });
  const baseTests = labData.map((t) => ({
    name: t.name,
    value: testsByName[t.name]?.value || "",
    unit: testsByName[t.name]?.unit || t.unit || "",
    referenceValue: testsByName[t.name]?.referenceValue || t.referenceValue || "",
  }));
  const customTests = sampleTests.filter((t) => !labData.some((l) => l.name === t.name));
  return [...baseTests, ...customTests];
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function getRegisterRows(samples) {
  return samples.map((s) => ({
    "Report No.": s.reportNumber || "",
    "Sample No.": s.sampleNo || "",
    Supplier: s.supplierName || "",
    "C/o": s.CO || "",
    "To M/s": s.toMs || "",
    "Sample Type": s.sampleReference || "",
    "Date of Seal": formatDate(s.dateOfSeal),
    "Received Date": formatDate(s.dateReceived),
    "Date of Test": formatDate(s.dateOfTest),
    "Lorry No.": s.lorryNo || "",
    Bags: s.bags || "",
    Weight: s.weight || "",
    "Condition of Sample": s.conditionOfSample || "",
    Status: s.status || "",
    Tests: Array.isArray(s.tests)
      ? s.tests.filter((t) => t.name || t.value).map((t) => `${t.name||""}: ${t.value||""}${t.unit?` ${t.unit}`:""}`).join("; ")
      : "",
  }));
}

function downloadFile(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = fileName; link.click();
  URL.revokeObjectURL(url);
}

function normalizeWhatsAppNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function sampleToFields(s) {
  return {
    sampleNo: s.sampleNo || "", supplierName: s.supplierName || "",
    CO: s.CO || "", toMs: s.toMs || "", sampleReference: s.sampleReference || "",
    dateOfSeal: s.dateOfSeal ? s.dateOfSeal.split("T")[0] : "",
    dateReceived: s.dateReceived ? s.dateReceived.split("T")[0] : "",
    dateOfTest: s.dateOfTest ? s.dateOfTest.split("T")[0] : "",
    lorryNo: s.lorryNo || "", bags: s.bags || "",
    weight: s.weight || "", conditionOfSample: s.conditionOfSample || "",
  };
}

export default function SampleRegister({ suppliersVersion = 0 }) {
  const [form, setForm] = useState(getEmptyForm);
  const [samples, setSamples] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({ total: 0, Pending: 0, Tested: 0, Reported: 0 });
  const [selectedSample, setSelectedSample] = useState(null);
  const [sampleFields, setSampleFields] = useState(getEmptyForm);
  const [testRows, setTestRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [view, setView] = useState("list");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [confirm, setConfirm] = useState({ message: "", onConfirm: null });
  const allSamplesRef = useRef(null);

  const showToast = useCallback((message, type = "info") => setToast({ message, type }), []);
  const showConfirm = useCallback((message, onConfirm) => setConfirm({ message, onConfirm }), []);
  const dismissConfirm = useCallback(() => setConfirm({ message: "", onConfirm: null }), []);

  const loadSamples = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterParams = { search, status: statusFilter, startDate, endDate, page, limit: 50 };
      const [data, summary] = await Promise.all([
        getSamples(filterParams),
        getSampleStats({ search, startDate, endDate }),
      ]);
      setSamples(data.samples);
      setPagination(data.pagination);
      setStats(summary);
      allSamplesRef.current = null;
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [endDate, search, startDate, statusFilter, page, showToast]);

  useEffect(() => { loadSamples(); }, [loadSamples]);

  useEffect(() => {
    async function loadSuppliers() {
      try { setSuppliers(await getSuppliers()); } catch { setSuppliers([]); }
    }
    loadSuppliers();
  }, [suppliersVersion]);

  const reportData = useMemo(() => getReportDataFromSample(selectedSample), [selectedSample]);
  const { logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc } = useReportAssets();

  const supplierOptions = useMemo(() => {
    const all = [...suppliers.map((s) => s.name), ...samples.map((s) => s.supplierName)];
    return [...new Set(all.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [samples, suppliers]);

  const sampleTypeOptions = useMemo(() => {
    const saved = samples.map((s) => s.sampleReference).filter((t) => t && !SAMPLE_TYPES.includes(t));
    return [...new Set([...SAMPLE_TYPES, ...saved])].sort((a, b) => a.localeCompare(b));
  }, [samples]);

  const testNameOptions = useMemo(() => {
    const all = [...labData.map((t) => t.name), ...testRows.map((t) => t.name)];
    return [...new Set(all.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [testRows]);

  const selectedSupplier = useMemo(() => {
    if (!selectedSample?.supplierName) return null;
    return suppliers.find((s) => s.name.toLowerCase() === selectedSample.supplierName.toLowerCase());
  }, [selectedSample, suppliers]);

  const selectedSupplierWhatsApp = normalizeWhatsAppNumber(selectedSupplier?.whatsappNumber);

  const clearFilters = () => { setSearch(""); setStatusFilter(""); setStartDate(""); setEndDate(""); setPage(1); };

  const fetchAllSamples = useCallback(async () => {
    if (allSamplesRef.current) return allSamplesRef.current;
    const data = await getSamples({ search, status: statusFilter, startDate, endDate, limit: 10000, page: 1 });
    allSamplesRef.current = data.samples;
    return data.samples;
  }, [search, statusFilter, startDate, endDate]);

  const handleExportCsv = async () => {
    try {
      const all = await fetchAllSamples();
      const rows = getRegisterRows(all);
      if (!rows.length) { showToast("No samples to export.", "warning"); return; }
      const headers = Object.keys(rows[0]);
      const csv = [headers.map(escapeCsvValue).join(","), ...rows.map((r) => headers.map((h) => escapeCsvValue(r[h])).join(","))].join("\n");
      downloadFile(`\uFEFF${csv}`, `kanpur-lab-register-${new Date().toISOString().split("T")[0]}.csv`, "text/csv;charset=utf-8");
      showToast(`CSV exported — ${rows.length} records.`, "success");
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleExportExcel = async () => {
    try {
      const all = await fetchAllSamples();
      const rows = getRegisterRows(all);
      if (!rows.length) { showToast("No samples to export.", "warning"); return; }
      const headers = Object.keys(rows[0]);
      const table = `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${escapeHtml(r[h])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      const wb = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/><style>table{border-collapse:collapse}th,td{border:1px solid #999;padding:6px}th{background:#eef0f5;font-weight:bold}</style></head><body>${table}</body></html>`;
      downloadFile(wb, `kanpur-lab-register-${new Date().toISOString().split("T")[0]}.xls`, "application/vnd.ms-excel;charset=utf-8");
      showToast(`Excel exported — ${rows.length} records.`, "success");
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleCreateSample = async (e) => {
    e.preventDefault();
    try {
      const created = await createSample(form);
      setForm(getEmptyForm());
      showToast("Sample entry saved.", "success");
      setSelectedSample(created);
      setSampleFields(sampleToFields(created));
      setTestRows(normalizeTests(created.tests));
      setView("tests");
      await loadSamples();
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleSelectSample = async (id, nextView = "tests") => {
    try {
      const sample = await getSample(id);
      setSelectedSample(sample);
      setSampleFields(sampleToFields(sample));
      setTestRows(normalizeTests(sample.tests));
      setView(nextView);
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleTestChange = (index, field, value) => {
    setTestRows((cur) => cur.map((t, i) => i === index
      ? { ...t, [field]: value, ...(field === "name" ? { unit: labData.find((l) => l.name === value)?.unit || t.unit } : {}) }
      : t
    ));
  };

  const handleSaveSampleFields = async () => {
    if (!selectedSample) return;
    try {
      const updated = await updateSample(selectedSample._id, sampleFields);
      setSelectedSample(updated);
      showToast("Sample details saved.", "success");
      await loadSamples();
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleAddCustomTest = () => {
    setTestRows((c) => [...c, { name: "", value: "", unit: "", referenceValue: "" }]);
  };

  const handleSaveTests = async () => {
    if (!selectedSample) return;
    const tests = testRows.filter((t) => t.name.trim()).map((t) => ({ name: t.name.trim(), value: t.value || "", unit: t.unit || "" }));
    try {
      const updated = await updateSample(selectedSample._id, {
        tests,
        dateOfTest: sampleFields.dateOfTest ? new Date(sampleFields.dateOfTest).toISOString() : new Date().toISOString(),
      });
      setSelectedSample(updated);
      setTestRows(normalizeTests(updated.tests));
      showToast("Test results saved.", "success");
      await loadSamples();
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleDeleteSample = (id) => {
    showConfirm("Delete this sample entry? This cannot be undone.", async () => {
      dismissConfirm();
      try {
        await deleteSample(id);
        if (selectedSample?._id === id) { setSelectedSample(null); setView("list"); }
        showToast("Sample deleted.", "info");
        await loadSamples();
      } catch (err) { showToast(err.message, "error"); }
    });
  };

  const handleMarkReported = async () => {
    if (!selectedSample) return;
    try {
      const updated = await updateSample(selectedSample._id, { status: "Reported" });
      setSelectedSample(updated);
      showToast("Sample marked as reported.", "success");
      await loadSamples();
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleSharePdf = async () => {
    if (!reportData) return;
    const fileName = `${(reportData.reportNumber || reportData.supplierName || "sample-report").replace(/[\s/]+/g, "-")}.pdf`;
    const blob = await generatePDFBlob(reportData, logoSrc, waterMarkSrc, swastikSrc, omSrc, signSrc);
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "Kanpur Laboratory Report", text: `Test report ${reportData.reportNumber || ""} for ${reportData.supplierName}`.trim(), files: [file] });
      await handleMarkReported();
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = fileName; link.click();
    URL.revokeObjectURL(url);
    const msg = `Kanpur Laboratory report ${reportData.reportNumber || ""} generated for ${reportData.supplierName}. Please attach the downloaded PDF.`;
    window.open(
      selectedSupplierWhatsApp ? `https://wa.me/${selectedSupplierWhatsApp}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`,
      "_blank", "noopener,noreferrer"
    );
    await handleMarkReported();
  };

  const FieldGroup = ({ fields, onChange }) => (
    <div className={styles.grid}>
      <label className={styles.field}><span>Sample No.</span><input name="sampleNo" value={fields.sampleNo} onChange={onChange} /></label>
      <label className={styles.field}><span>Supplier Name</span><input list="supplier-master-options" name="supplierName" value={fields.supplierName} onChange={onChange} required /></label>
      <label className={styles.field}><span>C/o</span><input name="CO" value={fields.CO} onChange={onChange} /></label>
      <label className={styles.field}><span>To M/s</span><input name="toMs" value={fields.toMs} onChange={onChange} /></label>
      <label className={styles.field}><span>Sample Type</span><input list="sample-type-options" name="sampleReference" value={fields.sampleReference} onChange={onChange} placeholder="Select or type sample type" required /></label>
      <label className={styles.field}><span>Date of Seal</span><input type="date" name="dateOfSeal" value={fields.dateOfSeal} onChange={onChange} /></label>
      <label className={styles.field}><span>Date Received</span><input type="date" name="dateReceived" value={fields.dateReceived} onChange={onChange} required /></label>
      <label className={styles.field}><span>Date of Test</span><input type="date" name="dateOfTest" value={fields.dateOfTest} onChange={onChange} /></label>
      <label className={styles.field}><span>Lorry No.</span><input name="lorryNo" value={fields.lorryNo} onChange={onChange} /></label>
      <label className={styles.field}><span>Bags</span><input name="bags" value={fields.bags} onChange={onChange} /></label>
      <label className={styles.field}><span>Weight</span><input name="weight" value={fields.weight} onChange={onChange} /></label>
      <label className={styles.field}><span>Condition of Sample</span><input name="conditionOfSample" value={fields.conditionOfSample} onChange={onChange} /></label>
    </div>
  );

  return (
    <div className={styles.shell}>
      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: "", type: "info" })} />
      <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={dismissConfirm} />

      <datalist id="supplier-master-options">{supplierOptions.map((s) => <option value={s} key={s} />)}</datalist>
      <datalist id="sample-type-options">{sampleTypeOptions.map((t) => <option value={t} key={t} />)}</datalist>

      <section className={styles.toolbar}>
        <div>
          <h2 className="text--lg fw-700">Sample Register</h2>
          <p className={styles.muted}>Store entries, update results, and generate reports from saved samples.</p>
        </div>
        <div className={styles.toolbarActions}>
          <Button variant={view === "entry" ? "primary" : "secondary"} onClick={() => setView("entry")}><ButtonLabel label="New Entry" /></Button>
          <Button variant={view === "list" ? "primary" : "secondary"} onClick={() => setView("list")}><ButtonLabel label="Sample List" /></Button>
        </div>
      </section>

      {view === "list" && (
        <section className={styles.statsGrid}>
          <article className={`${styles.statCard} ${styles["statCard--total"]}`}><span>Total Samples</span><strong>{stats.total}</strong></article>
          <article className={`${styles.statCard} ${styles["statCard--pending"]}`}><span>Pending</span><strong>{stats.Pending}</strong></article>
          <article className={`${styles.statCard} ${styles["statCard--tested"]}`}><span>Tested</span><strong>{stats.Tested}</strong></article>
          <article className={`${styles.statCard} ${styles["statCard--reported"]}`}><span>Reported</span><strong>{stats.Reported}</strong></article>
        </section>
      )}

      {view === "entry" && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className="text--md fw-700">Sample Entry Form</h3>
            <p className={styles.muted}>Fields mirror the manual register.</p>
          </div>
          <form onSubmit={handleCreateSample}>
            <FieldGroup fields={form} onChange={(e) => setForm((c) => ({ ...c, [e.target.name]: e.target.value }))} />
            <div className={styles.actions}><Button type="submit"><ButtonLabel label="Save Sample" /></Button></div>
          </form>
        </section>
      )}

      {view === "list" && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className="text--md fw-700">Sample List</h3>
            <div className={styles.toolbarActions}>
              <label className={styles.field}><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Report no., supplier, sample type" /></label>
              <label className={styles.field}><span>Status</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Tested">Tested</option>
                  <option value="Reported">Reported</option>
                </select>
              </label>
              <label className={styles.field}><span>From</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
              <label className={styles.field}><span>To</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
              <div className={styles.filterButton}><Button size="md" variant="secondary" onClick={clearFilters}><ButtonLabel label="Clear Filters" /></Button></div>
              <div className={styles.filterButton}><Button size="md" variant="secondary" onClick={handleExportCsv}><ButtonLabel label="Export CSV" /></Button></div>
              <div className={styles.filterButton}><Button size="md" variant="secondary" onClick={handleExportExcel}><ButtonLabel label="Export Excel" /></Button></div>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Report No.</th><th>Sample No.</th><th>Supplier</th>
                  <th>Sample Type</th><th>Received Date</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="7">Loading samples...</td></tr>
                ) : samples.length === 0 ? (
                  <tr><td colSpan="7">No samples found.</td></tr>
                ) : samples.map((sample) => (
                  <tr key={sample._id} className={selectedSample?._id === sample._id ? styles.rowSelected : ""}>
                    <td>{sample.reportNumber || "-"}</td>
                    <td>{sample.sampleNo || "-"}</td>
                    <td>{sample.supplierName}</td>
                    <td>{sample.sampleReference}</td>
                    <td>{formatDate(sample.dateReceived)}</td>
                    <td><span className={`${styles.status} ${styles[sample.status]}`}>{sample.status}</span></td>
                    <td>
                      <div className={styles.toolbarActions}>
                        <Button size="md" onClick={() => handleSelectSample(sample._id, "tests")}><ButtonLabel label="View / Add Test Results" /></Button>
                        <Button size="md" variant="secondary" onClick={() => handleSelectSample(sample._id, "report")}><ButtonLabel label="Report" /></Button>
                        <Button size="md" variant="secondary" onClick={() => handleDeleteSample(sample._id)}><ButtonLabel label="Delete" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <Button size="md" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ButtonLabel label="Previous" /></Button>
              <span className={styles.muted}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)</span>
              <Button size="md" variant="secondary" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}><ButtonLabel label="Next" /></Button>
            </div>
          )}
        </section>
      )}

      {view === "tests" && selectedSample && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className="text--md fw-700">Test Result Entry</h3>
              <p className={styles.muted}>{selectedSample.reportNumber || "Unnumbered"} / {selectedSample.sampleNo || "No sample no."} / {selectedSample.supplierName} / {selectedSample.sampleReference}</p>
            </div>
            <Button variant="secondary" onClick={() => setView("list")}><ButtonLabel label="Back to List" /></Button>
          </div>
          <div className={styles.detailEditor}>
            <h4 className="text--default fw-700">Sample / Report Details</h4>
            <FieldGroup fields={sampleFields} onChange={(e) => setSampleFields((c) => ({ ...c, [e.target.name]: e.target.value }))} />
            <div className={styles.actions}>
              <Button variant="secondary" onClick={handleSaveSampleFields}><ButtonLabel label="Save Sample Details" /></Button>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead><tr><th>Test</th><th>Value</th><th>Unit</th></tr></thead>
              <tbody>
                {testRows.map((test, index) => (
                  <tr key={`${test.name}-${index}`}>
                    <td>
                      <select value={test.name} onChange={(e) => handleTestChange(index, "name", e.target.value)}>
                        <option value="">Select Test</option>
                        {testNameOptions.map((n) => <option value={n} key={n}>{n}</option>)}
                      </select>
                    </td>
                    <td><input value={test.value} onChange={(e) => handleTestChange(index, "value", e.target.value)} placeholder="Enter value" /></td>
                    <td><input value={test.unit} onChange={(e) => handleTestChange(index, "unit", e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={handleAddCustomTest}><ButtonLabel label="Add Custom Test" /></Button>
            <Button onClick={handleSaveTests}><ButtonLabel label="Save Results" /></Button>
            <Button variant="secondary" onClick={() => setView("report")}><ButtonLabel label="Generate Report" /></Button>
          </div>
        </section>
      )}

      {view === "report" && selectedSample && reportData && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className="text--md fw-700">PDF Report</h3>
              <p className={styles.muted}>{selectedSample.reportNumber || "Unnumbered"} / {selectedSample.sampleNo || "No sample no."} / {selectedSample.supplierName} / {selectedSample.sampleReference}</p>
              <p className={styles.muted}>WhatsApp: {selectedSupplierWhatsApp ? `+${selectedSupplierWhatsApp}` : "No supplier number saved"}</p>
            </div>
            <Button variant="secondary" onClick={() => setView("list")}><ButtonLabel label="Back to List" /></Button>
          </div>
          <div className={styles.reportActions}>
            <ReportDownloadLink reportData={reportData}>
              {({ loading }) => (
                <span className={styles.downloadLink}>
                  <Button disabled={loading} onClick={handleMarkReported}>
                    <ButtonLabel label={loading ? "Preparing PDF" : "Download PDF"} />
                  </Button>
                </span>
              )}
            </ReportDownloadLink>
            <Button variant="secondary" onClick={handleSharePdf}>
              <ButtonLabel label={selectedSupplierWhatsApp ? "Share to Supplier WhatsApp" : "Share on WhatsApp"} />
            </Button>
          </div>
          <Report sample={selectedSample} />
        </section>
      )}
    </div>
  );
}