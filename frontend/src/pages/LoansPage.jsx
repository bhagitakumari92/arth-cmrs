import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanAPI, customerAPI, userAPI } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';

const EMPTY_FORM = {
  customer: '', assigned_agent: '', principal_amount: '',
  tenure_months: '', monthly_installment: '', disbursement_date: ''
};

export default function LoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  const [editLoan, setEditLoan] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [deleteLoan, setDeleteLoan] = useState(null);

  const navigate = useNavigate();
  const canManage = user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER';

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [loansRes, custRes, agentsRes] = await Promise.all([
        loanAPI.list(params), customerAPI.list(), userAPI.agents(),
      ]);
      setLoans(loansRes.data.results || loansRes.data);
      setCustomers(custRes.data.results || custRes.data);
      setAgents(agentsRes.data.results || agentsRes.data);
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
      const customer = customers.find(c => c.id === parseInt(createForm.customer));
      await loanAPI.create({
        ...createForm,
        branch: customer?.branch,
        tenure_months: parseInt(createForm.tenure_months),
      });
      setSuccess('Loan created successfully');
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to create loan'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (loan) => {
    setEditLoan(loan);
    setEditForm({
      customer: loan.customer, assigned_agent: loan.assigned_agent,
      principal_amount: loan.principal_amount, tenure_months: loan.tenure_months,
      monthly_installment: loan.monthly_installment, disbursement_date: loan.disbursement_date,
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const customer = customers.find(c => c.id === parseInt(editForm.customer));
      await loanAPI.update(editLoan.id, {
        ...editForm,
        branch: customer?.branch || editLoan.branch,
        tenure_months: parseInt(editForm.tenure_months),
      });
      setSuccess(`Loan #${editLoan.id} updated`);
      setEditLoan(null);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to update loan'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      await loanAPI.remove(deleteLoan.id);
      setSuccess(`Loan #${deleteLoan.id} deleted`);
      setDeleteLoan(null);
      loadData();
    } catch (err) {
      setError(parseError(err, 'Failed to delete loan'));
      setDeleteLoan(null);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const columns = [
    { key: 'id', label: 'Loan', render: (row) => <span className="font-semibold text-indigo-600">#{row.id}</span> },
    { key: 'customer_name', label: 'Customer', render: (row) => <span className="font-medium text-slate-900">{row.customer_name}</span> },
    { key: 'branch_name', label: 'Branch' },
    { key: 'agent_name', label: 'Agent' },
    { key: 'principal_amount', label: 'Principal', render: (row) => <span className="font-medium">{formatINR(row.principal_amount)}</span> },
    {
      key: 'outstanding_amount', label: 'Outstanding', render: (row) => (
        <span className={`font-semibold ${Number(row.outstanding_amount) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {formatINR(row.outstanding_amount)}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ...(canManage ? [{
      key: 'actions', label: '', render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
            <IconEdit />
          </button>
          {!row.has_collections && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteLoan(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
              <IconTrash />
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  if (loading) return <Spinner size="lg" text="Loading loans..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="text-sm text-slate-500 mt-1">{loans.length} loans in portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto text-sm py-2">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
          {canManage && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <IconPlus /> Create Loan
            </button>
          )}
        </div>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="card">
        <DataTable
          columns={columns}
          data={loans}
          onRowClick={(row) => navigate(`/loans/${row.id}`)}
          emptyMessage="No loans found"
        />
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Loan" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Customer" value={createForm.customer}
              onChange={(v) => setCreateForm({...createForm, customer: v})}
              options={customers.map(c => ({ value: c.id, label: `${c.full_name} (${c.branch_name})` }))}
              required
            />
            <FormSelect
              label="Agent" value={createForm.assigned_agent}
              onChange={(v) => setCreateForm({...createForm, assigned_agent: v})}
              options={agents.map(a => ({ value: a.id, label: `${a.first_name} ${a.last_name} (${a.branch_name})` }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Principal Amount (₹)" type="number" step="0.01" min="1" value={createForm.principal_amount} onChange={(v) => setCreateForm({...createForm, principal_amount: v})} required />
            <FormInput label="Tenure (Months)" type="number" min="1" value={createForm.tenure_months} onChange={(v) => setCreateForm({...createForm, tenure_months: v})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Monthly Installment (₹)" type="number" step="0.01" min="0.01" value={createForm.monthly_installment} onChange={(v) => setCreateForm({...createForm, monthly_installment: v})} required />
            <FormInput label="Disbursement Date" type="date" value={createForm.disbursement_date} onChange={(v) => setCreateForm({...createForm, disbursement_date: v})} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating...' : 'Create Loan'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editLoan} onClose={() => setEditLoan(null)} title={`Edit Loan #${editLoan?.id}`} wide>
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Customer" value={editForm.customer}
              onChange={(v) => setEditForm({...editForm, customer: v})}
              options={customers.map(c => ({ value: c.id, label: `${c.full_name} (${c.branch_name})` }))}
              required
            />
            <FormSelect
              label="Agent" value={editForm.assigned_agent}
              onChange={(v) => setEditForm({...editForm, assigned_agent: v})}
              options={agents.map(a => ({ value: a.id, label: `${a.first_name} ${a.last_name} (${a.branch_name})` }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Principal Amount (₹)" type="number" step="0.01" min="1"
              value={editForm.principal_amount} onChange={(v) => setEditForm({...editForm, principal_amount: v})}
              required
              hint={editLoan?.has_collections ? 'Locked — collections exist for this loan' : undefined}
              disabled={editLoan?.has_collections}
            />
            <FormInput label="Tenure (Months)" type="number" min="1" value={editForm.tenure_months} onChange={(v) => setEditForm({...editForm, tenure_months: v})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Monthly Installment (₹)" type="number" step="0.01" min="0.01" value={editForm.monthly_installment} onChange={(v) => setEditForm({...editForm, monthly_installment: v})} required />
            <FormInput label="Disbursement Date" type="date" value={editForm.disbursement_date} onChange={(v) => setEditForm({...editForm, disbursement_date: v})} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditLoan(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteLoan}
        title="Delete Loan"
        message={`Permanently delete Loan #${deleteLoan?.id} for ${deleteLoan?.customer_name} (${formatINR(deleteLoan?.principal_amount)})? Its repayment schedule will also be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteLoan(null)}
        confirmText="Delete Loan"
        variant="danger"
      />
    </div>
  );
}
