import { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './Icons.jsx';

function useFocusTrap(containerRef, isActive) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const el = containerRef.current;
    const focusable = el.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    first?.focus();

    const handler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [isActive]);
}

export default function CreateModal({ initialStatus = 'todo', onClose, onCreate }) {
  const ref = useRef(null);
  const previouslyFocused = useRef(null);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [status,      setStatus]      = useState(initialStatus);
  const [priority,    setPriority]    = useState('medium');
  const [dueDate,     setDueDate]     = useState('');
  const [error,       setError]       = useState('');
  const [touched,     setTouched]     = useState(false);
  const [saving,      setSaving]      = useState(false);

  useFocusTrap(ref, true);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', esc);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
      setSaving(false);
    }
  };

  const hasTitleError = touched && !title.trim();

  return (
    <div
      className="modal-backdrop"
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal" ref={ref}>
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">Create Task</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog" disabled={saving}>
            <CloseIcon size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {error && (
              <div className="error-banner" role="alert" aria-live="assertive">
                {error}
              </div>
            )}

            <div className="form-field">
              <label className="form-label" htmlFor="m-title">
                Title <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="m-title"
                className={`form-control${hasTitleError ? ' error' : ''}`}
                autoFocus
                placeholder="What needs doing?"
                maxLength={120}
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                onBlur={() => setTouched(true)}
                required
                aria-required="true"
                aria-invalid={hasTitleError}
                aria-describedby={hasTitleError ? 'title-error-msg' : undefined}
              />
              {hasTitleError && (
                <span id="title-error-msg" style={{ fontSize: 11, color: 'var(--color-danger)' }}>
                  Please enter a task title.
                </span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="m-desc">Description</label>
              <textarea
                id="m-desc"
                className="form-control"
                placeholder="Add context, specifications, or notes…"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="m-status">Status</label>
                <select
                  id="m-status"
                  className="form-control"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="m-priority">Priority</label>
                <select
                  id="m-priority"
                  className="form-control"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="m-due">Due Date</label>
              <input
                id="m-due"
                type="date"
                className="form-control"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || !title.trim()}
            >
              {saving && <span className="btn-spinner" aria-hidden="true" />}
              <span>{saving ? 'Creating…' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
