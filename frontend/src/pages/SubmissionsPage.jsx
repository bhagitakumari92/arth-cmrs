import { useState, useEffect, useCallback } from 'react';
import { submissionAPI, collectionAPI, userAPI } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import { IconSubmissions } from '../components/Icons';

export default function SubmissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [eligible, setEligible] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');

  const isAgent = user?.role === 'COLLECTION_AGENT';
  const isAdmin = user?.role === 'ADMIN';
  const canSubmit = isAgent || isAdmin;

  // Load agent list once for admin
  useEffect(() => {
    if (isAdmin) {
      userAPI.agents().then(res => setAgents(res.data.results || res.data)).catch(() => {});
    }
  }, [isAdmin]);

  const loadSubmissions = useCallback(async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await submissionAPI.list(params);
      setSubmissions(res.data.results || res.data);
    } catch (err) {
      setError('Failed to load submissions');
    }
  }, [statusFilter]);

  const loadEligible = useCallback(async () => {
    if (isAgent) {
      const res = await collectionAPI.eligibleForSubmission();
      setEligible(res.data);
    } else if (isAdmin && selectedAgent) {
      const res = await collectionAPI.eligibleForSubmission({ agent: selectedAgent });
      setEligible(res.data);
    } else {
      setEligible(null);
    }
  }, [isAgent, isAdmin, selectedAgent]);

  // Wait for auth to resolve before loading anything (user is needed for role logic)
  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    Promise.all([loadSubmissions(), loadEligible()])
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, [authLoading, loadSubmissions, loadEligible]);

  // Reset selection when switching agents
  useEffect(() => {
    setSelectedCollections([]);
  }, [selectedAgent]);

  const handleSubmitCash = async () => {
    setError('');
    try {
      const collectionIds = selectedCollections.length > 0
        ? selectedCollections
        : eligible.collections.map(c => c.id);

      if (collectionIds.length === 0) {
        setError('No eligible collections to submit');
        return;
      }

      await submissionAPI.create({ collection_ids: collectionIds });
      setSuccess('Cash submission created successfully');
      setShowSubmitDialog(false);
      setSelectedCollections([]);
      loadSubmissions();
      loadEligible();
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.join(', ') || err.response?.data?.error || 'Failed to create submission');
      setShowSubmitDialog(false);
    }
  };

  const toggleCollection = (id) => {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (!eligible?.collections) return;
    if (selectedCollections.length === eligible.collections.length) {
      setSelectedCollections([]);
    } else {
      setSelectedCollections(eligible.collections.map(c => c.id));
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const selectedTotal = eligible?.collections
    ?.filter(c => selectedCollections.includes(c.id))
    .reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  const columns = [
    { key: 'id', label: 'Submission', render: (row) => <span className="font-semibold text-indigo-600">#{row.id}</span> },
    { key: 'agent_name', label: 'Agent', render: (row) => <span className="font-medium text-slate-900">{row.agent_name}</span> },
    { key: 'branch_name', label: 'Branch' },
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
  ];

  if (authLoading || loading) return <Spinner size="lg" text="Loading submissions..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Cash Submissions</h1>
          <p className="text-sm text-slate-500 mt-1">{submissions.length} submissions on record</p>
        </div>
        <div className="flex items-center gap-3">
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
          {canSubmit && eligible?.collections?.length > 0 && (
            <button onClick={() => setShowSubmitDialog(true)} className="btn-primary">
              <IconSubmissions /> Submit Cash
            </button>
          )}
        </div>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Admin: pick which agent to act for */}
      {isAdmin && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="input-label text-xs">Act on behalf of agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Select an agent to view their cash in hand...</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.branch_name})</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              As admin you can submit an agent's collected cash to their branch for verification.
            </p>
          </div>
        </div>
      )}

      {/* Eligible collections panel */}
      {canSubmit && eligible?.collections?.length > 0 && (
        <div className="card border-indigo-200/70 bg-indigo-50/40">
          <div className="px-5 py-4 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Cash in Hand — Ready to Submit</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {eligible.collections.length} unsubmitted collection(s) · Total {formatINR(eligible.total)}
              </p>
            </div>
            <button onClick={toggleAll} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              {selectedCollections.length === eligible.collections.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="divide-y divide-indigo-100/70">
            {eligible.collections.map((c) => (
              <label key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-indigo-50/60 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCollections.includes(c.id)}
                  onChange={() => toggleCollection(c.id)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{c.loan_details?.customer_name}</p>
                  <p className="text-xs text-slate-400 font-mono">{c.receipt_number}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatINR(c.amount)}</span>
              </label>
            ))}
          </div>
          {selectedCollections.length > 0 && (
            <div className="px-5 py-3 bg-indigo-100/60 border-t border-indigo-200 flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-900">
                {selectedCollections.length} selected · {formatINR(selectedTotal)}
              </span>
              <button onClick={() => setShowSubmitDialog(true)} className="btn-primary btn-sm">
                Submit Selected
              </button>
            </div>
          )}
        </div>
      )}

      {isAgent && eligible?.collections?.length === 0 && (
        <div className="card p-4 text-sm text-slate-500">
          No unsubmitted cash in hand. Record a collection first, then submit it here.
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={submissions} emptyMessage="No submissions found" />
      </div>

      <ConfirmDialog
        isOpen={showSubmitDialog}
        title="Submit Cash to Branch"
        message={`Submit ${selectedCollections.length > 0 ? selectedCollections.length : eligible?.collections?.length || 0} collection(s) totaling ${formatINR(selectedCollections.length > 0 ? selectedTotal : eligible?.total)} to the branch for verification? Once submitted, these collections cannot be edited.`}
        onConfirm={handleSubmitCash}
        onCancel={() => setShowSubmitDialog(false)}
        confirmText="Submit for Verification"
      />
    </div>
  );
}
