import { useCallback, useEffect, useState } from 'react';
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from '../../services/supplierApi';
import Button, { ButtonLabel } from '../Button';
import ConfirmModal from '../ConfirmModal';
import Toast from '../Toast';
import styles from './SupplierManager.module.css';

const emptySupplier = { name: '', whatsappNumber: '', contactPerson: '', address: '' };

export default function SupplierManager({ onSuppliersChanged }) {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptySupplier);
  const [editingId, setEditingId] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [confirm, setConfirm] = useState({ message: '', onConfirm: null });

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);
  const normalizedName = form.name.trim().toLowerCase();
  const duplicateSupplier = suppliers.find(
    (supplier) => supplier.name.trim().toLowerCase() === normalizedName && supplier._id !== editingId
  );

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSuppliers({ search });
      setSuppliers(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadSuppliers();
  }, [search, loadSuppliers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptySupplier);
    setEditingId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (duplicateSupplier) {
      showToast('This supplier already exists. Use Edit to update the saved supplier.', 'warning');
      return;
    }

    try {
      if (editingId) {
        await updateSupplier(editingId, form);
        showToast('Supplier updated.', 'success');
      } else {
        await createSupplier(form);
        showToast('Supplier added.', 'success');
      }
      onSuppliersChanged?.();
      resetForm();
      await loadSuppliers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier._id);
    setForm({
      name: supplier.name || '',
      whatsappNumber: supplier.whatsappNumber || '',
      contactPerson: supplier.contactPerson || '',
      address: supplier.address || '',
    });
  };

  const handleDelete = (id) => {
    setConfirm({
      message: 'Delete this supplier? This cannot be undone.',
      onConfirm: async () => {
        setConfirm({ message: '', onConfirm: null });
        try {
          await deleteSupplier(id);
          showToast('Supplier deleted.', 'info');
          onSuppliersChanged?.();
          await loadSuppliers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  return (
    <div className={styles.shell}>
      <Toast
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ message: '', type: 'info' })}
      />
      <ConfirmModal
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ message: '', onConfirm: null })}
      />

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
          {duplicateSupplier && (
            <div className={styles.inlineWarning}>
              <strong>Supplier already exists.</strong>
              <span>Open the saved row below and use Edit to change contact details.</span>
            </div>
          )}
          <div className={styles.actions}>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                <ButtonLabel label="Cancel Edit" />
              </Button>
            )}
            <Button type="submit" disabled={Boolean(duplicateSupplier)}>
              <ButtonLabel label={editingId ? 'Update Supplier' : 'Add Supplier'} />
            </Button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className="text--md fw-700">Saved Suppliers</h3>
          <label className={styles.field}>
            <span>Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Supplier name"
            />
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
                <tr>
                  <td colSpan="5">Loading suppliers...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="5">No suppliers found.</td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.whatsappNumber || '-'}</td>
                    <td>{supplier.contactPerson || '-'}</td>
                    <td>{supplier.address || '-'}</td>
                    <td>
                      <div className={styles.toolbarActions}>
                        <Button size="md" onClick={() => handleEdit(supplier)}>
                          <ButtonLabel label="Edit" />
                        </Button>
                        <Button
                          size="md"
                          variant="secondary"
                          onClick={() => handleDelete(supplier._id)}
                        >
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
