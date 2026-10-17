import { useState, useEffect } from 'react';
import { dashboardAPI } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import SummaryCard from '../components/SummaryCard';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import {
  IconLoans, IconCollections, IconRupee, IconClock,
  IconSubmissions, IconDeposits, IconReports, IconCustomers,
} from '../components/Icons';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date_from: '', date_to: '' });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const [summaryRes, recentRes] = await Promise.all([
        dashboardAPI.summary(params),
        dashboardAPI.recent(),
      ]);
      setSummary(summaryRes.data);
      setRecent(recentRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (loading && !summary) return <Spinner size="lg" text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, {user?.first_name}. Here's your cash flow overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="input-field w-auto text-sm py-2"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="input-field w-auto text-sm py-2"
          />
        </div>
      </div>

      {summary && (
        <>
          {/* Primary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Loan Portfolio"
              value={formatINR(summary.total_loan_amount)}
              icon={IconLoans}
              color="indigo"
              subtitle={`${summary.active_loans} active loans`}
            />
            <SummaryCard
              title="Outstanding Amount"
              value={formatINR(summary.total_outstanding)}
              icon={IconRupee}
              color="red"
              subtitle="Yet to be collected"
            />
            <SummaryCard
              title="Total Collected"
              value={formatINR(summary.total_collected)}
              icon={IconCollections}
              color="emerald"
              subtitle={`${summary.collection_count} transactions`}
            />
            <SummaryCard
              title="Total Customers"
              value={summary.total_customers}
              icon={IconCustomers}
              color="blue"
            />
          </div>

          {/* Cash pipeline */}
          <div className="card p-6">
            <h3 className="section-title mb-5">Cash Pipeline</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'With Agents', value: summary.cash_with_agents, desc: 'Collected, not submitted', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                { label: 'Submitted', value: summary.cash_submitted, desc: 'Pending verification', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                { label: 'Verified', value: summary.cash_verified, desc: 'Ready for deposit', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Deposited', value: summary.total_deposits, desc: 'In bank deposits', text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
                { label: 'Pending Deposit', value: summary.pending_deposits, desc: 'Awaiting settlement', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
                { label: 'Settled', value: summary.total_settled_amount, desc: 'Fully settled', text: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl border p-4 ${item.bg} ${item.border}`}>
                  <p className="text-xs font-medium text-slate-500">{item.label}</p>
                  <p className={`mt-1.5 text-lg font-bold ${item.text}`}>
                    {formatINR(item.value)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              title="Pending Submissions"
              value={summary.pending_submissions}
              icon={IconClock}
              color="amber"
              subtitle="Awaiting branch verification"
            />
            <SummaryCard
              title="Discrepant Submissions"
              value={summary.discrepant_submissions_count}
              icon={IconSubmissions}
              color="orange"
              subtitle={`Total: ${formatINR(summary.total_discrepancy)}`}
            />
            <SummaryCard
              title="Settled Deposits"
              value={formatINR(summary.settled_deposits)}
              icon={IconDeposits}
              color="teal"
              subtitle="Completed bank settlements"
            />
          </div>
        </>
      )}

      {/* Recent activity */}
      {recent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Collections */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Recent Collections</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {recent.recent_collections.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-400 text-center">No collections yet</p>
              ) : recent.recent_collections.map((c) => (
                <div key={c.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.customer}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{c.receipt_number}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{formatINR(c.amount)}</p>
                      <div className="mt-1"><StatusBadge status={c.status} /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Recent Submissions</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {recent.recent_submissions.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-400 text-center">No submissions yet</p>
              ) : recent.recent_submissions.map((s) => (
                <div key={s.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{s.agent}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.branch}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{formatINR(s.expected)}</p>
                      <div className="mt-1"><StatusBadge status={s.status} /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Deposits */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Recent Deposits</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {recent.recent_deposits.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-400 text-center">No deposits yet</p>
              ) : recent.recent_deposits.map((d) => (
                <div key={d.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{d.bank}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{d.reference}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{formatINR(d.amount)}</p>
                      <div className="mt-1"><StatusBadge status={d.status} /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
