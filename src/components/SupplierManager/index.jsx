import { useEffect, useState } from "react";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "../../services/supplierApi";
import Button, { ButtonLabel } from "../Button";
import styles from "./SupplierManager.module.css";

const emptySupplier = {
  name: "",
  whatsappNumber: "",
  contactPerson: "",
  address: "",
};

export default function SupplierManager({ onSuppliersChanged }) {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptySupplier);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadSuppliers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await getSuppliers({ search });
      setSuppliers(data);
      onSuppliersChanged?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptySupplier);
    setEditingId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await updateSupplier(editingId, form);
        setMessage("Supplier updated.");
      } else {
        await createSupplier(form);
        setMessage("Supplier added.");
      }

      resetForm();
      await loadSuppliers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier._id);
    setForm({
      name: supplier.name || "",
      whatsappNumber: supplier.whatsappNumber || "",
      contactPerson: supplier.contactPerson || "",
      address: supplier.address || "",
    });
  };

  const handleDelete = async (id) => {
    const shouldDelete = window.confirm("Delete this supplier?");

    if (!shouldDelete) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await deleteSupplier(id);
      setMessage("Supplier deleted.");
      await loadSuppliers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.shell}>
      {message && <p className={styles.message}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className="text--lg fw-700">Supplier Master</h2>
            <p>Save supplier names, contact people, and WhatsApp numbers for reports.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Supplier Name</span>
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label className={styles.field}>
              <span>WhatsApp Number</span>
              <input
                name="whatsappNumber"
                value={form.whatsappNumber}
                onChange={handleChange}
                placeholder="919876543210"
              />
            </label>
            <label className={styles.field}>
              <span>Contact Person</span>
              <input name="contactPerson" value={form.contactPerson} onChange={handleChange} />
            </label>
            <label className={styles.field}>
              <span>Address</span>
              <input name="address" value={form.address} onChange={handleChange} />
            </label>
          </div>
          <div className={styles.actions}>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                <ButtonLabel label="Cancel Edit" />
              </Button>
            )}
            <Button type="submit">
              <ButtonLabel label={editingId ? "Update Supplier" : "Add Supplier"} />
            </Button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className="text--md fw-700">Saved Suppliers</h3>
          <label className={styles.field}>
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Supplier name" />
          </label>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>WhatsApp</th>
                <th>Contact Person</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5">Loading suppliers...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan="5">No suppliers found.</td></tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.whatsappNumber || "-"}</td>
                    <td>{supplier.contactPerson || "-"}</td>
                    <td>{supplier.address || "-"}</td>
                    <td>
                      <div className={styles.toolbarActions}>
                        <Button size="md" onClick={() => handleEdit(supplier)}>
                          <ButtonLabel label="Edit" />
                        </Button>
                        <Button size="md" variant="secondary" onClick={() => handleDelete(supplier._id)}>
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
    </div>
  );
}
