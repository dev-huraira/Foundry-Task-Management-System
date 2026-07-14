import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Calendar, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle 
} from 'lucide-react';
import TaskDetailModal from './TaskDetailModal';

export default function ListView() {
  const { currentTeam } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Sorting State
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');

  // Task detailed view modal
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

  // Handle Header Click for Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="ml-1.5 text-foundry-textMuted/35" />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="ml-1.5 text-foundry-steel font-bold" /> 
      : <ArrowDown size={12} className="ml-1.5 text-foundry-steel font-bold" />;
  };

  // Perform Filters & Sorts
  const getProcessedTasks = () => {
    let result = [...tasks];

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== 'All') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority Filter
    if (priorityFilter !== 'All') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Assignee Filter
    if (assigneeFilter !== 'All') {
      if (assigneeFilter === 'Unassigned') {
        result = result.filter((t) => !t.assignee);
      } else {
        result = result.filter(
          (t) => t.assignee && (t.assignee._id === assigneeFilter || t.assignee === assigneeFilter)
        );
      }
    }

    // Sort mapping logic
    result.sort((a, b) => {
      let valA, valB;

      switch (sortField) {
        case 'title':
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'priority':
          const priorityOrder = { Low: 1, Medium: 2, High: 3 };
          valA = priorityOrder[a.priority] || 0;
          valB = priorityOrder[b.priority] || 0;
          break;
        case 'assignee':
          valA = a.assignee ? a.assignee.name.toLowerCase() : 'zzzzz';
          valB = b.assignee ? b.assignee.name.toLowerCase() : 'zzzzz';
          break;
        case 'dueDate':
          valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        default:
          valA = a.createdAt;
          valB = b.createdAt;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  };

  const processedTasks = getProcessedTasks();

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-foundry-rust/10 text-foundry-rust border border-foundry-rust/15';
      case 'Medium':
        return 'bg-foundry-amber/10 text-foundry-amber border border-foundry-amber/15';
      case 'Low':
      default:
        return 'bg-foundry-steel/10 text-foundry-steel border border-foundry-steel/15';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Done':
        return 'bg-foundry-sage/10 text-foundry-sage border border-foundry-sage/15';
      case 'In Progress':
        return 'bg-foundry-amber/10 text-foundry-amber border border-foundry-amber/15';
      case 'To Do':
      default:
        return 'bg-[#E5E4DE]/20 text-foundry-textMuted border border-foundry-border';
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 font-sans">
        <div className="text-center space-y-2">
          <div className="inline-block h-5 w-5 animate-spin border-2 border-foundry-steel border-t-transparent" />
          <p className="text-[10px] uppercase tracking-wider text-foundry-textMuted font-mono">Loading Register Log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-foundry-bg">
      
      {/* Search and Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 px-6 py-4 border-b border-foundry-border bg-foundry-surface select-none shadow-foundry-sm">
        
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-foundry-textMuted pointer-events-none">
            <Search size={13} />
          </span>
          <input
            type="text"
            placeholder="Search register..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 border border-foundry-border text-foundry-text bg-foundry-bg text-xs focus:outline-none focus:border-foundry-steel focus:ring-1 focus:ring-foundry-steel transition-all"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full border border-foundry-border px-3 py-1.5 text-xs text-foundry-text bg-foundry-bg focus:outline-none focus:border-foundry-steel focus:ring-1 focus:ring-foundry-steel transition-colors font-mono"
          >
            <option value="All">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="block w-full border border-foundry-border px-3 py-1.5 text-xs text-foundry-text bg-foundry-bg focus:outline-none focus:border-foundry-steel focus:ring-1 focus:ring-foundry-steel transition-colors font-mono"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="block w-full border border-foundry-border px-3 py-1.5 text-xs text-foundry-text bg-foundry-bg focus:outline-none focus:border-foundry-steel focus:ring-1 focus:ring-foundry-steel transition-colors font-mono"
          >
            <option value="All">All Assignees</option>
            <option value="Unassigned">Unassigned</option>
            {currentTeam.members.map((m) => (
              <option key={m.user._id} value={m.user._id}>
                {m.user.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {error && (
        <div className="px-6 py-2 bg-red-50 border-b border-foundry-border flex items-center text-xs text-foundry-rust">
          <AlertCircle size={14} className="mr-1.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Register Log Table */}
      <div className="flex-1 overflow-auto custom-scrollbar px-6 py-5">
        <div className="border border-foundry-border bg-foundry-surface shadow-foundry-sm rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F6F2] border-b border-foundry-border text-[9px] uppercase font-bold text-foundry-textMuted tracking-wider select-none font-mono">
                <th 
                  onClick={() => handleSort('title')} 
                  className="px-4 py-3.5 cursor-pointer hover:bg-neutral-200/40 transition-colors"
                >
                  <span className="flex items-center">
                    Task Title {renderSortIcon('title')}
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('status')} 
                  className="px-4 py-3.5 w-32 cursor-pointer hover:bg-neutral-200/40 transition-colors"
                >
                  <span className="flex items-center">
                    Status {renderSortIcon('status')}
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('priority')} 
                  className="px-4 py-3.5 w-28 cursor-pointer hover:bg-neutral-200/40 transition-colors"
                >
                  <span className="flex items-center">
                    Priority {renderSortIcon('priority')}
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('assignee')} 
                  className="px-4 py-3.5 w-40 cursor-pointer hover:bg-neutral-200/40 transition-colors"
                >
                  <span className="flex items-center">
                    Assignee {renderSortIcon('assignee')}
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('dueDate')} 
                  className="px-4 py-3.5 w-36 cursor-pointer hover:bg-neutral-200/40 transition-colors"
                >
                  <span className="flex items-center">
                    Due Date {renderSortIcon('dueDate')}
                  </span>
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-foundry-borderLight text-xs">
              {processedTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-10 text-foundry-textMuted font-mono text-[10px]">
                    NO MATCHING REGISTRY LOGS FOUND.
                  </td>
                </tr>
              ) : (
                processedTasks.map((task) => {
                  const dateVal = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue = dateVal && dateVal < new Date() && task.status !== 'Done';
                  
                  return (
                    <tr 
                      key={task._id} 
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-neutral-50/50 cursor-pointer transition-colors group"
                    >
                      {/* Title */}
                      <td className="px-4 py-3 font-semibold text-foundry-text group-hover:text-foundry-steel transition-colors truncate max-w-sm">
                        {task.title}
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-[8px] font-bold px-2 py-0.5 uppercase font-mono rounded-sm tracking-widest ${getStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span className={`text-[8px] font-bold px-2 py-0.5 uppercase font-mono rounded-sm tracking-widest ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-3 text-foundry-text truncate max-w-[150px]">
                        {task.assignee ? task.assignee.name : (
                          <span className="text-[10px] text-foundry-textMuted/35 font-mono">—</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className={`px-4 py-3 font-mono text-[10px] tracking-wide tabular-nums uppercase ${
                        isOverdue ? 'text-foundry-rust font-semibold' : 'text-foundry-textMuted'
                      }`}>
                        {dateVal ? (
                          <span className="flex items-center">
                            <Calendar size={11} className="mr-1.5 shrink-0" />
                            {dateVal.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isOverdue && '!'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-foundry-textMuted/30 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details modal */}
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
