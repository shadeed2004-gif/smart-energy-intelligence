import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function SignInPage() {
  const [email, setEmail] = useState('demo@smartenergy.local');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app/overview');
    } catch {
      setError('Invalid username or password. For demo access, use the pre-filled credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-elevated border border-border rounded-2xl p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl font-bold">
            ⚡
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary">Sign In</h1>
          <p className="text-body-sm text-text-secondary">
            Access your residential energy intelligence dashboard
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-body-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
              Email or Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-body-xs font-semibold text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-2.5 font-semibold"
          >
            {loading ? 'Authenticating…' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="p-3 rounded-lg bg-surface border border-border text-center text-body-xs text-text-secondary space-y-1">
          <p className="font-semibold text-text-primary">Demo Credentials Pre-filled</p>
          <p>Click Sign In to enter standard resident demo mode.</p>
        </div>

        <div className="text-center">
          <Link to="/" className="text-body-xs text-text-secondary hover:text-primary">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
