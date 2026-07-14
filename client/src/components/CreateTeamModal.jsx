import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

export default function CreateTeamModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('join'); // 'join' or 'create'
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const { createTeam, joinTeam } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      if (tab === 'create') {
        if (!teamName.trim()) throw new Error('Workspace name is required.');
        await createTeam(teamName);
      } else {
        if (!inviteCode.trim()) throw new Error('Invite code is required.');
        await joinTeam(inviteCode);
      }
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foundry-sidebar opacity-60" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-md bg-foundry-surface border border-foundry-border p-6 shadow-lg z-10 font-sans">
        <div className="flex items-center justify-between border-b border-foundry-border pb-3 mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foundry-text">
            Workspace Manager
          </h3>
          <button 
            onClick={onClose} 
            className="text-foundry-textMuted hover:text-foundry-text focus:outline-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-foundry-border mb-4">
          <button
            onClick={() => { setTab('join'); setLocalError(''); }}
            className={`flex-1 pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 text-center transition-colors ${
              tab === 'join' 
                ? 'border-foundry-steel text-foundry-steel' 
                : 'border-transparent text-foundry-textMuted hover:text-foundry-text'
            }`}
          >
            Join Workspace
          </button>
          <button
            onClick={() => { setTab('create'); setLocalError(''); }}
            className={`flex-1 pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 text-center transition-colors ${
              tab === 'create' 
                ? 'border-foundry-steel text-foundry-steel' 
                : 'border-transparent text-foundry-textMuted hover:text-foundry-text'
            }`}
          >
            Create Workspace
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {localError && (
            <div className="border-l-2 border-foundry-rust bg-red-50 p-2.5 text-xs text-foundry-rust">
              {localError}
            </div>
          )}

          {tab === 'join' ? (
            <div>
              <label htmlFor="inviteCode" className="block text-xs uppercase tracking-wider text-foundry-textMuted font-medium mb-1">
                Workspace Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. A3X9PZ10"
                className="block w-full border border-foundry-border px-3 py-2 text-foundry-text text-sm focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors uppercase"
                required
              />
              <p className="mt-1.5 text-[10px] text-foundry-textMuted leading-relaxed">
                Enter the unique code shared by your team administrator. Invite codes are typically 8 uppercase alphanumeric characters.
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="teamName" className="block text-xs uppercase tracking-wider text-foundry-textMuted font-medium mb-1">
                Workspace Name
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Design Studio, Dev Ops Team"
                className="block w-full border border-foundry-border px-3 py-2 text-foundry-text text-sm focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors"
                required
              />
              <p className="mt-1.5 text-[10px] text-foundry-textMuted leading-relaxed">
                Provide a descriptor. You will be initialized as the Workspace Administrator and can generate invite links for teammates.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-foundry-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-foundry-border text-xs uppercase tracking-wider text-foundry-text hover:bg-[#ECEBE8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-foundry-steel text-xs uppercase tracking-wider text-foundry-surface font-semibold hover:bg-[#2F485C] transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : tab === 'join' ? 'Join Workspace' : 'Initialize Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
