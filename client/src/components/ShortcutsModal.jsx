import { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons.jsx';

export default function ShortcutsModal({ onClose }) {
  const modalRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement;
    const focusable = modalRef.current?.querySelectorAll('button, [tabindex="0"]');
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll('button, [tabindex="0"]');
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus?.();
    };
  }, [onClose]);

  const shortcuts = [
    { label: 'Create new task', keys: ['C'] },
    { label: 'Focus global search', keys: ['/'] },
    { label: 'Command palette (quick search)', keys: ['⌘', 'K'], altKeys: ['Ctrl', 'K'] },
    { label: 'Open shortcuts cheat-sheet', keys: ['?'] },
    { label: 'Close panel or modal', keys: ['Esc'] },
    { label: 'Navigate board cards', keys: ['↑', '↓', '←', '→'] },
    { label: 'Pick up card for keyboard move', keys: ['Space'] },
    { label: 'Move picked card to adjacent column', keys: ['←', '→'] },
    { label: 'Drop moved card / open card details', keys: ['Enter'] },
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div className="modal" ref={modalRef} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2 className="modal-title" id="shortcuts-modal-title">Keyboard Shortcuts</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close shortcuts dialog">
            <CloseIcon size={14} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <table className="shortcut-table" aria-label="Keyboard shortcut listing">
            <tbody>
              {shortcuts.map((s, idx) => (
                <tr key={idx}>
                  <td>{s.label}</td>
                  <td>
                    <div className="shortcut-keys">
                      {s.keys.map((k, i) => (
                        <kbd key={i} className="kbd">{k}</kbd>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
