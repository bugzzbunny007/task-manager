import React, { useEffect, useRef } from 'react';
import { CloseIcon, StatusLozenge } from './Icons.jsx';

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export default function MoveSheet({ task, currentStatus, onMove, onClose }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Move task status sheet"
      style={{ alignItems: 'flex-end', padding: 0 }}
    >
      <div
        className="modal"
        ref={sheetRef}
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title" style={{ fontSize: 16 }}>Move Task</h3>
            <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close move sheet">
            <CloseIcon size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 'var(--sp-4)', gap: 'var(--sp-2)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Choose Target Column:
          </p>
          {COLUMNS.map((col) => {
            const isCurrent = col.id === currentStatus;
            return (
              <button
                key={col.id}
                className="btn-secondary"
                disabled={isCurrent}
                onClick={() => {
                  onMove(task, col.id);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px var(--sp-4)',
                  minHeight: 48,
                  fontSize: 14,
                  fontWeight: isCurrent ? 700 : 500,
                  background: isCurrent ? 'var(--color-primary-subtle)' : 'var(--surface-0)',
                  borderColor: isCurrent ? 'var(--color-primary)' : 'var(--border)',
                }}
              >
                <span>{col.label}</span>
                <StatusLozenge status={col.id} />
              </button>
            );
          })}
        </div>

        <div className="modal-footer" style={{ background: 'var(--surface-0)' }}>
          <button className="btn-secondary" onClick={onClose} style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
