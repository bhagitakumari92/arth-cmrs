import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  IconDashboard, IconCustomers, IconLoans, IconCollections,
  IconSubmissions, IconReconciliation, IconDeposits, IconReports,
  IconLogout, IconMenu, IconClose, IconUsers, IconBranches,
} from '../components/Icons';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', Icon: IconDashboard, roles: ['ADMIN', 'COLLECTION_AGENT', 'BRANCH_MANAGER'] },
  { path: '/customers', label: 'Customers', Icon: IconCustomers, roles: ['ADMIN', 'COLLECTION_AGENT', 'BRANCH_MANAGER'] },
  { path: '/loans', label: 'Loans', Icon: IconLoans, roles: ['ADMIN', 'COLLECTION_AGENT', 'BRANCH_MANAGER'] },
  { path: '/collections', label: 'Collections', Icon: IconCollections, roles: ['ADMIN', 'COLLECTION_AGENT', 'BRANCH_MANAGER'] },
  { path: '/submissions', label: 'Submissions', Icon: IconSubmissions, roles: ['ADMIN', 'COLLECTION_AGENT', 'BRANCH_MANAGER'] },
  { path: '/reconciliation', label: 'Reconciliation', Icon: IconReconciliation, roles: ['ADMIN', 'BRANCH_MANAGER'] },
  { path: '/deposits', label: 'Deposits', Icon: IconDeposits, roles: ['ADMIN', 'BRANCH_MANAGER'] },
  { path: '/reports', label: 'Reports', Icon: IconReports, roles: ['ADMIN', 'BRANCH_MANAGER'] },
  { path: '/users', label: 'Users', Icon: IconUsers, roles: ['ADMIN'] },
  { path: '/branches', label: 'Branches', Icon: IconBranches, roles: ['ADMIN'] },
];

const ROLE_LABELS = {
  ADMIN: { label: 'Administrator', color: 'bg-violet-100 text-violet-700' },
  COLLECTION_AGENT: { label: 'Agent', color: 'bg-blue-100 text-blue-700' },
  BRANCH_MANAGER: { label: 'Manager', color: 'bg-emerald-100 text-emerald-700' },
};

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const role = ROLE_LABELS[user?.role] || ROLE_LABELS.COLLECTION_AGENT;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top header bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-slate-200/80">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <IconClose /> : <IconMenu />}
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight hidden sm:block">
                ARTH CMRS
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {user?.branch_name && (
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  {user.branch_name}
                </span>
              )}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${role.color}`}>
                {role.label}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-700">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 hidden md:block">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200/80 pt-16
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="flex flex-col h-full px-3 py-4">
            <div className="flex-1 space-y-1">
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-150
                      ${isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <item.Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.label}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Sidebar footer */}
            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="px-3 py-2 text-xs text-slate-400">
                ARTH CMRS v1.0
              </div>
            </div>
          </nav>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
          <div className="p-5 lg:p-7 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
