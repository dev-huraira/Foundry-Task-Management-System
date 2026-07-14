import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForms from './components/AuthForms';
import TeamSidebar from './components/TeamSidebar';
import Dashboard from './components/Dashboard';
import BoardView from './components/BoardView';
import ListView from './components/ListView';
import WorkspaceSettings from './components/WorkspaceSettings';
import CreateTeamModal from './components/CreateTeamModal';
import InviteMemberModal from './components/InviteMemberModal';
import { LayoutDashboard, Users, Plus } from 'lucide-react';

function AppContent() {
  const { user, token, teams, currentTeam, loading, joinTeam } = useAuth();
  const [view, setView] = useState('dashboard');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [urlInviteHandled, setUrlInviteHandled] = useState(false);

  // Check URL query parameters for invite code on mount/auth load
  useEffect(() => {
    if (loading || urlInviteHandled) return;

    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');

    if (inviteCode) {
      setUrlInviteHandled(true);
      
      // Clean query params from URL address bar without page reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      if (token) {
        // Attempt to auto-join since user is already authenticated
        joinTeam(inviteCode)
          .then((joinedTeam) => {
            alert(`Successfully joined workspace: ${joinedTeam.name}`);
            setView('dashboard');
          })
          .catch((err) => {
            alert(`Workspace join failed: ${err.message}`);
          });
      } else {
        // Store invite code in local session to autofill/join later
        sessionStorage.setItem('foundry_pending_invite', inviteCode);
      }
    }
  }, [loading, token, urlInviteHandled]);

  // Handle pending invite code stored in session after login
  useEffect(() => {
    if (!loading && token && user) {
      const pendingInvite = sessionStorage.getItem('foundry_pending_invite');
      if (pendingInvite) {
        sessionStorage.removeItem('foundry_pending_invite');
        joinTeam(pendingInvite)
          .then((joinedTeam) => {
            alert(`Successfully joined workspace: ${joinedTeam.name}`);
            setView('dashboard');
          })
          .catch((err) => {
            alert(`Failed to join pending workspace invitation: ${err.message}`);
          });
      }
    }
  }, [loading, token, user]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-foundry-bg font-sans">
        <div className="text-center space-y-3">
          <div className="inline-block h-6 w-6 animate-spin border-2 border-foundry-steel border-t-transparent" />
          <p className="text-xs uppercase tracking-widest text-foundry-textMuted font-medium">
            Verifying Workstation...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!token || !user) {
    return <AuthForms />;
  }

  // Authenticated but no teams created/joined yet (Onboarding state)
  if (teams.length === 0 || !currentTeam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foundry-bg px-4 font-sans">
        <div className="w-full max-w-md bg-foundry-surface p-8 border border-foundry-border shadow-sm text-center space-y-6">
          <div>
            <span className="bg-foundry-steel text-foundry-surface px-2.5 py-1 text-base font-bold tracking-wider">FOUNDRY</span>
            <h2 className="mt-6 text-lg font-semibold uppercase tracking-wider text-foundry-text">
              No Workspace Found
            </h2>
            <p className="mt-2 text-xs text-foundry-textMuted leading-relaxed">
              To begin logging tasks and managing project boards, initialize a new workspace or enter an invite code to join an existing team.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                sessionStorage.removeItem('foundry_pending_invite');
                setIsCreateTeamOpen(true);
              }}
              className="w-full flex items-center justify-center bg-foundry-steel py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-foundry-surface hover:bg-[#2F485C] transition-colors"
            >
              <Plus size={14} className="mr-2" />
              Initialize Workspace
            </button>
            <button
              onClick={() => setIsCreateTeamOpen(true)}
              className="w-full flex items-center justify-center bg-foundry-surface border border-foundry-border py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-foundry-text hover:bg-[#ECEBE8] transition-colors"
            >
              <Users size={14} className="mr-2 text-foundry-steel" />
              Enter Invite Code
            </button>
          </div>

          <div className="border-t border-foundry-border pt-4">
            <button
              onClick={() => {
                // Logout/reset
                localStorage.removeItem('foundry_token');
                window.location.reload();
              }}
              className="text-xs text-foundry-rust hover:underline font-medium"
            >
              Disconnect workstation profile
            </button>
          </div>

          <CreateTeamModal 
            isOpen={isCreateTeamOpen} 
            onClose={() => setIsCreateTeamOpen(false)} 
          />
        </div>
      </div>
    );
  }

  // Main application view resolution
  const renderMainView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard setView={setView} />;
      case 'board':
        return <BoardView />;
      case 'list':
        return <ListView />;
      case 'settings':
        return <WorkspaceSettings />;
      default:
        return <Dashboard setView={setView} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-foundry-bg overflow-hidden font-sans">
      <TeamSidebar 
        currentView={view} 
        setView={setView} 
        onOpenInvite={() => setIsInviteOpen(true)} 
        onOpenCreateTeam={() => setIsCreateTeamOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-foundry-bg overflow-hidden">
        {/* Main Header */}
        <header className="h-14 border-b border-foundry-border bg-foundry-surface px-6 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-foundry-textMuted">
              {view === 'dashboard' && 'Dashboard Overview'}
              {view === 'board' && 'Work-Order Board'}
              {view === 'list' && 'Task Register Log'}
              {view === 'settings' && 'Workspace Controls'}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-foundry-textMuted font-mono uppercase tabular-nums">
            {new Date().toLocaleDateString(undefined, { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </header>

        {/* View Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {renderMainView()}
        </div>
      </main>

      {/* Global Modals */}
      <CreateTeamModal 
        isOpen={isCreateTeamOpen} 
        onClose={() => setIsCreateTeamOpen(false)} 
      />
      <InviteMemberModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
