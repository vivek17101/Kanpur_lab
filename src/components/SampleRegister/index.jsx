import { pdf } from "@react-pdf/renderer";
import { useCallback, useEffect, useMemo, useState } from "react";
import labData from "../../data/labTests";
import {
  createSample,
  deleteSample,
  getSample,
  getSamples,
  getSampleStats,
  updateSample,
} from "../../services/sampleApi";
import Button, { ButtonLabel } from "../Button";
import Report, {
  getReportDataFromSample,
  ReportDocument,
  ReportDownloadLink,
} from "../Report";
import styles from "./SampleRegister.module.css";

const emptyForm = {
  supplierName: "",
  CO: "",
  toMs: "",
  sampleReference: "",
  dateOfSeal: "",
  dateReceived: new Date().toISOString().split("T")[0],
  lorryNo: "",
  bags: "",
  weight: "",
  conditionOfSample: "",
};

function formatDate(date) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("en-IN");
}

function normalizeTests(sampleTests = []) {
  const testsByName = {};
  sampleTests.forEach((test) => {
    testsByName[test.name] = test;
  });

  const baseTests = labData.map((test) => ({
    name: test.name,
    value: testsByName[test.name]?.value || "",
    unit: testsByName[test.name]?.unit || test.unit || "",
    referenceValue: testsByName[test.name]?.referenceValue || test.referenceValue || "",
  }));

  const customTests = sampleTests.filter(
    (test) => !labData.some((item) => item.name === test.name)
  );

  return [...baseTests, ...customTests];
}

export default function SampleRegister() {
  const [form, setForm] = useState(emptyForm);
  const [samples, setSamples] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    Pending: 0,
    Tested: 0,
    Reported: 0,
  });
  const [selectedSample, setSelectedSample] = useState(null);
  const [sampleFields, setSampleFields] = useState(emptyForm);
  const [testRows, setTestRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [view, setView] = useState("list");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadSamples = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const filterParams = { search, status: statusFilter, startDate, endDate };
      const [data, summary] = await Promise.all([
        getSamples(filterParams),
        getSampleStats({ search, startDate, endDate }),
      ]);
      setSamples(data);
      setStats(summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [endDate, search, startDate, statusFilter]);

  useEffect(() => {
    loadSamples();
  }, [loadSamples]);

  const reportData = useMemo(
    () => getReportDataFromSample(selectedSample),
    [selectedSample]
  );

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
  };

  const handleCreateSample = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const createdSample = await createSample(form);
      setForm(emptyForm);
      setMessage("Sample entry saved.");
      setSelectedSample(createdSample);
      setSampleFields({
        supplierName: createdSample.supplierName || "",
        CO: createdSample.CO || "",
        toMs: createdSample.toMs || "",
        sampleReference: createdSample.sampleReference || "",
        dateOfSeal: createdSample.dateOfSeal ? createdSample.dateOfSeal.split("T")[0] : "",
        dateReceived: createdSample.dateReceived ? createdSample.dateReceived.split("T")[0] : "",
        lorryNo: createdSample.lorryNo || "",
        bags: createdSample.bags || "",
        weight: createdSample.weight || "",
        conditionOfSample: createdSample.conditionOfSample || "",
      });
      setTestRows(normalizeTests(createdSample.tests));
      setView("tests");
      await loadSamples();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectSample = async (id, nextView = "tests") => {
    setMessage("");
    setError("");

    try {
      const sample = await getSample(id);
      setSelectedSample(sample);
      setSampleFields({
        supplierName: sample.supplierName || "",
        CO: sample.CO || "",
        toMs: sample.toMs || "",
        sampleReference: sample.sampleReference || "",
        dateOfSeal: sample.dateOfSeal ? sample.dateOfSeal.split("T")[0] : "",
        dateReceived: sample.dateReceived ? sample.dateReceived.split("T")[0] : "",
        lorryNo: sample.lorryNo || "",
        bags: sample.bags || "",
        weight: sample.weight || "",
        conditionOfSample: sample.conditionOfSample || "",
      });
      setTestRows(normalizeTests(sample.tests));
      setView(nextView);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTestChange = (index, field, value) => {
    setTestRows((current) =>
      current.map((test, itemIndex) =>
        itemIndex === index ? { ...test, [field]: value } : test
      )
    );
  };

  const handleSampleFieldChange = (event) => {
    const { name, value } = event.target;
    setSampleFields((current) => ({ ...current, [name]: value }));
  };

  const handleSaveSampleFields = async () => {
    if (!selectedSample) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const updatedSample = await updateSample(selectedSample._id, sampleFields);
      setSelectedSample(updatedSample);
      setMessage("Sample details saved.");
      await loadSamples();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCustomTest = () => {
    setTestRows((current) => [
      ...current,
      { name: "", value: "", unit: "", referenceValue: "" },
    ]);
  };

  const handleSaveTests = async () => {
    if (!selectedSample) {
      return;
    }

    setMessage("");
    setError("");

    const tests = testRows
      .filter((test) => test.name.trim())
      .map((test) => ({
        ...test,
        name: test.name.trim(),
      }));

    try {
      const updatedSample = await updateSample(selectedSample._id, {
        tests,
        dateOfTest: new Date().toISOString(),
      });
      setSelectedSample(updatedSample);
      setTestRows(normalizeTests(updatedSample.tests));
      setMessage("Test results saved.");
      await loadSamples();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteSample = async (id) => {
    const shouldDelete = window.confirm("Delete this sample entry?");
    if (!shouldDelete) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deleteSample(id);
      if (selectedSample?._id === id) {
        setSelectedSample(null);
        setView("list");
      }
      setMessage("Sample deleted.");
      await loadSamples();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkReported = async () => {
    if (!selectedSample) {
      return;
    }

    try {
      const updatedSample = await updateSample(selectedSample._id, {
        status: "Reported",
      });
      setSelectedSample(updatedSample);
      setMessage("Sample marked as reported.");
      await loadSamples();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSharePdf = async () => {
    if (!reportData) {
      return;
    }

    const fileName = `${(reportData.reportNumber || reportData.supplierName || "sample-report").replace(/[\s/]+/g, "-")}.pdf`;
    const blob = await pdf(<ReportDocument reportData={reportData} />).toBlob();
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "Kanpur Laboratory Report",
        text: `Test report ${reportData.reportNumber || ""} for ${reportData.supplierName}`.trim(),
        files: [file],
      });
      await handleMarkReported();
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `Kanpur Laboratory report ${reportData.reportNumber || ""} generated for ${reportData.supplierName}. Please attach the downloaded PDF.`
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
    await handleMarkReported();
  };

  return (
    <div className={styles.shell}>
      <section className={styles.toolbar}>
        <div>
          <h2 className="text--lg fw-700">Sample Register</h2>
          <p className={styles.muted}>Store entries, update results, and generate reports from saved samples.</p>
        </div>
        <div className={styles.toolbarActions}>
          <Button variant={view === "entry" ? "primary" : "secondary"} onClick={() => setView("entry")}>
            <ButtonLabel label="New Entry" />
          </Button>
          <Button variant={view === "list" ? "primary" : "secondary"} onClick={() => setView("list")}>
            <ButtonLabel label="Sample List" />
          </Button>
        </div>
      </section>

      {message && <p className={styles.message}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {view === "list" && (
        <section className={styles.statsGrid}>
          <article className={styles.statCard}>
            <span>Total Samples</span>
            <strong>{stats.total}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Pending</span>
            <strong>{stats.Pending}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Tested</span>
            <strong>{stats.Tested}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Reported</span>
            <strong>{stats.Reported}</strong>
          </article>
        </section>
      )}

      {view === "entry" && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className="text--md fw-700">Sample Entry Form</h3>
            <p className={styles.muted}>Fields mirror the manual register.</p>
          </div>
          <form onSubmit={handleCreateSample}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Supplier Name</span>
                <input name="supplierName" value={form.supplierName} onChange={handleFormChange} required />
              </label>
              <label className={styles.field}>
                <span>C/o</span>
                <input name="CO" value={form.CO} onChange={handleFormChange} />
              </label>
              <label className={styles.field}>
                <span>To M/s</span>
                <input name="toMs" value={form.toMs} onChange={handleFormChange} />
              </label>
              <label className={styles.field}>
                <span>Sample Reference</span>
                <input name="sampleReference" value={form.sampleReference} onChange={handleFormChange} required />
              </label>
              <label className={styles.field}>
                <span>Date of Seal</span>
                <input type="date" name="dateOfSeal" value={form.dateOfSeal} onChange={handleFormChange} />
              </label>
              <label className={styles.field}>
                <span>Date Received</span>
                <input type="date" name="dateReceived" value={form.dateReceived} onChange={handleFormChange} required />
              </label>
              <label className={styles.field}>
                <span>Lorry No.</span>
                <input name="lorryNo" value={form.lorryNo} onChange={handleFormChange} />
              </label>
              <label className={styles.field}>
                <span>Bags</span>
                <input name="bags" value={form.bags} onChange={handleFormChange} />
              </label>
              <label className={styles.field}>
                <span>Weight</span>
                <input name="weight" value={form.weight} onChange={handleFormChange} />
              </label>
              <label className={styles.field}>
                <span>Condition of Sample</span>
                <input name="conditionOfSample" value={form.conditionOfSample} onChange={handleFormChange} />
              </label>
            </div>
            <div className={styles.actions}>
              <Button type="submit">
                <ButtonLabel label="Save Sample" />
              </Button>
            </div>
          </form>
        </section>
      )}

      {view === "list" && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className="text--md fw-700">Sample List</h3>
            <div className={styles.toolbarActions}>
              <label className={styles.field}>
                <span>Search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Report no., supplier, reference" />
              </label>
              <label className={styles.field}>
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Tested">Tested</option>
                  <option value="Reported">Reported</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>From</span>
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>To</span>
                <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
              <div className={styles.filterButton}>
                <Button size="md" variant="secondary" onClick={clearFilters}>
                  <ButtonLabel label="Clear Filters" />
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Report No.</th>
                  <th>Supplier</th>
                  <th>Reference</th>
                  <th>Received Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6">Loading samples...</td></tr>
                ) : samples.length === 0 ? (
                  <tr><td colSpan="6">No samples found.</td></tr>
                ) : (
                  samples.map((sample) => (
                    <tr key={sample._id}>
                      <td>{sample.reportNumber || "-"}</td>
                      <td>{sample.supplierName}</td>
                      <td>{sample.sampleReference}</td>
                      <td>{formatDate(sample.dateReceived)}</td>
                      <td><span className={`${styles.status} ${styles[sample.status]}`}>{sample.status}</span></td>
                      <td>
                        <div className={styles.toolbarActions}>
                          <Button size="md" onClick={() => handleSelectSample(sample._id, "tests")}>
                            <ButtonLabel label="View / Add Test Results" />
                          </Button>
                          <Button size="md" variant="secondary" onClick={() => handleSelectSample(sample._id, "report")}>
                            <ButtonLabel label="Report" />
                          </Button>
                          <Button size="md" variant="secondary" onClick={() => handleDeleteSample(sample._id)}>
                            <ButtonLabel label="Delete" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view === "tests" && selectedSample && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className="text--md fw-700">Test Result Entry</h3>
              <p className={styles.muted}>{selectedSample.reportNumber || "Unnumbered"} / {selectedSample.supplierName} / {selectedSample.sampleReference}</p>
            </div>
            <Button variant="secondary" onClick={() => setView("list")}>
              <ButtonLabel label="Back to List" />
            </Button>
          </div>
          <div className={styles.detailEditor}>
            <h4 className="text--default fw-700">Sample / Report Details</h4>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Supplier Name</span>
                <input name="supplierName" value={sampleFields.supplierName} onChange={handleSampleFieldChange} required />
              </label>
              <label className={styles.field}>
                <span>C/o</span>
                <input name="CO" value={sampleFields.CO} onChange={handleSampleFieldChange} />
              </label>
              <label className={styles.field}>
                <span>To M/s</span>
                <input name="toMs" value={sampleFields.toMs} onChange={handleSampleFieldChange} />
              </label>
              <label className={styles.field}>
                <span>Sample Reference</span>
                <input name="sampleReference" value={sampleFields.sampleReference} onChange={handleSampleFieldChange} required />
              </label>
              <label className={styles.field}>
                <span>Date of Seal</span>
                <input type="date" name="dateOfSeal" value={sampleFields.dateOfSeal} onChange={handleSampleFieldChange} />
              </label>
              <label className={styles.field}>
                <span>Date Received</span>
                <input type="date" name="dateReceived" value={sampleFields.dateReceived} onChange={handleSampleFieldChange} required />
              </label>
              <label className={styles.field}>
                <span>Lorry No.</span>
                <input name="lorryNo" value={sampleFields.lorryNo} onChange={handleSampleFieldChange} />
              </label>
              <label className={styles.field}>
                <span>Bags</span>
                <input name="bags" value={sampleFields.bags} onChange={handleSampleFieldChange} />
              </label>
              <label className={styles.field}>
                <span>Weight</span>
                <input name="weight" value={sampleFields.weight} onChange={handleSampleFieldChange} />
              </label>
              <label className={styles.field}>
                <span>Condition of Sample</span>
                <input name="conditionOfSample" value={sampleFields.conditionOfSample} onChange={handleSampleFieldChange} />
              </label>
            </div>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={handleSaveSampleFields}>
                <ButtonLabel label="Save Sample Details" />
              </Button>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Reference Value</th>
                </tr>
              </thead>
              <tbody>
                {testRows.map((test, index) => (
                  <tr key={`${test.name}-${index}`}>
                    <td>
                      <input value={test.name} onChange={(event) => handleTestChange(index, "name", event.target.value)} />
                    </td>
                    <td>
                      <input value={test.value} onChange={(event) => handleTestChange(index, "value", event.target.value)} placeholder="Enter value" />
                    </td>
                    <td>
                      <input value={test.unit} onChange={(event) => handleTestChange(index, "unit", event.target.value)} />
                    </td>
                    <td>
                      <input
                        value={Array.isArray(test.referenceValue) ? test.referenceValue.join(", ") : test.referenceValue}
                        onChange={(event) => handleTestChange(index, "referenceValue", event.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={handleAddCustomTest}>
              <ButtonLabel label="Add Custom Test" />
            </Button>
            <Button onClick={handleSaveTests}>
              <ButtonLabel label="Save Results" />
            </Button>
            <Button variant="secondary" onClick={() => setView("report")}>
              <ButtonLabel label="Generate Report" />
            </Button>
          </div>
        </section>
      )}

      {view === "report" && selectedSample && reportData && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className="text--md fw-700">PDF Report</h3>
              <p className={styles.muted}>{selectedSample.reportNumber || "Unnumbered"} / {selectedSample.supplierName} / {selectedSample.sampleReference}</p>
            </div>
            <Button variant="secondary" onClick={() => setView("list")}>
              <ButtonLabel label="Back to List" />
            </Button>
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
              <ButtonLabel label="Share on WhatsApp" />
            </Button>
          </div>
          <Report sample={selectedSample} />
        </section>
      )}
    </div>
  );
}
