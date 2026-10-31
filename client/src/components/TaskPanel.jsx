import { useState, useEffect, useRef } from 'react';
import { PriorityIcon, StatusLozenge, CalendarIcon, CloseIcon, TrashIcon } from './Icons.jsx';
import { api } from '../api.js';
import CommentSection from './CommentSection.jsx';

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
];

export default function TaskPanel({ task, taskKey, onClose, onUpdate, onDelete, showToast }) {
  const [title,       setTitle]       = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status,      setStatus]      = useState(task.status);
  const [priority,    setPriority]    = useState(task.priority);
  const [dueDate,     setDueDate]     = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [savingField, setSavingField] = useState(null);
  const [statusPulse, setStatusPulse] = useState(false);

  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Focus restoration & Escape handling
  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    const esc = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', esc);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  // Sync state if task prop changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setConfirmDel(false);
  }, [task._id]);

  const saveField = async (field, value) => {
    setSavingField(field);
    try {
      const updated = await api.update(task._id, { [field]: value || null });
      onUpdate(task._id, { [field]: updated[field] ?? value });
      if (field === 'status') {
        setStatusPulse(true);
        setTimeout(() => setStatusPulse(false), 600);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingField(null);
    }
  };

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(task.title);
      return;
    }
    if (trimmed !== task.title) {
      saveField('title', trimmed);
    }
  };

  const handleDeleteClick = () => {
    if (!confirmDel) {
      setConfirmDel(true);
      return;
    }
    onDelete(task._id, task);
    onClose();
  };

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        className="panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Task detail: ${task.title}`}
      >
        <div className="panel-header">
          <div className="panel-header-left">
            <p className="panel-key">{taskKey}</p>
            <input
              className="panel-title-edit"
              value={title}
              maxLength={120}
              aria-label="Task title"
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            />
          </div>
          <div className="panel-header-right">
            {savingField && (
              <span className="panel-saving-indicator">
                <span className="btn-spinner dark" aria-hidden="true" />
                <span>Saving…</span>
              </span>
            )}
            <button className="panel-close" onClick={onClose} aria-label="Close panel">
              <CloseIcon size={14} />
            </button>
          </div>
        </div>

        <div className="panel-body">
          <div className="panel-fields-grid">
            <div className="panel-field">
              <label className="panel-label" htmlFor="p-status">Status</label>
              <select
                id="p-status"
                className="panel-select"
                value={status}
                onChange={e => {
                  setStatus(e.target.value);
                  saveField('status', e.target.value);
                }}
                aria-label="Change task status"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div style={{ marginTop: 6 }}>
                <StatusLozenge status={status} pulse={statusPulse} />
              </div>
            </div>

            <div className="panel-field">
              <label className="panel-label" htmlFor="p-priority">Priority</label>
              <select
                id="p-priority"
                className="panel-select"
                value={priority}
                onChange={e => {
                  setPriority(e.target.value);
                  saveField('priority', e.target.value);
                }}
                aria-label="Change task priority"
              >
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <PriorityIcon priority={priority} />
                <span className="panel-meta-text" style={{ textTransform: 'capitalize' }}>{priority}</span>
              </div>
            </div>
          </div>

          <div className="panel-field">
            <label className="panel-label" htmlFor="p-due">Due Date</label>
            <input
              id="p-due"
              type="date"
              className="panel-input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              onBlur={e => saveField('dueDate', e.target.value)}
              aria-label="Due date"
            />
          </div>

          <div className="panel-field">
            <label className="panel-label" htmlFor="p-desc">Description</label>
            <textarea
              id="p-desc"
              className="panel-textarea"
              placeholder="Add context, acceptance criteria, or notes…"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={e => saveField('description', e.target.value)}
              aria-label="Task description"
            />
          </div>

          <div className="panel-divider" />

          {/* Activity Comments */}
          <CommentSection
            taskId={task._id}
            initialComments={task.comments || []}
            onCommentsChange={(next) => onUpdate(task._id, { comments: next })}
            showToast={showToast}
          />
        </div>

        <div className="panel-footer">
          <button
            className={`btn-danger${confirmDel ? ' confirm' : ''}`}
            onClick={handleDeleteClick}
            aria-label={confirmDel ? 'Confirm delete task' : 'Delete task'}
          >
            <TrashIcon size={13} />
            <span>{confirmDel ? 'Click again to confirm delete' : 'Delete Task'}</span>
          </button>
          {confirmDel && (
            <button
              className="btn-secondary"
              onClick={() => setConfirmDel(false)}
              style={{ fontSize: 12, padding: '4px 8px' }}
            >
              Cancel
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
