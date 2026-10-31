import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from './api.js';
import {
  SearchIcon,
  BoardIcon,
  ListIcon,
  SunIcon,
  MoonIcon,
  HelpIcon,
  PlusIcon,
} from './components/Icons.jsx';
import { BoardView, ListView } from './components/BoardList.jsx';
import TaskPanel from './components/TaskPanel.jsx';
import CreateModal from './components/CreateModal.jsx';
import ShortcutsModal from './components/ShortcutsModal.jsx';
import CommandPalette from './components/CommandPalette.jsx';

/* ─── Toast System with Undo & Auto-Dismiss ───────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'success', action = null, duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, action, duration };
    setToasts(ts => [...ts, newToast]);
    setTimeout(() => {
      setToasts(ts => ts.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  return { toasts, show, dismiss };
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          role="status"
          style={{ '--toast-dur': `${t.duration || 4000}ms` }}
        >
          <span className="toast-icon" aria-hidden="true">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className="toast-message">{t.message}</span>
          {t.action && (
            <button
              className="toast-action"
              onClick={() => {
                t.action.onClick();
                onDismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            className="toast-close"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
          <div className="toast-progress" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

/* ─── App Component ───────────────────────────────────────────────────── */
const PRIORITY_OPTIONS = [
  { value: '',       label: 'All priorities' },
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
];

export default function App() {
  const [tasks,               setTasks]               = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [view,                setView]                = useState('board'); // 'board' | 'list'
  const [search,              setSearch]              = useState('');
  const [navSearch,           setNavSearch]           = useState('');
  const [priorityFilter,      setPriorityFilter]      = useState('');
  const [openTask,            setOpenTask]            = useState(null);
  const [createStatus,        setCreateStatus]        = useState(null);
  const [showShortcuts,       setShowShortcuts]       = useState(false);
  const [showCommandPalette,  setShowCommandPalette]  = useState(false);

  // Manual theme toggle: respects prefers-color-scheme by default
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const { toasts, show: showToast, dismiss: dismissToast } = useToast();
  const pendingDeletesRef = useRef(new Map());

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  /* ── Load all tasks ─────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list();
      setTasks(data);
    } catch (err) {
      showToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  /* ── Keyboard Shortcuts (C, /, Esc, ?, Cmd/Ctrl+K) ─────────────────── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

      // Cmd+K or Ctrl+K for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      // Escape key closes modals/panels
      if (e.key === 'Escape') {
        if (showCommandPalette) { setShowCommandPalette(false); return; }
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (createStatus !== null) { setCreateStatus(null); return; }
        if (openTask) { setOpenTask(null); return; }
        return;
      }

      if (isEditing) return;

      // 'C' opens task creation modal
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setCreateStatus('todo');
        return;
      }

      // '/' focuses search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
        return;
      }

      // '?' opens shortcuts modal
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, showShortcuts, createStatus, openTask]);

  /* ── Filter tasks client-side ───────────────────────────────────────── */
  const query = (navSearch || search).toLowerCase().trim();
  const filtered = tasks.filter(t => {
    const matchSearch   = !query || t.title.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query));
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const taskKey = (t) => `TASK-${tasks.indexOf(t) + 1}`;

  /* ── Create Task ────────────────────────────────────────────────────── */
  const handleCreate = async (payload) => {
    const created = await api.create(payload);
    setTasks(ts => [created, ...ts]);
    showToast('Task created successfully');
  };

  /* ── Update Task ────────────────────────────────────────────────────── */
  const handleUpdate = useCallback((id, changes) => {
    setTasks(ts => ts.map(t => t._id === id ? { ...t, ...changes } : t));
    if (openTask?._id === id) setOpenTask(t => ({ ...t, ...changes }));
  }, [openTask]);

  /* ── Drag-and-drop / Drop status change ─────────────────────────────── */
  const handleDrop = async (task, newStatus) => {
    const prev = task.status;
    // Optimistic update
    setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    if (openTask?._id === task._id) setOpenTask(t => ({ ...t, status: newStatus }));

    try {
      await api.update(task._id, { status: newStatus });
      showToast(`Status updated to ${newStatus.replace('-', ' ')}`);
    } catch (err) {
      // Rollback
      setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: prev } : t));
      if (openTask?._id === task._id) setOpenTask(t => ({ ...t, status: prev }));
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  /* ── Delete Task with 5s Undo Delay ─────────────────────────────────── */
  const handleDelete = (id, taskToDelete) => {
    const target = taskToDelete || tasks.find(t => t._id === id);
    if (!target) return;

    // Optimistically remove from state
    setTasks(ts => ts.filter(t => t._id !== id));
    if (openTask?._id === id) setOpenTask(null);

    // Schedule real delete after 5 seconds
    const timer = setTimeout(async () => {
      try {
        await api.remove(id);
        pendingDeletesRef.current.delete(id);
      } catch (err) {
        // Rollback if server fails
        setTasks(ts => [target, ...ts]);
        showToast(err.message || 'Failed to delete task', 'error');
      }
    }, 5000);

    pendingDeletesRef.current.set(id, { timer, task: target });

    // Show toast with Undo button
    showToast(
      `Deleted "${target.title.slice(0, 26)}${target.title.length > 26 ? '…' : ''}"`,
      'info',
      {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timer);
          pendingDeletesRef.current.delete(id);
          setTasks(ts => [target, ...ts]);
          showToast('Task restored');
        },
      },
      5000
    );
  };

  const clearFilters = () => {
    setNavSearch('');
    setSearch('');
    setPriorityFilter('');
  };
  const filtersActive = Boolean(navSearch || search || priorityFilter);

  return (
    <div className="app-shell">
      {/* ── Navbar ── */}
      <header className="navbar" role="banner">
        <a href="#main" className="navbar-brand" aria-label="TaskBoard home">
          <div className="navbar-brand-icon" aria-hidden="true">T</div>
          TaskBoard
        </a>

        {/* Global Search with / shortcut hint */}
        <div className="navbar-search-wrap">
          <SearchIcon size={14} />
          <input
            type="search"
            className="navbar-search"
            placeholder="Search tasks… (/)"
            value={navSearch}
            onChange={e => setNavSearch(e.target.value)}
            aria-label="Search tasks"
            id="global-search"
          />
        </div>

        {/* Navbar Right Actions */}
        <div className="navbar-right">
          {/* Quick Search Palette Trigger */}
          <button
            className="navbar-hint"
            onClick={() => setShowCommandPalette(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}
            aria-label="Open command palette quick search"
            title="Open command palette (⌘K)"
          >
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Quick search</span>
            <kbd className="kbd">⌘K</kbd>
          </button>

          {/* Theme Toggle Button */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={15} />}
          </button>

          {/* Shortcuts Cheat Sheet Modal Trigger */}
          <button
            className="icon-btn"
            onClick={() => setShowShortcuts(true)}
            aria-label="Keyboard shortcuts cheat-sheet (?)"
            title="Keyboard shortcuts (?)"
          >
            <HelpIcon size={15} />
          </button>

          {/* Create Button with C shortcut */}
          <button
            id="create-task-btn"
            className="btn-primary"
            onClick={() => setCreateStatus('todo')}
            aria-label="Create new task (C)"
            title="Create task (C)"
          >
            <PlusIcon size={13} />
            <span>Create</span>
            <kbd className="kbd" style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', fontSize: 10, padding: '1px 4px', marginLeft: 2 }}>
              C
            </kbd>
          </button>
        </div>
      </header>

      {/* ── Left Sidebar (Bottom Nav on mobile) ── */}
      <nav className="sidebar" aria-label="Main project navigation">
        <div className="sidebar-project" aria-label="Team info">
          <div className="sidebar-avatar" aria-hidden="true">DP</div>
          <div className="sidebar-project-info">
            <div className="sidebar-project-label">Team</div>
            <div className="sidebar-project-name">DataPure</div>
          </div>
        </div>

        <div className="sidebar-divider" aria-hidden="true" />

        <button
          className={`sidebar-nav-item${view === 'board' ? ' active' : ''}`}
          onClick={() => setView('board')}
          aria-current={view === 'board' ? 'page' : undefined}
          id="nav-board"
        >
          <BoardIcon size={16} />
          <span>Board</span>
        </button>

        <button
          className={`sidebar-nav-item${view === 'list' ? ' active' : ''}`}
          onClick={() => setView('list')}
          aria-current={view === 'list' ? 'page' : undefined}
          id="nav-list"
        >
          <ListIcon size={16} />
          <span>List</span>
        </button>
      </nav>

      {/* ── Main Content Area ── */}
      <main className="main-content" role="main" id="main">
        <div className="main-header">
          <nav className="breadcrumb" aria-label="Breadcrumb trail">
            <a href="#">Teams</a>
            <span className="breadcrumb-sep">/</span>
            <a href="#">DataPure</a>
          </nav>
          <h1 className="page-title">{view === 'board' ? 'Board' : 'List'}</h1>
        </div>

        {/* Filter bar */}
        <div className="filter-bar" role="search" aria-label="Filter tasks">
          <span className="filter-count" aria-live="polite">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </span>

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            aria-label="Filter tasks by priority"
            id="priority-filter"
          >
            {PRIORITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {filtersActive && (
            <button
              className="filter-clear"
              onClick={clearFilters}
              aria-label="Clear active filters"
            >
              Clear filters
            </button>
          )}

          <div className="filter-hints" aria-hidden="true">
            <div className="filter-hint-item">
              <span>Quick add:</span> <kbd className="kbd">C</kbd>
            </div>
            <div className="filter-hint-item">
              <span>Search:</span> <kbd className="kbd">/</kbd>
            </div>
            <div className="filter-hint-item">
              <span>Shortcuts:</span> <kbd className="kbd">?</kbd>
            </div>
          </div>
        </div>

        {/* Board or List View */}
        {view === 'board' ? (
          <BoardView
            tasks={filtered}
            loading={loading}
            onOpenTask={setOpenTask}
            onCreateInColumn={(status) => setCreateStatus(status)}
            onDrop={handleDrop}
          />
        ) : (
          <ListView
            tasks={filtered}
            loading={loading}
            onOpenTask={setOpenTask}
            onCreateInColumn={(status) => setCreateStatus(status)}
          />
        )}
      </main>

      {/* ── Slide-over Task Detail Panel ── */}
      {openTask && (
        <TaskPanel
          task={openTask}
          taskKey={taskKey(openTask)}
          onClose={() => setOpenTask(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          showToast={showToast}
        />
      )}

      {/* ── Create Task Modal ── */}
      {createStatus !== null && (
        <CreateModal
          initialStatus={createStatus}
          onClose={() => setCreateStatus(null)}
          onCreate={handleCreate}
        />
      )}

      {/* ── Keyboard Shortcuts Cheat-sheet Modal ── */}
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* ── Command Palette Quick Search Modal ── */}
      {showCommandPalette && (
        <CommandPalette
          tasks={tasks}
          onSelectTask={(task) => setOpenTask(task)}
          onClose={() => setShowCommandPalette(false)}
        />
      )}

      {/* ── Floating Toasts Stack with Undo & Dismiss ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
