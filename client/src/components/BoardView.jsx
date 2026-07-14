import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Search, Filter, AlertCircle } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskDetailModal from './TaskDetailModal';

const COLUMNS = ['To Do', 'In Progress', 'Done'];

export default function BoardView() {
  const { currentTeam } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modal / Creator State
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCreateColumn, setQuickCreateColumn] = useState(null);
  const [submittingQuick, setSubmittingQuick] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTeam) {
      fetchTasks();
    }
  }, [currentTeam]);

  // Handle Drag Drop Completion
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const destStatus = destination.droppableId;
    
    // Find task
    const targetTask = tasks.find((t) => t._id === draggableId);
    if (!targetTask) return;

    // Save previous state for rollback
    const prevTasks = [...tasks];

    // Optimistic UI Update
    const updatedTasks = tasks.map((t) => {
      if (t._id === draggableId) {
        return { ...t, status: destStatus };
      }
      return t;
    });
    setTasks(updatedTasks);

    try {
      await axios.put(`/api/tasks/${draggableId}`, { status: destStatus });
    } catch (err) {
      setTasks(prevTasks);
      setError(err.response?.data?.error || 'Failed to persist status change. Task position reverted.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Quick Task Creation Inline
  const handleQuickCreate = async (e, status) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setSubmittingQuick(true);
    try {
      const res = await axios.post('/api/tasks', {
        title: quickTitle.trim(),
        status: status,
      });
      setTasks((prev) => [res.data, ...prev]);
      setQuickTitle('');
      setQuickCreateColumn(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to quick create task.');
    } finally {
      setSubmittingQuick(false);
    }
  };

  // Filter Tasks
  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = 
        priorityFilter === 'All' || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  };

  const filteredTasks = getFilteredTasks();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 font-sans">
        <div className="text-center space-y-2">
          <div className="inline-block h-5 w-5 animate-spin border-2 border-foundry-steel border-t-transparent" />
          <p className="text-[10px] uppercase tracking-wider text-foundry-textMuted font-mono">Loading Workspace Board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-foundry-bg">
      
      {/* Board Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-3 border-b border-foundry-border bg-foundry-surface gap-3 select-none shadow-foundry-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-foundry-textMuted pointer-events-none">
            <Search size={13} />
          </span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 border border-foundry-border text-foundry-text bg-foundry-bg text-xs focus:outline-none focus:border-foundry-steel focus:ring-1 focus:ring-foundry-steel transition-all duration-150"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <Filter size={12} className="text-foundry-textMuted" />
          <span className="text-[9px] uppercase tracking-widest font-bold text-foundry-textMuted">Priority:</span>
          <div className="flex border border-foundry-border bg-foundry-surface rounded-sm overflow-hidden shadow-sm">
            {['All', 'Low', 'Medium', 'High'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider border-r border-foundry-border last:border-r-0 transition-colors ${
                  priorityFilter === p 
                    ? 'bg-foundry-bg text-foundry-text font-bold' 
                    : 'text-foundry-textMuted hover:text-foundry-text hover:bg-neutral-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 py-2 bg-red-50 border-b border-foundry-border flex items-center text-xs text-foundry-rust">
          <AlertCircle size={14} className="mr-1.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Board Columns Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-5 flex gap-4 items-start select-none custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          {COLUMNS.map((columnName) => {
            const columnTasks = filteredTasks.filter((t) => t.status === columnName);
            const isAdding = quickCreateColumn === columnName;

            return (
              <div 
                key={columnName} 
                className="w-80 shrink-0 flex flex-col max-h-full bg-foundry-surface border border-foundry-border shadow-foundry-sm transition-all duration-150"
              >
                {/* Column Header */}
                <div className="px-4 py-3 border-b border-foundry-border bg-[#F7F6F2] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-foundry-text">
                      {columnName}
                    </span>
                    <span className="bg-[#E4E2DC] text-foundry-text text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm tabular-nums">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setQuickCreateColumn(isAdding ? null : columnName);
                      setQuickTitle('');
                    }}
                    className="text-foundry-textMuted hover:text-foundry-text transition-colors focus:outline-none"
                    title="Quick Add Task"
                  >
                    <PlusCircle size={14} />
                  </button>
                </div>

                {/* Inline Quick Add Input */}
                {isAdding && (
                  <form 
                    onSubmit={(e) => handleQuickCreate(e, columnName)}
                    className="p-3 border-b border-foundry-borderLight bg-foundry-bg space-y-2"
                  >
                    <input
                      type="text"
                      placeholder="Enter task title..."
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      disabled={submittingQuick}
                      autoFocus
                      className="block w-full border border-foundry-border px-2.5 py-1.5 text-xs text-foundry-text focus:outline-none focus:border-foundry-steel bg-foundry-surface focus:ring-1 focus:ring-foundry-steel"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setQuickCreateColumn(null)}
                        className="px-2.5 py-1 border border-foundry-border text-[9px] uppercase tracking-wider text-foundry-text hover:bg-neutral-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingQuick || !quickTitle.trim()}
                        className="px-2.5 py-1 bg-foundry-steel text-[9px] uppercase tracking-wider text-foundry-surface font-semibold hover:bg-[#1E374D] transition-colors disabled:opacity-50"
                      >
                        Log Order
                      </button>
                    </div>
                  </form>
                )}

                {/* Droppable Task Cards Container */}
                <Droppable droppableId={columnName}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 min-h-[150px] transition-colors duration-150 ${
                        snapshot.isDraggingOver ? 'bg-foundry-bg/60' : 'bg-transparent'
                      }`}
                    >
                      {columnTasks.length === 0 ? (
                        <div className="h-36 border border-dashed border-foundry-border flex flex-col items-center justify-center p-4 text-center select-none bg-neutral-50/40">
                          <span className="text-[9px] font-bold tracking-widest uppercase text-foundry-textMuted/45">
                            No logs registered
                          </span>
                        </div>
                      ) : (
                        columnTasks.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedTask(task)}
                                className="focus:outline-none"
                                style={{
                                  ...provided.draggableProps.style,
                                  cursor: 'pointer'
                                }}
                              >
                                <TaskCard task={task} isDragging={snapshot.isDragging} />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
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
