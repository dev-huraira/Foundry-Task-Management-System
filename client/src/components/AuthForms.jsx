import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthForms() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        await register(name, email, password);
      }
    } catch (err) {
      setLocalError(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-foundry-bg px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 bg-foundry-surface p-8 border border-foundry-border shadow-sm">
        <div>
          {/* Logo representation */}
          <div className="flex items-center justify-center space-x-2">
            <span className="bg-foundry-steel text-foundry-surface px-2.5 py-1 text-xl font-bold tracking-wider">FOUNDRY</span>
          </div>
          <h2 className="mt-6 text-center text-xl font-medium tracking-tight text-foundry-text">
            {isLogin ? 'Sign in to your workstation' : 'Register a new workstation'}
          </h2>
          <p className="mt-2 text-center text-xs text-foundry-textMuted">
            {isLogin ? 'Provide your credentials' : 'Set up your developer profile'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {localError && (
            <div className="border-l-2 border-foundry-rust bg-red-50 p-3 text-xs text-foundry-rust">
              {localError}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-xs uppercase tracking-wider text-foundry-textMuted font-medium mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full border border-foundry-border px-3 py-2 text-foundry-text text-sm focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors"
                  placeholder="e.g. John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="block text-xs uppercase tracking-wider text-foundry-textMuted font-medium mb-1">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full border border-foundry-border px-3 py-2 text-foundry-text text-sm focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors"
                placeholder="e.g. john.doe@studio.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-wider text-foundry-textMuted font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full border border-foundry-border px-3 py-2 text-foundry-text text-sm focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center bg-foundry-steel py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-foundry-surface transition-colors hover:bg-[#2F485C] focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Processing...' : isLogin ? 'Authenticate' : 'Register'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setLocalError('');
            }}
            className="text-xs text-foundry-steel hover:underline focus:outline-none"
          >
            {isLogin ? "Need a new account? Create workstation profile" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
