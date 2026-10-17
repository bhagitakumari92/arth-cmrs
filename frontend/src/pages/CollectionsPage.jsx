import { useState, useEffect } from 'react';
import { collectionAPI, loanAPI } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { IconPlus } from '../components/Icons';

export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ loan: '', amount: '', collection_date: '', notes: '' });
  const [detail, setDetail] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [collRes, loansRes] = await Promise.all([collectionAPI.list(), loanAPI.list()]);
      setCollections(collRes.data.results || collRes.data);
      setLoans(loansRes.data.results || loansRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await collectionAPI.create({
        loan: form.loan,
        amount: form.amount,
        collection_date: form.collection_date,
        notes: form.notes,
        idempotency_key: `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
      setSuccess('Collection recorded successfully');
      setShowForm(false);
      setForm({ loan: '', amount: '', collection_date: '', notes: '' });
      loadData();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.non_field_errors) setError(errData.non_field_errors.join(', '));
      else if (typeof errData === 'object') setError(Object.values(errData).flat().join(', '));
      else setError('Failed to record collection');
    } finally {
      setSubmitting(false);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const activeLoans = loans.filter(l => l.status === 'ACTIVE' && Number(l.outstanding_amount) > 0);

  const columns = [
    { key: 'receipt_number', label: 'Receipt', render: (row) => <span className="font-mono text-xs font-medium text-indigo-600">{row.receipt_number}</span> },
    { key: 'loan_details', label: 'Customer', render: (row) => <span className="font-medium text-slate-900">{row.loan_details?.customer_name || '—'}</span> },
    { key: 'agent_name', label: 'Agent' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-slate-900">{formatINR(row.amount)}</span> },
    { key: 'collection_date', label: 'Date' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (loading) return <Spinner size="lg" text="Loading collections..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Cash Collections</h1>
          <p className="text-sm text-slate-500 mt-1">{collections.length} collections recorded</p>
        </div>
        {(user?.role === 'COLLECTION_AGENT' || user?.role === 'ADMIN') && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <IconPlus /> Record Collection
          </button>
        )}
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="card">
        <DataTable
          columns={columns}
          data={collections}
          onRowClick={(row) => setDetail(row)}
          emptyMessage="No collections recorded yet"
        />
      </div>

      {/* Record collection modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Record Cash Collection">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect
            label="Select Loan" value={form.loan}
            onChange={(v) => setForm({...form, loan: v})}
            options={activeLoans.map(l => ({
              value: l.id,
              label: `#${l.id} — ${l.customer_name} (Outstanding: ${formatINR(l.outstanding_amount)})`
            }))}
            required hint="Only active loans with outstanding balance"
          />
          <FormInput
            label="Amount (₹)" type="number" step="0.01" min="0.01"
            value={form.amount} onChange={(v) => setForm({...form, amount: v})}
            required hint="Must not exceed outstanding balance"
          />
          <FormInput
            label="Collection Date" type="date"
            value={form.collection_date} onChange={(v) => setForm({...form, collection_date: v})}
            required
          />
          <FormInput label="Notes" value={form.notes} onChange={(v) => setForm({...form, notes: v})} hint="Optional" />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-success">
              {submitting ? 'Recording...' : 'Record Collection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt detail modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Collection Receipt">
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-5 py-4">
              <div>
                <p className="text-xs text-slate-500">Receipt Number</p>
                <p className="font-mono font-bold text-slate-900">{detail.receipt_number}</p>
              </div>
              <StatusBadge status={detail.status} />
            </div>

            <div className="text-center py-4 border-y border-dashed border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Amount Collected</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{formatINR(detail.amount)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Customer</p>
                <p className="font-medium text-slate-900 mt-0.5">{detail.loan_details?.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Loan</p>
                <p className="font-medium text-slate-900 mt-0.5">#{detail.loan}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Collected By</p>
                <p className="font-medium text-slate-900 mt-0.5">{detail.agent_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Branch</p>
                <p className="font-medium text-slate-900 mt-0.5">{detail.branch_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Collection Date</p>
                <p className="font-medium text-slate-900 mt-0.5">{detail.collection_date}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Recorded At</p>
                <p className="font-medium text-slate-900 mt-0.5">{detail.created_at ? new Date(detail.created_at).toLocaleString('en-IN') : '—'}</p>
              </div>
            </div>

            {detail.notes && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{detail.notes}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <p className="text-xs text-amber-700">
                Financial records are immutable — collections cannot be edited or deleted after recording.
              </p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setDetail(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
