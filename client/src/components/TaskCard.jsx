import React from 'react';
import { Calendar } from 'lucide-react';

export default function TaskCard({ task, isDragging }) {
  // Determine border accent color based on task priority
  const getBorderColor = () => {
    switch (task.priority) {
      case 'High':
        return 'border-l-foundry-rust';
      case 'Medium':
        return 'border-l-foundry-amber';
      case 'Low':
      default:
        return 'border-l-foundry-steel';
    }
  };

  const getPriorityBadgeClass = () => {
    switch (task.priority) {
      case 'High':
        return 'bg-foundry-rust/10 text-foundry-rust';
      case 'Medium':
        return 'bg-foundry-amber/10 text-foundry-amber';
      case 'Low':
      default:
        return 'bg-foundry-steel/10 text-foundry-steel';
    }
  };

  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div
      className={`bg-foundry-surface border border-foundry-border border-l-[3px] ${getBorderColor()} p-4 transition-all duration-150 ease-out select-none ${
        isDragging 
          ? 'shadow-foundry-lg ring-1 ring-foundry-steel/10 rotate-1 scale-[1.01]' 
          : 'shadow-foundry-sm hover:shadow-foundry-md hover:-translate-y-[1px] hover:border-neutral-300'
      }`}
    >
      <div className="space-y-3">
        {/* Header Title + Tag */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-xs font-semibold text-foundry-text leading-snug tracking-tight line-clamp-2">
            {task.title}
          </h4>
          <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 font-mono ${getPriorityBadgeClass()} shrink-0 rounded-sm`}>
            {task.priority}
          </span>
        </div>

        {/* Description Snippet (Clean, modern low-contrast) */}
        {task.description && (
          <p className="text-[10px] text-foundry-textMuted line-clamp-2 leading-relaxed font-sans">
            {task.description}
          </p>
        )}

        {/* Footer info: Assignee avatar & Due Date */}
        <div className="flex items-center justify-between pt-3 border-t border-foundry-borderLight/80">
          
          {/* Due date */}
          <div className="flex items-center text-[9px] text-foundry-textMuted font-mono uppercase tracking-wider tabular-nums">
            {formattedDate ? (
              <span className={`flex items-center ${isOverdue ? 'text-foundry-rust font-semibold' : ''}`}>
                <Calendar size={11} className="mr-1.5 shrink-0" />
                {formattedDate}
                {isOverdue && '!'}
              </span>
            ) : (
              <span className="text-[8px] tracking-widest text-foundry-textMuted/45">NO DEADLINE</span>
            )}
          </div>

          {/* Assignee Avatar: square with slightly rounded corners (rounded-sm) */}
          <div className="flex items-center shrink-0">
            {task.assignee ? (
              <div 
                className="h-5.5 w-5.5 rounded-sm bg-foundry-bg border border-foundry-border flex items-center justify-center text-[9px] font-bold font-mono text-foundry-steel hover:bg-neutral-100 transition-colors"
                title={`Assigned to ${task.assignee.name}`}
              >
                {getInitials(task.assignee.name)}
              </div>
            ) : (
              <div 
                className="h-5.5 w-5.5 rounded-sm border border-dashed border-foundry-border flex items-center justify-center text-[8px] font-mono text-foundry-textMuted/40"
                title="Unassigned"
              >
                —
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
