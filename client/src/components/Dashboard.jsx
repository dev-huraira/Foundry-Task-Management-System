import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Clock, CheckSquare, PlusCircle } from 'lucide-react';
import TaskDetailModal from './TaskDetailModal';

export default function Dashboard({ setView }) {
  const { currentTeam, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks register.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTeam) {
      fetchTasks();
    }
  }, [currentTeam]);

  // Derived states
  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const progressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');
  
  const myTasks = tasks.filter(t => 
    t.assignee && (t.assignee._id === user.id || t.assignee._id === user._id || t.assignee === user.id)
  );

  const dueSoonTasks = tasks
    .filter(t => t.dueDate && t.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const myUpcomingTasks = myTasks
    .filter(t => t.status !== 'Done')
    .slice(0, 5);

  const statCards = [
    { label: 'Total Backlog', count: tasks.length, sub: 'All logged orders' },
    { label: 'To Do', count: todoTasks.length, sub: 'Pending log allocation' },
    { label: 'In Progress', count: progressTasks.length, sub: 'Active workstations', color: 'text-foundry-amber border-t-2 border-t-foundry-amber' },
    { label: 'Archived Done', count: doneTasks.length, sub: 'Completed records', color: 'text-foundry-sage border-t-2 border-t-foundry-sage' },
    { label: 'My Workload', count: myTasks.length, sub: 'Allocated to profile', color: 'border-t-2 border-t-foundry-steel' }
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 font-sans">
        <div className="text-center space-y-2">
          <div className="inline-block h-5 w-5 animate-spin border-2 border-foundry-steel border-t-transparent" />
          <p className="text-[10px] uppercase tracking-wider text-foundry-textMuted font-mono">Loading Dashboard Stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-foundry-bg font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-foundry-border pb-4 gap-4">
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-wider text-foundry-text">
              Dashboard Log Status
            </h1>
            <p className="text-xs text-foundry-textMuted mt-1">
              Active workstation overview for workspace <span className="font-semibold text-foundry-text">{currentTeam.name}</span>.
            </p>
          </div>
          <button
            onClick={() => setView('board')}
            className="self-start sm:self-auto flex items-center bg-foundry-steel py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-foundry-surface hover:bg-[#1E374D] transition-colors shadow-sm"
          >
            <PlusCircle size={13} className="mr-1.5" />
            Add back-order task
          </button>
        </div>

        {error && (
          <div className="border-l-2 border-foundry-rust bg-red-50 p-3 text-xs text-foundry-rust">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 select-none">
          {statCards.map((card, i) => (
            <div 
              key={i} 
              className={`bg-foundry-surface border border-foundry-border p-4 flex flex-col justify-between shadow-foundry-sm transition-transform duration-150 hover:-translate-y-[1px] ${
                card.color ? card.color.split(' ')[1] : ''
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider text-foundry-textMuted font-bold">
                {card.label}
              </span>
              <div className="mt-3 flex items-baseline">
                <span className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${
                  card.color ? card.color.split(' ')[0] : 'text-foundry-text'
                }`}>
                  {card.count}
                </span>
              </div>
              <span className="mt-1.5 text-[8px] text-foundry-textMuted truncate">
                {card.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Operational logs details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tasks assigned to me */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-foundry-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foundry-textMuted flex items-center select-none">
                <ClipboardList size={13} className="mr-1.5 text-foundry-steel" />
                Active Workload Assignments ({myTasks.length})
              </h3>
              {myTasks.length > 5 && (
                <button onClick={() => setView('list')} className="text-[9px] text-foundry-steel hover:underline font-bold uppercase tracking-widest">
                  View All
                </button>
              )}
            </div>

            <div className="bg-foundry-surface border border-foundry-border shadow-foundry-sm divide-y divide-foundry-borderLight min-h-[160px]">
              {myUpcomingTasks.length === 0 ? (
                <div className="p-10 text-center text-xs text-foundry-textMuted leading-relaxed">
                  No active assignments allocated to your workstation profile.
                </div>
              ) : (
                myUpcomingTasks.map(task => (
                  <div 
                    key={task._id} 
                    onClick={() => setSelectedTask(task)}
                    className="p-3.5 hover:bg-neutral-50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-4">
                      <span className="font-semibold text-foundry-text truncate block hover:text-foundry-steel transition-colors">
                        {task.title}
                      </span>
                      <span className="text-[9px] text-foundry-textMuted uppercase font-mono tracking-widest mt-0.5 block">
                        Priority: {task.priority} • Status: {task.status}
                      </span>
                    </div>
                    {task.dueDate && (
                      <span className="text-[10px] text-foundry-textMuted font-mono bg-foundry-bg px-2 py-0.5 border border-foundry-borderLight rounded-sm shrink-0 uppercase tracking-wide">
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tasks due soon */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-foundry-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foundry-textMuted flex items-center select-none">
                <Clock size={13} className="mr-1.5 text-foundry-rust" />
                Critical Schedules / Due Soon ({dueSoonTasks.length})
              </h3>
              {tasks.length > 5 && (
                <button onClick={() => setView('list')} className="text-[9px] text-foundry-steel hover:underline font-bold uppercase tracking-widest">
                  View All
                </button>
              )}
            </div>

            <div className="bg-foundry-surface border border-foundry-border shadow-foundry-sm divide-y divide-foundry-borderLight min-h-[160px]">
              {dueSoonTasks.length === 0 ? (
                <div className="p-10 text-center text-xs text-foundry-textMuted leading-relaxed">
                  No pending deadlines registered on the active horizon.
                </div>
              ) : (
                dueSoonTasks.map(task => {
                  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Done';
                  return (
                    <div 
                      key={task._id} 
                      onClick={() => setSelectedTask(task)}
                      className="p-3.5 hover:bg-neutral-50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-4">
                        <span className="font-semibold text-foundry-text truncate block hover:text-foundry-steel transition-colors">
                          {task.title}
                        </span>
                        <span className="text-[9px] text-foundry-textMuted uppercase font-mono tracking-widest mt-0.5 block">
                          Assignee: {task.assignee?.name || 'Unassigned'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 uppercase tracking-wide font-semibold px-2 py-0.5 border rounded-sm ${
                        isOverdue 
                          ? 'bg-foundry-rust/10 text-foundry-rust border-foundry-rust/20' 
                          : 'bg-foundry-bg text-foundry-textMuted border-foundry-borderLight'
                      }`}>
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {isOverdue && ' (OVERDUE)'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          isOpen={!!selectedTask} 
          onClose={() => {
            setSelectedTask(null);
            fetchTasks();
          }} 
        />
      )}
    </div>
  );
}
