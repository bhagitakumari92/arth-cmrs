import { useState, useEffect } from 'react';
import { reconciliationAPI, submissionAPI } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { IconWarning } from '../components/Icons';

export default function ReconciliationPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);
  const [reconcileForm, setReconcileForm] = useState({ actual_amount: '', discrepancy_notes: '', action: 'approve' });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await reconciliationAPI.list(params);
      setSubmissions(res.data.results || res.data);
    } catch (err) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submissionAPI.reconcile(selectedSub.id, {
        actual_amount: reconcileForm.actual_amount,
        action: reconcileForm.action,
        discrepancy_notes: reconcileForm.discrepancy_notes,
      });
      setSuccess(`Submission ${reconcileForm.action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setSelectedSub(null);
      setReconcileForm({ actual_amount: '', discrepancy_notes: '', action: 'approve' });
      loadData();
    } catch (err) {
      const errData = err.response?.data;
      setError(errData?.error || errData?.non_field_errors?.join(', ') || 'Reconciliation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openReconcile = (sub) => {
    setSelectedSub(sub);
    setReconcileForm({ actual_amount: sub.expected_amount, discrepancy_notes: '', action: 'approve' });
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const liveDifference = selectedSub
    ? Number(reconcileForm.actual_amount || 0) - Number(selectedSub.expected_amount)
    : 0;

  const columns = [
    { key: 'id', label: 'Submission', render: (row) => <span className="font-semibold text-indigo-600">#{row.id}</span> },
    { key: 'agent_name', label: 'Agent', render: (row) => <span className="font-medium text-slate-900">{row.agent_name}</span> },
    { key: 'expected_amount', label: 'Expected', render: (row) => <span className="font-medium">{formatINR(row.expected_amount)}</span> },
    { key: 'actual_amount', label: 'Actual', render: (row) => row.actual_amount ? formatINR(row.actual_amount) : <span className="text-slate-400">—</span> },
    { key: 'difference', label: 'Difference', render: (row) => {
      if (row.difference === null || row.difference === undefined) return <span className="text-slate-400">—</span>;
      const diff = Number(row.difference);
      return (
        <span className={`font-semibold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
          {diff > 0 ? '+' : ''}{formatINR(row.difference)}
        </span>
      );
    }},
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'submission_date', label: 'Date' },
    {
      key: 'actions', label: '', render: (row) => (
        row.status === 'PENDING' && (user?.role === 'BRANCH_MANAGER' || user?.role === 'ADMIN') ? (
          <button
            onClick={(e) => { e.stopPropagation(); openReconcile(row); }}
            className="btn-primary btn-sm"
          >
            Reconcile
          </button>
        ) : null
      )
    },
  ];

  if (loading) return <Spinner size="lg" text="Loading reconciliation queue..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Branch Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-1">Verify cash submissions from collection agents</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="APPROVED_WITH_DISCREPANCY">With Discrepancy</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="card">
        <DataTable columns={columns} data={submissions} emptyMessage="No submissions to reconcile" />
      </div>

      {/* Reconciliation modal */}
      <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title={`Reconcile Submission #${selectedSub?.id}`} wide>
        {selectedSub && (
          <div className="space-y-5">
            {/* Submission info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-3.5">
                <p className="text-xs text-slate-500">Agent</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{selectedSub.agent_name}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5">
                <p className="text-xs text-slate-500">Branch</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{selectedSub.branch_name}</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3.5">
                <p className="text-xs text-indigo-600">Expected Amount</p>
                <p className="text-sm font-bold text-indigo-700 mt-0.5">{formatINR(selectedSub.expected_amount)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5">
                <p className="text-xs text-slate-500">Date</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{selectedSub.submission_date}</p>
              </div>
            </div>

            {/* Collections breakdown */}
            {selectedSub.collection_mappings?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Included Collections ({selectedSub.collection_mappings.length})
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedSub.collection_mappings.map((m) => (
                    <div key={m.id} className="flex justify-between items-center px-4 py-2.5 bg-white">
                      <span className="text-sm font-mono text-slate-600">{m.collection_receipt}</span>
                      <span className="text-sm font-semibold text-slate-900">{formatINR(m.collection_amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50">
                    <span className="text-sm font-semibold text-slate-700">Total</span>
                    <span className="text-sm font-bold text-slate-900">{formatINR(selectedSub.expected_amount)}</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleReconcile} className="space-y-4">
              <FormInput
                label="Actual Cash Received (₹)"
                type="number" step="0.01" min="0"
                value={reconcileForm.actual_amount}
                onChange={(v) => setReconcileForm({...reconcileForm, actual_amount: v})}
                required
              />

              {/* Live difference indicator */}
              {reconcileForm.actual_amount !== '' && (
                <div className={`flex items-center gap-3 rounded-xl border p-4 ${
                  liveDifference === 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  {liveDifference !== 0 && <IconWarning className="text-amber-500 flex-shrink-0" />}
                  <div>
                    <p className={`text-sm font-semibold ${liveDifference === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {liveDifference === 0
                        ? 'Amounts match — no discrepancy'
                        : `Difference: ${liveDifference > 0 ? '+' : ''}${formatINR(liveDifference)}`
                      }
                    </p>
                    {liveDifference !== 0 && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        {liveDifference < 0
                          ? 'Cash shortfall — agent handed over less than expected'
                          : 'Excess cash — agent handed over more than expected'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action selector */}
              <div>
                <label className="input-label">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReconcileForm({...reconcileForm, action: 'approve'})}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      reconcileForm.action === 'approve'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {liveDifference === 0 ? 'Approve' : 'Approve (with discrepancy)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReconcileForm({...reconcileForm, action: 'reject'})}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      reconcileForm.action === 'reject'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Reject
                  </button>
                </div>
                {reconcileForm.action === 'reject' && (
                  <p className="text-xs text-slate-500 mt-2">
                    Rejected collections return to the agent for resubmission.
                  </p>
                )}
              </div>

              <div>
                <label className="input-label">
                  Discrepancy Notes {reconcileForm.action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reconcileForm.discrepancy_notes}
                  onChange={(e) => setReconcileForm({...reconcileForm, discrepancy_notes: e.target.value})}
                  className="input-field"
                  rows={3}
                  placeholder={reconcileForm.action === 'reject' ? 'Required: explain why this submission is rejected' : 'Optional notes about this reconciliation'}
                  required={reconcileForm.action === 'reject'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setSelectedSub(null)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={reconcileForm.action === 'approve' ? 'btn-success' : 'btn-danger'}
                >
                  {submitting ? 'Processing...' : reconcileForm.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
