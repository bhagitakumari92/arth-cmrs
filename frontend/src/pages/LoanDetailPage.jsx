import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loanAPI, collectionAPI } from '../api/services';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Spinner from '../components/Spinner';
import { IconArrowLeft } from '../components/Icons';

export default function LoanDetailPage() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [loanRes, collRes] = await Promise.all([
        loanAPI.get(id),
        collectionAPI.list({ loan: id }),
      ]);
      setLoan(loanRes.data);
      setCollections(collRes.data.results || collRes.data);
    } catch (err) {
      setError('Failed to load loan details');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (loading) return <Spinner size="lg" text="Loading loan details..." />;
  if (error) return (
    <div className="flex flex-col items-center py-16">
      <p className="text-red-600 font-medium mb-4">{error}</p>
      <Link to="/loans" className="btn-secondary"><IconArrowLeft /> Back to Loans</Link>
    </div>
  );
  if (!loan) return null;

  const paidAmount = Number(loan.principal_amount) - Number(loan.outstanding_amount);
  const paidPercent = Number(loan.principal_amount) > 0
    ? Math.min(Math.round((paidAmount / Number(loan.principal_amount)) * 100), 100)
    : 0;

  const scheduleColumns = [
    { key: 'installment_number', label: 'EMI #', render: (row) => <span className="font-semibold text-slate-900">#{row.installment_number}</span> },
    { key: 'due_date', label: 'Due Date' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-medium">{formatINR(row.amount)}</span> },
    { key: 'paid_amount', label: 'Paid', render: (row) => formatINR(row.paid_amount) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const collectionColumns = [
    { key: 'receipt_number', label: 'Receipt', render: (row) => <span className="font-mono text-xs font-medium text-indigo-600">{row.receipt_number}</span> },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-slate-900">{formatINR(row.amount)}</span> },
    { key: 'collection_date', label: 'Date' },
    { key: 'agent_name', label: 'Collected By' },
    { key: 'status', label: 'Cash Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-5">
      <Link to="/loans" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
        <IconArrowLeft /> Back to Loans
      </Link>

      {/* Loan header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">Loan #{loan.id}</h1>
              <StatusBadge status={loan.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1.5">{loan.customer_name} · {loan.branch_name} · Agent: {loan.agent_name}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Repayment Progress</span>
            <span>{paidPercent}% collected · {formatINR(paidAmount)} of {formatINR(loan.principal_amount)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${paidPercent}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            { label: 'Principal Amount', value: formatINR(loan.principal_amount), color: 'text-slate-900' },
            { label: 'Outstanding', value: formatINR(loan.outstanding_amount), color: Number(loan.outstanding_amount) > 0 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Monthly EMI', value: formatINR(loan.monthly_installment), color: 'text-slate-900' },
            { label: 'Tenure', value: `${loan.tenure_months} months`, color: 'text-slate-900' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-500 mb-1">{item.label}</p>
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-5">
          <div className="text-sm"><span className="text-slate-500">Disbursement:</span><span className="ml-2 font-medium text-slate-900">{loan.disbursement_date}</span></div>
          <div className="text-sm"><span className="text-slate-500">Branch:</span><span className="ml-2 font-medium text-slate-900">{loan.branch_name}</span></div>
          <div className="text-sm"><span className="text-slate-500">Agent:</span><span className="ml-2 font-medium text-slate-900">{loan.agent_name}</span></div>
        </div>
      </div>

      {/* Collections against this loan */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="section-title">Repayment History</h2>
          <span className="text-sm text-slate-500">{collections.length} payment(s)</span>
        </div>
        <DataTable columns={collectionColumns} data={collections} emptyMessage="No repayments recorded yet" />
      </div>

      {/* Repayment schedule */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="section-title">Repayment Schedule</h2>
        </div>
        <DataTable columns={scheduleColumns} data={loan.repayment_schedules} emptyMessage="No schedule generated" />
      </div>
    </div>
  );
}
