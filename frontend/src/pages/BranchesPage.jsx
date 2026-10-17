import { useState, useEffect } from 'react';
import { branchAPI } from '../api/services';
import DataTable from '../components/DataTable';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';

const EMPTY_FORM = { name: '', code: '', address: '' };

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  const [editBranch, setEditBranch] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [deleteBranch, setDeleteBranch] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await branchAPI.list();
      setBranches(res.data.results || res.data);
    } catch (err) {
      setError('Failed to load branches');
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
      await branchAPI.create(createForm);
      setSuccess(`Branch "${createForm.name}" created`);
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to create branch'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (b) => {
    setEditBranch(b);
    setEditForm({ name: b.name, code: b.code, address: b.address || '' });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await branchAPI.update(editBranch.id, editForm);
      setSuccess(`Branch "${editForm.name}" updated`);
      setEditBranch(null);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to update branch'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await branchAPI.remove(deleteBranch.id);
      setSuccess(`Branch "${deleteBranch.name}" deleted`);
      setDeleteBranch(null);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to delete branch'));
      setDeleteBranch(null);
    }
  };

  const columns = [
    {
      key: 'name', label: 'Branch',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-700">{row.code?.slice(0, 2)}</span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400 font-mono">{row.code}</p>
          </div>
        </div>
      ),
    },
    { key: 'address', label: 'Address', render: (row) => <span className="text-slate-500 text-xs">{row.address || '—'}</span> },
    {
      key: 'user_count', label: 'Staff',
      render: (row) => (
        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
          {row.user_count ?? 0} users
        </span>
      ),
    },
    {
      key: 'customer_count', label: 'Customers',
      render: (row) => (
        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
          {row.customer_count ?? 0} customers
        </span>
      ),
    },
    {
      key: 'actions', label: '', render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
            <IconEdit />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteBranch(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
            <IconTrash />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Spinner size="lg" text="Loading branches..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Branch Management</h1>
          <p className="text-sm text-slate-500 mt-1">{branches.length} branches</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <IconPlus /> Add Branch
        </button>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="card">
        <DataTable columns={columns} data={branches} emptyMessage="No branches found" />
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Branch">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormInput label="Branch Name" value={createForm.name} onChange={(v) => setCreateForm({...createForm, name: v})} required placeholder="e.g. East Branch" />
          <FormInput label="Branch Code" value={createForm.code} onChange={(v) => setCreateForm({...createForm, code: v.toUpperCase()})} required hint="Unique short code, e.g. EB001" />
          <FormInput label="Address" value={createForm.address} onChange={(v) => setCreateForm({...createForm, address: v})} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating...' : 'Create Branch'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editBranch} onClose={() => setEditBranch(null)} title={`Edit ${editBranch?.name}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <FormInput label="Branch Name" value={editForm.name} onChange={(v) => setEditForm({...editForm, name: v})} required />
          <FormInput label="Branch Code" value={editForm.code} onChange={(v) => setEditForm({...editForm, code: v.toUpperCase()})} required />
          <FormInput label="Address" value={editForm.address} onChange={(v) => setEditForm({...editForm, address: v})} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditBranch(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteBranch}
        title="Delete Branch"
        message={`Permanently delete "${deleteBranch?.name}" (${deleteBranch?.code})? Branches with users, customers, or other records cannot be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteBranch(null)}
        confirmText="Delete Branch"
        variant="danger"
      />
    </div>
  );
}
