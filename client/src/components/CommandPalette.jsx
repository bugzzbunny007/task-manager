import { useState, useEffect, useRef } from 'react';
import { SearchIcon, PriorityIcon, StatusLozenge } from './Icons.jsx';

export default function CommandPalette({ tasks, onSelectTask, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    inputRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  const filteredTasks = tasks.filter(t => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      t.status.toLowerCase().includes(q) ||
      t.priority.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(idx => (idx + 1) % Math.max(1, filteredTasks.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(idx => (idx - 1 + filteredTasks.length) % Math.max(1, filteredTasks.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTasks[selectedIndex]) {
        onSelectTask(filteredTasks[selectedIndex]);
        onClose();
      }
    }
  };

  const taskKey = (t) => `TASK-${tasks.indexOf(t) + 1}`;

  return (
    <div
      className="palette-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette Quick Search"
    >
      <div className="command-palette" onKeyDown={handleKeyDown}>
        <div className="palette-search-wrap">
          <SearchIcon size={18} />
          <input
            ref={inputRef}
            className="palette-input"
            type="text"
            placeholder="Search tasks by title, status, or priority…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Quick search query"
            aria-controls="palette-results-list"
          />
          <kbd className="kbd">Esc</kbd>
        </div>

        <div className="palette-results" id="palette-results-list" role="listbox">
          <div className="palette-section-label">
            {filteredTasks.length > 0 ? `Tasks (${filteredTasks.length})` : 'Results'}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="palette-empty">No tasks matching "{query}"</div>
          ) : (
            filteredTasks.map((t, idx) => (
              <button
                key={t._id}
                role="option"
                aria-selected={idx === selectedIndex}
                className={`palette-item${idx === selectedIndex ? ' focused' : ''}`}
                onClick={() => {
                  onSelectTask(t);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <PriorityIcon priority={t.priority} />
                <span className="palette-item-key">{taskKey(t)}</span>
                <span className="palette-item-title">{t.title}</span>
                <StatusLozenge status={t.status} />
              </button>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span><kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> Navigate</span>
          <span><kbd className="kbd">↵</kbd> Select</span>
          <span><kbd className="kbd">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
