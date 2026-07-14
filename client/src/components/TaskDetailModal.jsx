import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Trash2, 
  MessageSquare, 
  History, 
  User, 
  Calendar, 
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function TaskDetailModal({ task, isOpen, onClose }) {
  const { currentTeam, user, userRole } = useAuth();
  
  // Local task states
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.substring(0, 10) : '');
  const [assignee, setAssignee] = useState(task.assignee ? (task.assignee._id || task.assignee) : '');

  // Sub-features state (Comments vs Activity tab)
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' or 'activity'
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activities, setActivities] = useState(task.activity || []);

  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  const commentsEndRef = useRef(null);

  // Determine permissions
  const isAdmin = userRole === 'Admin';
  const isCreator = task.creator === user.id || task.creator?._id === user.id || task.creator?._id === user._id || task.creator === user._id;
  const isAssignee = task.assignee && (task.assignee._id === user.id || task.assignee._id === user._id || task.assignee === user.id);
  const hasEditPermission = isAdmin || isCreator || isAssignee;

  useEffect(() => {
    if (isOpen && task._id) {
      fetchComments();
      setActivities(task.activity || []);
      setError('');
      setSaveMessage('');
    }
  }, [isOpen, task]);

  // Auto-scroll comments to bottom
  useEffect(() => {
    if (comments.length > 0 && activeTab === 'comments') {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await axios.get(`/api/comments/${task._id}`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUpdateField = async (updatedFields) => {
    if (!hasEditPermission) return;
    setError('');
    setSaveMessage('Saving...');
    try {
      const res = await axios.put(`/api/tasks/${task._id}`, updatedFields);
      setActivities(res.data.activity);
      
      // Flash successful save indicator
      setSaveMessage('All changes saved locally.');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task detail.');
      setSaveMessage('');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await axios.post(`/api/comments/${task._id}`, { content: newComment.trim() });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
      
      // Update activity feed
      const taskRes = await axios.get('/api/tasks');
      const updatedTask = taskRes.data.find(t => t._id === task._id);
      if (updatedTask) setActivities(updatedTask.activity);
    } catch (err) {
      setError('Failed to post comment. Refresh and try again.');
    }
  };

  const handleDeleteTask = async () => {
    // Only Admin or Creator can delete
    const canDelete = isAdmin || isCreator;
    if (!canDelete) {
      alert('Only administrators or the task creator can delete this item.');
      return;
    }

    if (window.confirm('Are you sure you want to permanently delete this task? This action is irreversible.')) {
      setDeleting(true);
      try {
        await axios.delete(`/api/tasks/${task._id}`);
        onClose();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete task.');
        setDeleting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 font-sans select-none">
      
      {/* Backdrop (hidden on mobile full-screen panel) */}
      <div 
        className="hidden sm:block absolute inset-0 bg-foundry-sidebar opacity-60" 
        onClick={onClose}
      />

      {/* Main Panel - full screen on mobile, modal container on desktop */}
      <div className="relative w-full h-full sm:h-[85vh] sm:max-w-4xl bg-foundry-surface border-0 sm:border border-foundry-border sm:shadow-2xl z-10 flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="h-14 border-b border-foundry-border bg-[#F0EFEA] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 truncate pr-4">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-foundry-textMuted bg-foundry-border px-2 py-0.5 rounded-sm">
              Task Details
            </span>
            {saveMessage && (
              <span className="text-[10px] text-foundry-sage font-semibold animate-pulse truncate font-mono">
                {saveMessage}
              </span>
            )}
            {error && (
              <span className="text-[10px] text-foundry-rust font-semibold truncate font-mono">
                {error}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            {/* Delete button (Admin/Creator only) */}
            {(isAdmin || isCreator) && (
              <button
                onClick={handleDeleteTask}
                disabled={deleting}
                className="text-foundry-textMuted hover:text-foundry-rust p-1.5 transition-colors focus:outline-none"
                title="Delete Task"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="text-foundry-textMuted hover:text-foundry-text p-1.5 transition-colors focus:outline-none"
              title="Close Panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Read-only Alert Warning Banner */}
        {!hasEditPermission && (
          <div className="bg-amber-50 border-b border-foundry-border px-6 py-2 flex items-center text-xs text-[#8A5A1D]">
            <Lock size={12} className="mr-1.5 shrink-0" />
            <span>Read-only: You are not the creator or assignee of this task.</span>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* LEFT SIDE: Task Fields configuration */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 border-r border-foundry-borderLight">
            
            {/* Title */}
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1">
                Task Title
              </label>
              {hasEditPermission ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleUpdateField({ title })}
                  className="block w-full text-base font-bold text-foundry-text bg-transparent border-b border-transparent hover:border-foundry-border focus:border-foundry-steel focus:outline-none py-1 transition-colors"
                />
              ) : (
                <p className="text-base font-bold text-foundry-text py-1">{title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1">
                Description / Specifications
              </label>
              {hasEditPermission ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleUpdateField({ description })}
                  placeholder="Provide technical logs or instructions..."
                  className="block w-full min-h-[120px] border border-foundry-border px-3 py-2 text-xs text-foundry-text focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors resize-none custom-scrollbar"
                />
              ) : (
                <div className="p-3 bg-[#FCFCFB]/60 border border-foundry-borderLight min-h-[100px] text-xs text-foundry-text leading-relaxed whitespace-pre-wrap">
                  {description || <span className="text-foundry-textMuted/45 italic">No log details logged.</span>}
                </div>
              )}
            </div>

            {/* Attributes Grid (Status, Priority, Assignee, Due Date) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    handleUpdateField({ status: e.target.value });
                  }}
                  disabled={!hasEditPermission}
                  className="block w-full border border-foundry-border px-2.5 py-1.5 text-xs text-foundry-text focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors font-mono disabled:opacity-75 disabled:bg-neutral-100"
                >
                  <option value="To Do">TO DO</option>
                  <option value="In Progress">IN PROGRESS</option>
                  <option value="Done">DONE</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    handleUpdateField({ priority: e.target.value });
                  }}
                  disabled={!hasEditPermission}
                  className="block w-full border border-foundry-border px-2.5 py-1.5 text-xs text-foundry-text focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors font-mono disabled:opacity-75 disabled:bg-neutral-100"
                >
                  <option value="Low">LOW</option>
                  <option value="Medium">MEDIUM</option>
                  <option value="High">HIGH</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1 flex items-center">
                  <User size={10} className="mr-1 text-foundry-textMuted" />
                  Assignee
                </label>
                <select
                  value={assignee}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAssignee(val);
                    handleUpdateField({ assignee: val || null });
                  }}
                  disabled={!hasEditPermission}
                  className="block w-full border border-foundry-border px-2.5 py-1.5 text-xs text-foundry-text focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors disabled:opacity-75 disabled:bg-neutral-100"
                >
                  <option value="">Unassigned</option>
                  {currentTeam.members.map((m) => (
                    <option key={m.user._id} value={m.user._id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-foundry-textMuted font-bold mb-1 flex items-center">
                  <Calendar size={10} className="mr-1 text-foundry-textMuted" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleUpdateField({ dueDate: e.target.value || null });
                  }}
                  disabled={!hasEditPermission}
                  className="block w-full border border-foundry-border px-2.5 py-1 text-xs text-foundry-text focus:outline-none focus:border-foundry-steel bg-[#FCFCFB] transition-colors font-mono disabled:opacity-75 disabled:bg-neutral-100"
                />
              </div>
            </div>

            {/* Created By details */}
            <div className="pt-4 border-t border-foundry-borderLight text-[10px] text-foundry-textMuted flex items-center justify-between font-mono">
              <span>CREATED BY: {task.creator?.name || 'Unknown'}</span>
              <span>LOG INITIALIZED: {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>

          </div>

          {/* RIGHT SIDE: Sub panels (Comments & Activity tabs) */}
          <div className="w-full md:w-80 bg-[#FCFCFB] flex flex-col overflow-hidden">
            
            {/* Sub-tab selection */}
            <div className="flex border-b border-foundry-border shrink-0 select-none">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 text-center flex items-center justify-center transition-colors ${
                  activeTab === 'comments'
                    ? 'border-foundry-steel text-foundry-steel'
                    : 'border-transparent text-foundry-textMuted hover:text-foundry-text'
                }`}
              >
                <MessageSquare size={12} className="mr-1.5" />
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 text-center flex items-center justify-center transition-colors ${
                  activeTab === 'activity'
                    ? 'border-foundry-steel text-foundry-steel'
                    : 'border-transparent text-foundry-textMuted hover:text-foundry-text'
                }`}
              >
                <History size={12} className="mr-1.5" />
                Activity Log
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 min-h-0 flex flex-col justify-between">
              {activeTab === 'comments' ? (
                // COMMENTS VIEW
                <div className="flex-1 flex flex-col overflow-hidden h-full">
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-4">
                    {loadingComments ? (
                      <div className="text-center py-4 text-[9px] uppercase tracking-wider text-foundry-textMuted">
                        Loading comments...
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8 text-[10px] text-foundry-textMuted italic">
                        No comments posted. Start the log.
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment._id} className="text-xs space-y-0.5 bg-foundry-surface p-2 border border-foundry-borderLight rounded-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foundry-text truncate pr-2">
                              {comment.author?.name}
                            </span>
                            <span className="text-[8px] text-foundry-textMuted font-mono shrink-0">
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-foundry-text leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Comment submit form */}
                  <form onSubmit={handlePostComment} className="pt-2 border-t border-foundry-borderLight flex gap-2">
                    <input
                      type="text"
                      placeholder="Write comment log..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 border border-foundry-border px-2.5 py-1.5 text-xs text-foundry-text focus:outline-none focus:border-foundry-steel bg-foundry-surface transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-3 bg-foundry-steel hover:bg-[#2F485C] text-foundry-surface transition-colors flex items-center justify-center disabled:opacity-55"
                      title="Post Comment"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </form>
                </div>
              ) : (
                // ACTIVITY HISTORY LOG VIEW
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-[10px] text-foundry-textMuted italic">
                      No activities recorded.
                    </div>
                  ) : (
                    activities.map((act, i) => (
                      <div key={act._id || i} className="text-[10px] space-y-0.5 border-l-2 border-foundry-borderLight pl-2 py-0.5">
                        <p className="text-foundry-text font-mono font-medium">{act.action}</p>
                        <div className="flex items-center justify-between text-[8px] text-foundry-textMuted font-mono">
                          <span>By: {act.user?.name || 'User'}</span>
                          <span>{new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
