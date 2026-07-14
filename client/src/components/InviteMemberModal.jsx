import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Copy, Check, RefreshCw } from 'lucide-react';

export default function InviteMemberModal({ isOpen, onClose }) {
  const { currentTeam, userRole, regenerateInviteCode } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState('');

  if (!isOpen || !currentTeam) return null;

  const joinLink = `${window.location.origin}?invite=${currentTeam.inviteCode}`;

  const copyToClipboard = (text, setCopiedState) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleRegenCode = async () => {
    if (window.confirm('Are you sure you want to regenerate the invite code? The previous code will stop working.')) {
      setRegenerating(true);
      setRegenError('');
      try {
        await regenerateInviteCode();
      } catch (err) {
        setRegenError(err.message || 'Failed to update invite code.');
      } finally {
        setRegenerating(false);
      }
    }
  };

  const isAdmin = userRole === 'Admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foundry-sidebar opacity-60" onClick={onClose} />
      
      {/* Container */}
      <div className="relative w-full max-w-md bg-foundry-surface border border-foundry-border p-6 shadow-lg z-10 font-sans">
        <div className="flex items-center justify-between border-b border-foundry-border pb-3 mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foundry-text">
            Invite Teammates
          </h3>
          <button onClick={onClose} className="text-foundry-textMuted hover:text-foundry-text focus:outline-none">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {regenError && (
            <div className="border-l-2 border-foundry-rust bg-red-50 p-2 text-xs text-foundry-rust">
              {regenError}
            </div>
          )}

          <div>
            <span className="block text-[10px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1">
              Active Workspace
            </span>
            <p className="text-sm font-medium text-foundry-text bg-[#FCFCFB] border border-foundry-borderLight px-3 py-2">
              {currentTeam.name}
            </p>
          </div>

          {/* Invite Code */}
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1">
              Invite Code
            </span>
            <div className="flex">
              <span className="flex-1 text-base font-mono font-bold tracking-widest text-foundry-text bg-[#FCFCFB] border border-foundry-border px-3 py-1.5 flex items-center justify-center select-all uppercase">
                {currentTeam.inviteCode}
              </span>
              <button
                onClick={() => copyToClipboard(currentTeam.inviteCode, setCopiedCode)}
                className="ml-2 px-3 border border-foundry-border bg-foundry-surface text-foundry-text hover:bg-[#ECEBE8] focus:outline-none transition-colors flex items-center justify-center"
                title="Copy Invite Code"
              >
                {copiedCode ? <Check size={16} className="text-foundry-sage" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Quick-Join Link */}
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1">
              Quick-Join Link
            </span>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={joinLink}
                className="flex-1 text-xs font-mono text-foundry-text bg-[#FCFCFB] border border-foundry-border px-3 py-1.5 focus:outline-none select-all"
              />
              <button
                onClick={() => copyToClipboard(joinLink, setCopiedLink)}
                className="ml-2 px-3 border border-foundry-border bg-foundry-surface text-foundry-text hover:bg-[#ECEBE8] focus:outline-none transition-colors flex items-center justify-center"
                title="Copy Invitation Link"
              >
                {copiedLink ? <Check size={16} className="text-foundry-sage" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2 border-t border-foundry-borderLight">
              <button
                onClick={handleRegenCode}
                disabled={regenerating}
                className="flex items-center text-[10px] font-semibold uppercase tracking-wider text-foundry-rust hover:underline disabled:opacity-50"
              >
                <RefreshCw size={12} className={`mr-1.5 ${regenerating ? 'animate-spin' : ''}`} />
                Regenerate Invite Code
              </button>
              <p className="mt-1 text-[9px] text-foundry-textMuted leading-relaxed">
                Regenerating the invite code invalidates the current code immediately. Existing members are not affected.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-foundry-border">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-foundry-steel text-xs uppercase tracking-wider text-foundry-surface font-semibold hover:bg-[#2F485C] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
