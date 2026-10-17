import { useState, useEffect } from 'react';
import { depositAPI } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { IconPlus, IconBank } from '../components/Icons';

export default function DepositsPage() {
  const { user, loading: authLoading } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [approvedSubs, setApprovedSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [depositForm, setDepositForm] = useState({
    bank_name: '', deposit_date: '', amount: '', bank_reference: '', submission: ''
  });
  const [settleForm, setSettleForm] = useState({ settled_amount: '', status: 'SETTLED', notes: '' });

  const canDeposit = user?.role === 'BRANCH_MANAGER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [statusFilter, authLoading, user?.role]);

  const loadData = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [depRes, subsRes] = await Promise.all([
        depositAPI.list(params),
        (user?.role === 'BRANCH_MANAGER' || user?.role === 'ADMIN')
          ? depositAPI.approvedSubmissions()
          : Promise.resolve({ data: [] }),
      ]);
      setDeposits(depRes.data.results || depRes.data);
      setApprovedSubs(subsRes.data.results || subsRes.data || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await depositAPI.create(depositForm);
      setSuccess('Bank deposit created successfully');
      setShowDepositForm(false);
      setDepositForm({ bank_name: '', deposit_date: '', amount: '', bank_reference: '', submission: '' });
      loadData();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.submission) setError(errData.submission.join(', '));
      else if (errData?.bank_reference) setError(errData.bank_reference.join(', '));
      else setError(JSON.stringify(errData) || 'Failed to create deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await depositAPI.settle(selectedDeposit.id, settleForm);
      setSuccess(`Deposit marked as ${settleForm.status.toLowerCase()}`);
      setSelectedDeposit(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Settlement failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const selectedSubmission = approvedSubs.find(s => s.id === parseInt(depositForm.submission));

  // Auto-fill amount from selected submission
  useEffect(() => {
    if (selectedSubmission?.actual_amount) {
      setDepositForm(f => ({ ...f, amount: selectedSubmission.actual_amount }));
    }
  }, [depositForm.submission]);

  const liveMismatch = selectedDeposit && settleForm.settled_amount !== ''
    ? Number(settleForm.settled_amount) - Number(selectedDeposit.amount)
    : 0;

  const columns = [
    { key: 'bank_reference', label: 'Reference', render: (row) => <span className="font-mono text-xs font-medium text-indigo-600">{row.bank_reference}</span> },
    { key: 'bank_name', label: 'Bank', render: (row) => <span className="font-medium text-slate-900">{row.bank_name}</span> },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-slate-900">{formatINR(row.amount)}</span> },
    { key: 'deposit_date', label: 'Date' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'settled_amount', label: 'Settled', render: (row) => row.settled_amount ? formatINR(row.settled_amount) : <span className="text-slate-400">—</span> },
    { key: 'settlement_mismatch', label: 'Mismatch', render: (row) => {
      if (row.settlement_mismatch === null || row.settlement_mismatch === undefined) return <span className="text-slate-400">—</span>;
      const m = Number(row.settlement_mismatch);
      return (
        <span className={`font-semibold ${m !== 0 ? 'text-red-600' : 'text-slate-600'}`}>
          {m > 0 ? '+' : ''}{formatINR(row.settlement_mismatch)}
        </span>
      );
    }},
    {
      key: 'actions', label: '', render: (row) => (
        row.status === 'PENDING' && (user?.role === 'BRANCH_MANAGER' || user?.role === 'ADMIN') ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDeposit(row);
              setSettleForm({ settled_amount: row.amount, status: 'SETTLED', notes: '' });
            }}
            className="btn-primary btn-sm"
          >
            Settle
          </button>
        ) : null
      )
    },
  ];

  if (authLoading || loading) return <Spinner size="lg" text="Loading deposits..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Bank Deposits</h1>
          <p className="text-sm text-slate-500 mt-1">{deposits.length} deposits on record</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto text-sm py-2"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SETTLED">Settled</option>
            <option value="FAILED">Failed</option>
            <option value="DELAYED">Delayed</option>
          </select>
          {canDeposit && approvedSubs.length > 0 && (
            <button onClick={() => setShowDepositForm(true)} className="btn-primary">
              <IconPlus /> Create Deposit
            </button>
          )}
        </div>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      {canDeposit && approvedSubs.length === 0 && (
        <div className="card border-blue-200/70 bg-blue-50/40 p-4 flex items-start gap-3">
          <IconBank className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">No approved cash awaiting deposit</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Once you approve agent submissions in Reconciliation, they'll appear here for deposit creation.
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={deposits} emptyMessage="No deposits found" />
      </div>

      {/* Create deposit modal */}
      <Modal isOpen={showDepositForm} onClose={() => setShowDepositForm(false)} title="Create Bank Deposit">
        <form onSubmit={handleCreateDeposit} className="space-y-4">
          <FormSelect
            label="Approved Submission"
            value={depositForm.submission}
            onChange={(v) => setDepositForm({...depositForm, submission: v})}
            options={approvedSubs.map(s => ({
              value: s.id,
              label: `#${s.id} — ${s.agent_name} — ${formatINR(s.actual_amount)}`
            }))}
            required hint="Only approved, undeposited submissions are shown"
          />
          {selectedSubmission && (
            <div className="bg-slate-50 rounded-xl p-3.5 text-sm">
              <span className="text-slate-500">Deposit amount auto-filled from submission:</span>
              <span className="ml-2 font-semibold text-slate-900">{formatINR(selectedSubmission.actual_amount)}</span>
            </div>
          )}
          <FormInput label="Bank Name" value={depositForm.bank_name} onChange={(v) => setDepositForm({...depositForm, bank_name: v})} required placeholder="e.g. State Bank of India" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Deposit Date" type="date" value={depositForm.deposit_date} onChange={(v) => setDepositForm({...depositForm, deposit_date: v})} required />
            <FormInput label="Amount (₹)" type="number" step="0.01" min="0.01" value={depositForm.amount} onChange={(v) => setDepositForm({...depositForm, amount: v})} required />
          </div>
          <FormInput
            label="Bank Reference" value={depositForm.bank_reference}
            onChange={(v) => setDepositForm({...depositForm, bank_reference: v})}
            required hint="Must be unique — e.g. bank slip / UTR number"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowDepositForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Deposit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Settle deposit modal */}
      <Modal isOpen={!!selectedDeposit} onClose={() => setSelectedDeposit(null)} title={`Settle Deposit ${selectedDeposit?.bank_reference}`}>
        {selectedDeposit && (
          <form onSubmit={handleSettle} className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Bank</p>
                <p className="font-semibold text-slate-900">{selectedDeposit.bank_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Deposit Amount</p>
                <p className="font-bold text-slate-900">{formatINR(selectedDeposit.amount)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <span className="text-amber-500 text-sm">⚠</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                Settlement is <strong>simulated</strong> for demonstration. In production this would be confirmed via a bank API or statement reconciliation.
              </p>
            </div>

            <FormInput
              label="Actual Settled Amount (₹)" type="number" step="0.01" min="0"
              value={settleForm.settled_amount}
              onChange={(v) => setSettleForm({...settleForm, settled_amount: v})}
              required
            />

            {settleForm.settled_amount !== '' && liveMismatch !== 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                <p className="text-sm font-semibold text-red-700">
                  Settlement mismatch: {liveMismatch > 0 ? '+' : ''}{formatINR(liveMismatch)}
                </p>
                <p className="text-xs text-red-600 mt-0.5">The settled amount differs from the deposit amount</p>
              </div>
            )}

            <FormSelect
              label="Settlement Status" value={settleForm.status}
              onChange={(v) => setSettleForm({...settleForm, status: v})}
              options={[
                { value: 'SETTLED', label: 'Settled — funds received' },
                { value: 'DELAYED', label: 'Delayed — still in transit' },
                { value: 'FAILED', label: 'Failed — deposit rejected' },
              ]}
              required
            />
            <FormInput label="Notes" value={settleForm.notes} onChange={(v) => setSettleForm({...settleForm, notes: v})} hint="e.g. bank charges deducted" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setSelectedDeposit(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-success">
                {submitting ? 'Processing...' : 'Confirm Settlement'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
