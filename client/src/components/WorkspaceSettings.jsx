import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserMinus, UserCheck, LogOut } from 'lucide-react';

export default function WorkspaceSettings() {
  const { 
    user, 
    currentTeam, 
    userRole, 
    updateMemberRole, 
    removeMember 
  } = useAuth();
  
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  if (!currentTeam) return null;

  const handleRoleChange = async (targetUserId, newRole) => {
    setUpdatingId(targetUserId);
    setActionError('');
    try {
      await updateMemberRole(targetUserId, newRole);
    } catch (err) {
      setActionError(err.message || 'Failed to update member role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (targetUserId, targetUserName, isSelf) => {
    const confirmMessage = isSelf
      ? 'Are you sure you want to leave this workspace?'
      : `Are you sure you want to remove ${targetUserName} from this workspace?`;

    if (window.confirm(confirmMessage)) {
      setUpdatingId(targetUserId);
      setActionError('');
      try {
        await removeMember(targetUserId);
      } catch (err) {
        setActionError(err.message || 'Action failed.');
      } finally {
        setUpdatingId(null);
      }
    }
  };

  const isAdmin = userRole === 'Admin';

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Section Header */}
        <div className="border-b border-foundry-border pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foundry-text">
            Workspace Configuration
          </h2>
          <p className="text-xs text-foundry-textMuted mt-1">
            Manage your local workstation environment, member roles, and permissions.
          </p>
        </div>

        {actionError && (
          <div className="border-l-2 border-foundry-rust bg-red-50 p-3 text-xs text-foundry-rust">
            {actionError}
          </div>
        )}

        {/* Workspace Info Card */}
        <div className="bg-foundry-surface border border-foundry-border p-5 space-y-4">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1">
              Workspace Identifier
            </span>
            <p className="text-base font-bold text-foundry-text">
              {currentTeam.name}
            </p>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1">
              Active Member Count
            </span>
            <p className="text-sm text-foundry-text font-mono tabular-nums">
              {currentTeam.members.length} {currentTeam.members.length === 1 ? 'member' : 'members'} registered
            </p>
          </div>
        </div>

        {/* Members Roster List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foundry-textMuted">
            Registered Workspace Roster
          </h3>

          <div className="bg-foundry-surface border border-foundry-border divide-y divide-foundry-borderLight">
            {currentTeam.members.map((member) => {
              const memberUser = member.user;
              const isSelf = memberUser._id === user.id || memberUser._id === user._id;
              const isTargetAdmin = member.role === 'Admin';
              const isLoading = updatingId === memberUser._id;

              return (
                <div key={memberUser._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Member Name and Email */}
                  <div className="flex items-start space-x-3 truncate">
                    <div className={`h-8 w-8 shrink-0 flex items-center justify-center font-bold text-xs uppercase text-foundry-surface ${
                      isTargetAdmin ? 'bg-foundry-steel' : 'bg-foundry-low'
                    }`}>
                      {memberUser.name.substring(0, 2)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-foundry-text">
                          {memberUser.name}
                        </span>
                        {isSelf && (
                          <span className="bg-foundry-borderLight text-foundry-textMuted text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider font-mono">
                            You
                          </span>
                        )}
                        {isTargetAdmin && (
                          <span className="bg-foundry-steel/10 text-foundry-steel text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider font-mono">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-foundry-textMuted font-mono truncate">
                        {memberUser.email}
                      </span>
                    </div>
                  </div>

                  {/* Actions / Roles */}
                  <div className="flex items-center space-x-3 justify-end shrink-0">
                    {/* Role selector dropdown: Admins can change other users' roles */}
                    {isAdmin && !isSelf ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(memberUser._id, e.target.value)}
                        disabled={isLoading}
                        className="bg-foundry-surface border border-foundry-border px-2.5 py-1 text-xs text-foundry-text focus:outline-none focus:border-foundry-steel transition-colors font-mono"
                      >
                        <option value="Member">MEMBER</option>
                        <option value="Admin">ADMINISTRATOR</option>
                      </select>
                    ) : (
                      <span className="text-[10px] font-mono text-foundry-textMuted uppercase pr-2">
                        {member.role === 'Admin' ? 'ADMINISTRATOR' : 'MEMBER'}
                      </span>
                    )}

                    {/* Remove Member / Leave Workspace action */}
                    {isSelf ? (
                      <button
                        onClick={() => handleRemove(memberUser._id, memberUser.name, true)}
                        disabled={isLoading}
                        className="flex items-center text-xs text-foundry-rust hover:underline font-semibold tracking-wide"
                        title="Leave this Workspace"
                      >
                        <LogOut size={13} className="mr-1" />
                        Leave
                      </button>
                    ) : (
                      isAdmin && (
                        <button
                          onClick={() => handleRemove(memberUser._id, memberUser.name, false)}
                          disabled={isLoading}
                          className="flex items-center text-xs text-foundry-rust hover:underline font-semibold tracking-wide disabled:opacity-50"
                          title="Remove user from Workspace"
                        >
                          <UserMinus size={13} className="mr-1" />
                          Remove
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
