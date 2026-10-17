import { useState, useEffect } from 'react';
import { dashboardAPI, collectionAPI } from '../api/services';
import SummaryCard from '../components/SummaryCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import { IconCollections, IconRupee, IconClock, IconWarning } from '../components/Icons';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date_from: '', date_to: '', status: '' });

  useEffect(() => { loadData(); }, [filters]);

  const loadData = async () => {
    try {
      const params = {};
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.status) params.status = filters.status;

      const [sumRes, collRes] = await Promise.all([
        dashboardAPI.summary(params),
        collectionAPI.list(params),
      ]);
      setSummary(sumRes.data);
      setCollections(collRes.data.results || collRes.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const resetFilters = () => setFilters({ date_from: '', date_to: '', status: '' });

  const collColumns = [
    { key: 'receipt_number', label: 'Receipt', render: (row) => <span className="font-mono text-xs font-medium text-indigo-600">{row.receipt_number}</span> },
    { key: 'loan_details', label: 'Customer', render: (row) => <span className="font-medium text-slate-900">{row.loan_details?.customer_name || '—'}</span> },
    { key: 'agent_name', label: 'Agent' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-slate-900">{formatINR(row.amount)}</span> },
    { key: 'collection_date', label: 'Date' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (loading) return <Spinner size="lg" text="Loading reports..." />;

  const filteredTotal = collections.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Collection analysis across the cash lifecycle</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[140px]">
            <label className="input-label text-xs">From Date</label>
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({...filters, date_from: e.target.value})} className="input-field text-sm" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="input-label text-xs">To Date</label>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({...filters, date_to: e.target.value})} className="input-field text-sm" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="input-label text-xs">Lifecycle Stage</label>
            <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="input-field text-sm">
              <option value="">All Stages</option>
              <option value="COLLECTED">With Agents</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VERIFIED">Verified</option>
              <option value="DEPOSITED">Deposited</option>
              <option value="SETTLED">Settled</option>
            </select>
          </div>
          <button onClick={resetFilters} className="btn-secondary text-sm">
            Reset
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Collected" value={formatINR(summary.total_collected)} icon={IconCollections} color="emerald" />
          <SummaryCard title="Cash with Agents" value={formatINR(summary.cash_with_agents)} icon={IconClock} color="amber" subtitle="Not yet submitted" />
          <SummaryCard title="Total Outstanding" value={formatINR(summary.total_outstanding)} icon={IconRupee} color="red" subtitle="Across all loans" />
          <SummaryCard title="Total Discrepancy" value={formatINR(summary.total_discrepancy)} icon={IconWarning} color="orange" subtitle={`${summary.discrepant_submissions_count} submissions`} />
        </div>
      )}

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="section-title">Collection Register</h2>
            <p className="text-xs text-slate-500 mt-0.5">{collections.length} records in current filter</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Filtered Total</p>
            <p className="text-lg font-bold text-slate-900">{formatINR(filteredTotal)}</p>
          </div>
        </div>
        <DataTable columns={collColumns} data={collections} emptyMessage="No collections match the current filters" />
      </div>
    </div>
  );
}
