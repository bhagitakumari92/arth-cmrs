import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Alert from '../components/Alert';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ARTH CMRS</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
            Cash Management<br />& Reconciliation
          </h1>
          <p className="mt-4 text-lg text-indigo-200 leading-relaxed max-w-md">
            Track cash from field collection through branch verification to bank settlement — with complete financial integrity.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'End-to-end cash lifecycle tracking',
              'Role-based access for agents & managers',
              'Real-time reconciliation & discrepancy alerts',
              'Bank deposit & settlement management',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-indigo-100 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">ARTH CMRS</span>
            </div>
            <p className="text-sm text-slate-500">Cash Management & Reconciliation System</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

            <Alert type="error" message={error} onClose={() => setError('')} />

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter your username"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 bg-white rounded-2xl border border-slate-200/80 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Admin', user: 'admin', pass: 'admin123', color: 'bg-violet-100 text-violet-700' },
                { label: 'Manager (North)', user: 'manager1', pass: 'manager123', color: 'bg-emerald-100 text-emerald-700' },
                { label: 'Manager (South)', user: 'manager2', pass: 'manager123', color: 'bg-emerald-100 text-emerald-700' },
                { label: 'Agent 1 (North)', user: 'agent1', pass: 'agent123', color: 'bg-blue-100 text-blue-700' },
                { label: 'Agent 2 (North)', user: 'agent2', pass: 'agent123', color: 'bg-blue-100 text-blue-700' },
                { label: 'Agent 3 (South)', user: 'agent3', pass: 'agent123', color: 'bg-blue-100 text-blue-700' },
              ].map((cred) => (
                <button
                  key={cred.user}
                  type="button"
                  onClick={() => fillCredentials(cred.user, cred.pass)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cred.color}`}>
                    {cred.label}
                  </span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-600 font-mono">
                    {cred.user} / {cred.pass}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
