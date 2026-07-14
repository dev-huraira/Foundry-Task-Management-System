import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Kanban, 
  ListTodo, 
  Settings, 
  UserPlus, 
  PlusCircle, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';

export default function TeamSidebar({ 
  currentView, 
  setView, 
  onOpenInvite, 
  onOpenCreateTeam 
}) {
  const { 
    user, 
    teams, 
    currentTeam, 
    setCurrentTeam, 
    userRole, 
    logout 
  } = useAuth();
  
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'board', label: 'Work Board', icon: Kanban },
    { id: 'list', label: 'Log List', icon: ListTodo },
    { id: 'settings', label: 'Workspace', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-foundry-sidebar text-foundry-surface flex flex-col h-full border-r border-neutral-900 font-sans select-none shrink-0">
      {/* Header / Workspace Selector */}
      <div className="relative border-b border-neutral-900/60 p-4">
        {currentTeam ? (
          <div>
            <button
              onClick={() => setShowTeamDropdown(!showTeamDropdown)}
              className="w-full flex items-center justify-between hover:bg-neutral-800/40 p-1.5 -m-1.5 rounded transition-colors focus:outline-none"
            >
              <div className="flex flex-col items-start truncate pr-2">
                <span className="text-[9px] uppercase tracking-widest text-[#808790] font-bold">
                  Work Station
                </span>
                <span className="text-sm font-semibold truncate text-white tracking-tight">
                  {currentTeam.name}
                </span>
              </div>
              <ChevronDown size={13} className="text-neutral-500 shrink-0" />
            </button>

            {/* Workspace Dropdown */}
            {showTeamDropdown && (
              <div className="absolute left-4 right-4 mt-3.5 bg-[#202326] border border-neutral-900 shadow-foundry-lg z-20 py-1 rounded-sm">
                <span className="block px-3 py-1.5 text-[8px] uppercase tracking-widest font-bold text-neutral-500 border-b border-neutral-900/40">
                  Select Workspace
                </span>
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  {teams.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => {
                        setCurrentTeam(t);
                        setShowTeamDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-neutral-800 truncate block ${
                        t._id === currentTeam._id ? 'text-[#3E709C] font-bold bg-neutral-800/15' : 'text-neutral-300'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="border-t border-neutral-900/70 mt-1">
                  <button
                    onClick={() => {
                      onOpenCreateTeam();
                      setShowTeamDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-850 hover:bg-neutral-800/50 flex items-center"
                  >
                    <PlusCircle size={13} className="mr-2 text-foundry-steel" />
                    New Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenCreateTeam}
            className="w-full flex items-center justify-between bg-neutral-800/30 hover:bg-neutral-800/50 p-2 text-xs font-semibold uppercase tracking-wider text-foundry-surface border border-neutral-800 transition-colors"
          >
            <span>No Workspace</span>
            <PlusCircle size={14} className="text-foundry-steel" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {currentTeam && navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center px-3 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all duration-150 focus:outline-none ${
                isActive
                  ? 'bg-neutral-800/60 text-white border-l-2 border-foundry-steel'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/20'
              }`}
            >
              <Icon size={13} className={`mr-3 shrink-0 ${isActive ? 'text-foundry-steel' : 'text-neutral-500'}`} />
              {item.label}
            </button>
          );
        })}

        {/* Quick Inviter */}
        {currentTeam && (
          <div className="pt-5 border-t border-neutral-900/40 mt-5 px-3">
            <button
              onClick={onOpenInvite}
              className="w-full flex items-center justify-center py-2 px-3 border border-dashed border-neutral-800 hover:border-neutral-600 text-[9px] font-bold uppercase tracking-widest text-neutral-300 hover:text-white transition-colors"
            >
              <UserPlus size={12} className="mr-2 text-foundry-steel" />
              Invite Teammate
            </button>
          </div>
        )}
      </nav>

      {/* Footer User Widget */}
      <div className="p-4 border-t border-neutral-900/50 bg-[#141517] flex items-center justify-between">
        <div className="flex flex-col truncate pr-2 max-w-[140px]">
          <span className="text-xs font-semibold text-neutral-200 truncate">
            {user?.name}
          </span>
          <span className="text-[9px] text-[#808790] truncate font-mono tracking-widest mt-0.5 uppercase">
            {userRole === 'Admin' ? 'ADMIN' : 'MEMBER'}
          </span>
        </div>
        <button
          onClick={logout}
          className="text-neutral-600 hover:text-foundry-rust p-1.5 transition-colors focus:outline-none"
          title="Sign out of workstation"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
