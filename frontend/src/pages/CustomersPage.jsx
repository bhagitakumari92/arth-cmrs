import { useState, useEffect } from 'react';
import { customerAPI, branchAPI } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import DataTable from '../components/DataTable';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';

const EMPTY_FORM = { first_name: '', last_name: '', phone: '', email: '', address: '', branch: '' };

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [deleteCustomer, setDeleteCustomer] = useState(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER';
  const canDelete = user?.role === 'ADMIN';

  useEffect(() => { loadData(); }, [search]);

  const loadData = async () => {
    try {
      const params = search ? { search } : {};
      const [custRes, branchRes] = await Promise.all([customerAPI.list(params), branchAPI.list()]);
      setCustomers(custRes.data.results || custRes.data);
      setBranches(branchRes.data.results || branchRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const parseError = (err, fallback) => {
    const d = err.response?.data;
    if (!d) return fallback;
    if (d.error) return d.error;
    if (d.detail) return d.detail;
    if (typeof d === 'object') return Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join(' | ');
    return fallback;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await customerAPI.create(createForm);
      setSuccess('Customer created successfully');
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to create customer'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c) => {
    setEditCustomer(c);
    setEditForm({
      first_name: c.first_name, last_name: c.last_name, phone: c.phone,
      email: c.email || '', address: c.address, branch: c.branch,
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await customerAPI.update(editCustomer.id, editForm);
      setSuccess('Customer updated successfully');
      setEditCustomer(null);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to update customer'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await customerAPI.remove(deleteCustomer.id);
      setSuccess(`Customer "${deleteCustomer.full_name}" deleted`);
      setDeleteCustomer(null);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to delete customer'));
      setDeleteCustomer(null);
    }
  };

  const columns = [
    {
      key: 'full_name', label: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.full_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{row.email || '—'}</p>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (row) => <span className="font-mono text-slate-600">{row.phone}</span> },
    { key: 'address', label: 'Address', render: (row) => <span className="text-slate-500 text-xs">{row.address}</span> },
    {
      key: 'branch_name', label: 'Branch',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
          {row.branch_name}
        </span>
      ),
    },
    ...(canManage ? [{
      key: 'actions', label: '', render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
            <IconEdit />
          </button>
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteCustomer(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
              <IconTrash />
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  if (loading) return <Spinner size="lg" text="Loading customers..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">{customers.length} registered customers</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="input-field w-auto text-sm py-2"
          />
          {canManage && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <IconPlus /> Add Customer
            </button>
          )}
        </div>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="card">
        <DataTable columns={columns} data={customers} emptyMessage="No customers found" />
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Customer">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="First Name" value={createForm.first_name} onChange={(v) => setCreateForm({...createForm, first_name: v})} required />
            <FormInput label="Last Name" value={createForm.last_name} onChange={(v) => setCreateForm({...createForm, last_name: v})} required />
          </div>
          <FormInput label="Phone" value={createForm.phone} onChange={(v) => setCreateForm({...createForm, phone: v})} required hint="10-digit mobile number" />
          <FormInput label="Email" type="email" value={createForm.email} onChange={(v) => setCreateForm({...createForm, email: v})} />
          <FormInput label="Address" value={createForm.address} onChange={(v) => setCreateForm({...createForm, address: v})} required />
          <FormSelect
            label="Branch" value={createForm.branch}
            onChange={(v) => setCreateForm({...createForm, branch: v})}
            options={branches.map(b => ({ value: b.id, label: b.name }))}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating...' : 'Create Customer'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editCustomer} onClose={() => setEditCustomer(null)} title={`Edit ${editCustomer?.full_name}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="First Name" value={editForm.first_name} onChange={(v) => setEditForm({...editForm, first_name: v})} required />
            <FormInput label="Last Name" value={editForm.last_name} onChange={(v) => setEditForm({...editForm, last_name: v})} required />
          </div>
          <FormInput label="Phone" value={editForm.phone} onChange={(v) => setEditForm({...editForm, phone: v})} required />
          <FormInput label="Email" type="email" value={editForm.email} onChange={(v) => setEditForm({...editForm, email: v})} />
          <FormInput label="Address" value={editForm.address} onChange={(v) => setEditForm({...editForm, address: v})} required />
          <FormSelect
            label="Branch" value={editForm.branch}
            onChange={(v) => setEditForm({...editForm, branch: v})}
            options={branches.map(b => ({ value: b.id, label: b.name }))}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditCustomer(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteCustomer}
        title="Delete Customer"
        message={`Permanently delete ${deleteCustomer?.full_name}? Customers with loans cannot be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteCustomer(null)}
        confirmText="Delete Customer"
        variant="danger"
      />
    </div>
  );
}
