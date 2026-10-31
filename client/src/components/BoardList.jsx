import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { PriorityIcon, StatusLozenge, CalendarIcon, PlusIcon, EmptyIllustration } from './Icons.jsx';
import MoveSheet from './MoveSheet.jsx';

function isOverdue(task) {
  if (!task.dueDate || task.status === 'done') return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getInitials(title) {
  if (!title) return 'TS';
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* ─── Memoized Task Card ──────────────────────────────────────────────── */
export const TaskCard = memo(function TaskCard({
  task,
  taskKey,
  isPickedUp = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClick,
  onLongPress,
  onCardKeyDown,
}) {
  const overdue = isOverdue(task);
  const touchTimer = useRef(null);

  const handleTouchStart = () => {
    touchTimer.current = setTimeout(() => {
      onLongPress?.(task);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
  };

  return (
    <article
      className={`task-card${isDragging ? ' dragging' : ''}${isPickedUp ? ' is-picked-up' : ''}`}
      data-priority={task.priority}
      data-id={task._id}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onClick={() => onClick(task)}
      onKeyDown={(e) => onCardKeyDown?.(e, task)}
      tabIndex={0}
      role="button"
      aria-grabbed={isPickedUp ? 'true' : 'false'}
      aria-label={`Task: ${task.title}. Key: ${taskKey}. Priority: ${task.priority}. Status: ${task.status}.${isPickedUp ? ' (Picked up: use left/right arrow keys then Enter to drop)' : ''}`}
    >
      <div className="task-card-header">
        <p className="task-card-title">{task.title}</p>
        <div className="task-card-avatar" title={`Assignee initials for ${task.title}`}>
          {getInitials(task.title)}
        </div>
      </div>

      <div className="task-card-meta">
        <span className="task-key">{taskKey}</span>
        <PriorityIcon priority={task.priority} />
        {task.dueDate && (
          <span className={`due-chip${overdue ? ' overdue' : ''}`} title={overdue ? 'Overdue' : 'Due date'}>
            <CalendarIcon />
            {fmtDate(task.dueDate)}{overdue ? ' !' : ''}
          </span>
        )}
      </div>
    </article>
  );
});

const COLUMNS = [
  { id: 'todo',        label: 'TO DO',       dotClass: 'todo' },
  { id: 'in-progress', label: 'IN PROGRESS', dotClass: 'progress' },
  { id: 'done',        label: 'DONE',        dotClass: 'done' },
];

/* ─── Board View ──────────────────────────────────────────────────────── */
export function BoardView({ tasks, loading, onOpenTask, onCreateInColumn, onDrop }) {
  const [dragOverCol, setDragOverCol] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [pickedUpTaskId, setPickedUpTaskId] = useState(null);
  const [mobileMoveTask, setMobileMoveTask] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [prevCounts, setPrevCounts] = useState({});

  const draggingTaskRef = useRef(null);
  const boardRegionRef = useRef(null);

  const byStatus = useCallback((statusId) => tasks.filter(t => t.status === statusId), [tasks]);
  const taskKey  = (t) => `TASK-${tasks.indexOf(t) + 1}`;

  // Bump count badge animation tracker
  useEffect(() => {
    const currentCounts = {
      todo: byStatus('todo').length,
      'in-progress': byStatus('in-progress').length,
      done: byStatus('done').length,
    };
    setPrevCounts(currentCounts);
  }, [tasks, byStatus]);

  /* ── Drag & Drop Handlers ── */
  const handleDragStart = (e, task) => {
    e.stopPropagation();

    // Clear any text selection in the window that could cause the browser to drag multiple elements
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }

    draggingTaskRef.current = task;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task._id);

    // Explicitly set drag image to ONLY the single card element being picked up
    if (e.dataTransfer.setDragImage && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = Math.max(16, Math.min(e.clientX - rect.left, rect.width - 16));
      const offsetY = Math.max(16, Math.min(e.clientY - rect.top, rect.height - 16));
      e.dataTransfer.setDragImage(e.currentTarget, offsetX, offsetY);
    }

    // Defer state update so the browser captures only this single card's snapshot first
    requestAnimationFrame(() => {
      setDraggedTaskId(task._id);
    });
  };

  const handleDragEnd = (e) => {
    e?.stopPropagation?.();
    draggingTaskRef.current = null;
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    // Only highlight as target if hovering over a different column than the task's current column
    if (draggingTaskRef.current && draggingTaskRef.current.status !== colId) {
      if (dragOverCol !== colId) {
        setDragOverCol(colId);
      }
    } else {
      if (dragOverCol !== null) {
        setDragOverCol(null);
      }
    }
  };

  const handleDropEvent = (e, colId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCol(null);
    setDraggedTaskId(null);
    const task = draggingTaskRef.current;
    if (task && task.status !== colId) {
      onDrop(task, colId);
      const colObj = COLUMNS.find(c => c.id === colId);
      setAnnouncement(`Moved ${task.title} to ${colObj ? colObj.label : colId}`);
    }
    draggingTaskRef.current = null;
  };

  /* ── Full Keyboard Accessible Reordering ── */
  const handleCardKeyDown = (e, task) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      if (pickedUpTaskId === task._id) {
        setPickedUpTaskId(null);
        setAnnouncement(`Cancelled movement for ${task.title}`);
      } else {
        setPickedUpTaskId(task._id);
        setAnnouncement(`Picked up ${task.title}. Press Left or Right arrows to change column, Enter to drop.`);
      }
      return;
    }

    if (e.key === 'Escape' && pickedUpTaskId) {
      e.preventDefault();
      setPickedUpTaskId(null);
      setAnnouncement(`Cancelled movement for ${task.title}`);
      return;
    }

    if (pickedUpTaskId === task._id) {
      const colOrder = ['todo', 'in-progress', 'done'];
      const currentIndex = colOrder.indexOf(task.status);

      if (e.key === 'ArrowRight' && currentIndex < colOrder.length - 1) {
        e.preventDefault();
        const nextStatus = colOrder[currentIndex + 1];
        onDrop(task, nextStatus);
        setAnnouncement(`Moved ${task.title} to ${COLUMNS[currentIndex + 1].label}. Press Enter to drop.`);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        const prevStatus = colOrder[currentIndex - 1];
        onDrop(task, prevStatus);
        setAnnouncement(`Moved ${task.title} to ${COLUMNS[currentIndex - 1].label}. Press Enter to drop.`);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setPickedUpTaskId(null);
        const colObj = COLUMNS.find(c => c.id === task.status);
        setAnnouncement(`Dropped ${task.title} in ${colObj?.label}`);
      }
      return;
    }

    // Default keyboard behavior: Enter opens task
    if (e.key === 'Enter') {
      e.preventDefault();
      onOpenTask(task);
      return;
    }

    // Arrow navigation between cards in board
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const allCards = Array.from(boardRegionRef.current?.querySelectorAll('.task-card') || []);
      const idx = allCards.indexOf(e.currentTarget);
      if (idx !== -1) {
        if (e.key === 'ArrowDown' && idx < allCards.length - 1) {
          e.preventDefault();
          allCards[idx + 1]?.focus();
        } else if (e.key === 'ArrowUp' && idx > 0) {
          e.preventDefault();
          allCards[idx - 1]?.focus();
        }
      }
    }
  };

  /* ── Skeleton Loading ── */
  if (loading) {
    return (
      <div className="board-scroll">
        <div className="board" aria-label="Loading task board">
          {COLUMNS.map(col => (
            <div key={col.id} className="column" aria-hidden="true">
              <div className="column-header">
                <span className={`column-dot ${col.dotClass}`} />
                <span className="column-title">{col.label}</span>
                <span className="column-count">3</span>
              </div>
              <div className="column-body">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-meta" />
                    <div className="skeleton-line skeleton-meta2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="board-scroll" ref={boardRegionRef}>
      {/* Aria Live Announcement Region */}
      <div className="sr-only" aria-live="assertive" role="status" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {announcement}
      </div>

      <div className="board" role="region" aria-label="Task Kanban Board">
        {COLUMNS.map(col => {
          const colTasks = byStatus(col.id);
          const isTarget = dragOverCol === col.id;

          return (
            <section
              key={col.id}
              className={`column${isTarget ? ' drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget)) return;
                setDragOverCol(null);
              }}
              onDrop={(e) => handleDropEvent(e, col.id)}
              aria-label={`${col.label} column`}
            >
              {/* Sticky Column Header */}
              <div className="column-header">
                <span className={`column-dot ${col.dotClass}`} aria-hidden="true" />
                <span className="column-title">{col.label}</span>
                <span
                  key={colTasks.length}
                  className="column-count bump"
                  aria-label={`${colTasks.length} tasks in ${col.label}`}
                >
                  {colTasks.length}
                </span>
                <button
                  className="btn-header-add"
                  onClick={() => onCreateInColumn(col.id)}
                  aria-label={`Add task to ${col.label}`}
                  title={`Add task to ${col.label}`}
                >
                  <PlusIcon size={13} />
                </button>
              </div>

              {/* Column Body with Cards */}
              <div className="column-body" role="list">
                {colTasks.length === 0 ? (
                  <div className="column-empty" role="status">
                    <EmptyIllustration size={48} />
                    <p>No tasks in {col.label.toLowerCase()}</p>
                    <button
                      className="btn-secondary"
                      onClick={() => onCreateInColumn(col.id)}
                      style={{ fontSize: 12, padding: '4px 10px', marginTop: 4 }}
                      aria-label={`Add task to ${col.label}`}
                    >
                      <PlusIcon size={12} /> Add Task
                    </button>
                  </div>
                ) : (
                  colTasks.map(t => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      taskKey={taskKey(t)}
                      isPickedUp={pickedUpTaskId === t._id}
                      isDragging={draggedTaskId === t._id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onClick={onOpenTask}
                      onLongPress={(taskToMove) => setMobileMoveTask(taskToMove)}
                      onCardKeyDown={handleCardKeyDown}
                    />
                  ))
                )}
                {isTarget && draggingTaskRef.current && draggingTaskRef.current.status !== col.id && (
                  <div
                    className="drop-placeholder"
                    style={{
                      border: '2px dashed var(--color-primary)',
                      borderRadius: 'var(--r-lg)',
                      height: 52,
                      background: 'var(--color-primary-subtle)',
                      transition: 'all var(--dur-base) var(--ease)',
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Column Footer */}
              <div className="column-footer">
                <button
                  className="btn-add-col"
                  onClick={() => onCreateInColumn(col.id)}
                  aria-label={`Create task in ${col.label}`}
                >
                  <PlusIcon size={14} />
                  <span>Create</span>
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* Mobile Long-Press Move Sheet Fallback */}
      {mobileMoveTask && (
        <MoveSheet
          task={mobileMoveTask}
          currentStatus={mobileMoveTask.status}
          onMove={(task, newStatus) => {
            onDrop(task, newStatus);
            setAnnouncement(`Moved ${task.title} to ${newStatus}`);
          }}
          onClose={() => setMobileMoveTask(null)}
        />
      )}
    </div>
  );
}

/* ─── List View ───────────────────────────────────────────────────────── */
export function ListView({ tasks, loading, onOpenTask, onCreateInColumn }) {
  const [sortField, setSortField] = useState('title');
  const [sortDir,   setSortDir]   = useState('asc');

  const taskKey = (t) => `TASK-${tasks.indexOf(t) + 1}`;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...tasks].sort((a, b) => {
    let va = a[sortField] ?? '';
    let vb = b[sortField] ?? '';
    if (sortField === 'dueDate') {
      va = va ? new Date(va).getTime() : Infinity;
      vb = vb ? new Date(vb).getTime() : Infinity;
    }
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIndicator = ({ field }) => {
    if (sortField !== field) {
      return (
        <span className="sort-indicator" aria-hidden="true" style={{ opacity: 0.4 }}>
          ↕
        </span>
      );
    }
    return (
      <span className="sort-indicator" aria-hidden="true" style={{ color: 'var(--color-primary)' }}>
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const fmtFullDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="list-wrap">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '24px 0' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card" style={{ height: 44, padding: '12px 16px' }}>
              <div className="skeleton-line" style={{ width: '60%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="list-wrap">
      <table className="list-table" aria-label="Task list">
        <thead>
          <tr>
            <th style={{ width: 100 }}>Key</th>
            <th
              className="sortable"
              onClick={() => handleSort('title')}
              aria-sort={sortField === 'title' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Title <SortIndicator field="title" />
            </th>
            <th
              className="sortable"
              style={{ width: 140 }}
              onClick={() => handleSort('status')}
              aria-sort={sortField === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Status <SortIndicator field="status" />
            </th>
            <th
              className="sortable"
              style={{ width: 120 }}
              onClick={() => handleSort('priority')}
              aria-sort={sortField === 'priority' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Priority <SortIndicator field="priority" />
            </th>
            <th
              className="sortable"
              style={{ width: 140 }}
              onClick={() => handleSort('dueDate')}
              aria-sort={sortField === 'dueDate' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Due Date <SortIndicator field="dueDate" />
            </th>
            <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <EmptyIllustration size={48} />
                  <p style={{ color: 'var(--text-subtle)', fontSize: 13 }}>No tasks found matching your filters</p>
                </div>
              </td>
            </tr>
          ) : (
            sorted.map((t) => (
              <tr key={t._id}>
                <td>
                  <span className="task-key">{taskKey(t)}</span>
                </td>
                <td
                  className="task-title-cell"
                  onClick={() => onOpenTask(t)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={e => { if (e.key === 'Enter') onOpenTask(t); }}
                  aria-label={`Open task: ${t.title}`}
                >
                  {t.title}
                </td>
                <td>
                  <StatusLozenge status={t.status} />
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <PriorityIcon priority={t.priority} />
                    <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{t.priority}</span>
                  </span>
                </td>
                <td style={{ fontSize: 13, color: isOverdue(t) ? 'var(--color-danger)' : 'var(--text-subtle)', fontWeight: isOverdue(t) ? 600 : 400 }}>
                  {fmtFullDate(t.dueDate)} {isOverdue(t) && '!'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: '4px 10px' }}
                    onClick={() => onOpenTask(t)}
                    aria-label={`Open task ${t.title}`}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
