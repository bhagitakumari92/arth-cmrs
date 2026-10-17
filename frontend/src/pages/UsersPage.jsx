import { useState, useEffect } from 'react';
import { userAPI, branchAPI } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import DataTable from '../components/DataTable';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';

const EMPTY_CREATE = { username: '', password: '', first_name: '', last_name: '', email: '', role: 'COLLECTION_AGENT', branch: '', phone: '' };
const EMPTY_EDIT = { first_name: '', last_name: '', email: '', role: '', branch: '', phone: '', is_active: true, password: '' };

const ROLE_BADGE = {
  ADMIN: 'bg-violet-100 text-violet-700',
  COLLECTION_AGENT: 'bg-blue-100 text-blue-700',
  BRANCH_MANAGER: 'bg-emerald-100 text-emerald-700',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);

  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);

  const [deleteUser, setDeleteUser] = useState(null);

  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([userAPI.list(), branchAPI.list()]);
      setUsers(usersRes.data.results || usersRes.data);
      setBranches(branchesRes.data.results || branchesRes.data);
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
      await userAPI.create({ ...createForm, branch: createForm.branch || null });
      setSuccess(`User "${createForm.username}" created`);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to create user'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      first_name: u.first_name, last_name: u.last_name, email: u.email,
      role: u.role, branch: u.branch || '', phone: u.phone || '',
      is_active: u.is_active, password: '',
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...editForm, branch: editForm.branch || null };
      if (!payload.password) delete payload.password;
      await userAPI.update(editUser.id, payload);
      setSuccess(`User "${editUser.username}" updated`);
      setEditUser(null);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to update user'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await userAPI.remove(deleteUser.id);
      setSuccess(`User "${deleteUser.username}" deleted`);
      setDeleteUser(null);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to delete user'));
      setDeleteUser(null);
    }
  };

  const toggleActive = async (u) => {
    setError('');
    try {
      await userAPI.update(u.id, { is_active: !u.is_active });
      setSuccess(`User "${u.username}" ${u.is_active ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to update user'));
    }
  };

  const filteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;

  const columns = [
    {
      key: 'username', label: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-700">{row.first_name?.[0]}{row.last_name?.[0]}</span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.first_name} {row.last_name}</p>
            <p className="text-xs text-slate-400 font-mono">@{row.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', label: 'Role',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${ROLE_BADGE[row.role] || 'bg-slate-100 text-slate-600'}`}>
          {row.role_display}
        </span>
      ),
    },
    { key: 'branch_name', label: 'Branch', render: (row) => row.branch_name || <span className="text-slate-400">—</span> },
    { key: 'phone', label: 'Phone', render: (row) => <span className="font-mono text-slate-600">{row.phone || '—'}</span> },
    {
      key: 'is_active', label: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${row.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions', label: '', render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
            <IconEdit />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleActive(row); }}
            className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${row.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
          >
            {row.is_active ? 'Deactivate' : 'Activate'}
          </button>
          {row.id !== currentUser?.id && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteUser(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
              <IconTrash />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <Spinner size="lg" text="Loading users..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">{users.length} system users</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field w-auto text-sm py-2">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="COLLECTION_AGENT">Collection Agent</option>
          </select>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <IconPlus /> Add User
          </button>
        </div>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="card">
        <DataTable columns={columns} data={filteredUsers} emptyMessage="No users found" />
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New User" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Username" value={createForm.username} onChange={(v) => setCreateForm({...createForm, username: v})} required />
            <FormInput label="Password" type="password" value={createForm.password} onChange={(v) => setCreateForm({...createForm, password: v})} required hint="Minimum 6 characters" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="First Name" value={createForm.first_name} onChange={(v) => setCreateForm({...createForm, first_name: v})} required />
            <FormInput label="Last Name" value={createForm.last_name} onChange={(v) => setCreateForm({...createForm, last_name: v})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Email" type="email" value={createForm.email} onChange={(v) => setCreateForm({...createForm, email: v})} />
            <FormInput label="Phone" value={createForm.phone} onChange={(v) => setCreateForm({...createForm, phone: v})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Role" value={createForm.role}
              onChange={(v) => setCreateForm({...createForm, role: v})}
              options={[
                { value: 'COLLECTION_AGENT', label: 'Collection Agent' },
                { value: 'BRANCH_MANAGER', label: 'Branch Manager' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
              required
            />
            <FormSelect
              label="Branch" value={createForm.branch}
              onChange={(v) => setCreateForm({...createForm, branch: v})}
              options={branches.map(b => ({ value: b.id, label: b.name }))}
              placeholder="No branch (admin)"
              hint="Required for agents and managers"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={`Edit User @${editUser?.username}`} wide>
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="First Name" value={editForm.first_name} onChange={(v) => setEditForm({...editForm, first_name: v})} required />
            <FormInput label="Last Name" value={editForm.last_name} onChange={(v) => setEditForm({...editForm, last_name: v})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Email" type="email" value={editForm.email} onChange={(v) => setEditForm({...editForm, email: v})} />
            <FormInput label="Phone" value={editForm.phone} onChange={(v) => setEditForm({...editForm, phone: v})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Role" value={editForm.role}
              onChange={(v) => setEditForm({...editForm, role: v})}
              options={[
                { value: 'COLLECTION_AGENT', label: 'Collection Agent' },
                { value: 'BRANCH_MANAGER', label: 'Branch Manager' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
              required
            />
            <FormSelect
              label="Branch" value={editForm.branch}
              onChange={(v) => setEditForm({...editForm, branch: v})}
              options={branches.map(b => ({ value: b.id, label: b.name }))}
              placeholder="No branch (admin)"
            />
          </div>
          <FormInput
            label="New Password" type="password" value={editForm.password}
            onChange={(v) => setEditForm({...editForm, password: v})}
            hint="Leave blank to keep current password"
          />
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.is_active}
              onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">Account is active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteUser}
        title="Delete User"
        message={`Permanently delete user @${deleteUser?.username} (${deleteUser?.first_name} ${deleteUser?.last_name})? This cannot be undone. If they have related records, deletion will be blocked — consider deactivating instead.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteUser(null)}
        confirmText="Delete User"
        variant="danger"
      />
    </div>
  );
}
