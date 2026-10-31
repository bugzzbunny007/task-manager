import React from 'react';

/* ─── Priority Icons (Crisp 14x14 / 16x16 SVG) ─── */
export const PriorityIcon = ({ priority, size = 14 }) => {
  if (priority === 'high') {
    return (
      <span className="priority-icon" title="High priority" aria-label="High priority">
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor">
          <path d="M4 10.5L8 6.5L12 10.5" stroke="var(--priority-high, #C9372C)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 6.5L8 2.5L12 6.5" stroke="var(--priority-high, #C9372C)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (priority === 'medium') {
    return (
      <span className="priority-icon" title="Medium priority" aria-label="Medium priority">
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x="2.5" y="5.5" width="11" height="2" rx="1" fill="var(--priority-medium, #CA8A04)"/>
          <rect x="2.5" y="9.5" width="11" height="2" rx="1" fill="var(--priority-medium, #CA8A04)"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="priority-icon" title="Low priority" aria-label="Low priority">
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M4 5.5L8 9.5L12 5.5" stroke="var(--priority-low, #0C66E4)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 9.5L8 13.5L12 9.5" stroke="var(--priority-low, #0C66E4)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
};

/* ─── Status Lozenge ─── */
export const StatusLozenge = ({ status, pulse = false }) => {
  const map = {
    'todo':        { cls: 'loz-todo',     label: 'To Do' },
    'in-progress': { cls: 'loz-progress', label: 'In Progress' },
    'done':        { cls: 'loz-done',     label: 'Done' },
  };
  const { cls, label } = map[status] || map['todo'];
  return (
    <span className={`lozenge ${cls}${pulse ? ' loz-pulse' : ''}`}>
      {status === 'done' && (
        <svg className="loz-check" width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginRight: 4 }}>
          <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {label}
    </span>
  );
};

/* ─── Clean 1px stroke SVG Icons ─── */
export const SearchIcon = ({ size = 15 }) => (
  <svg className="navbar-search-icon" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <circle cx="7" cy="7" r="4.5" strokeWidth="1.5"/>
    <path d="M10.5 10.5L14 14" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const BoardIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2.5" width="3.5" height="11" rx="1"/>
    <rect x="7.5" y="2.5" width="3.5" height="7.5" rx="1"/>
    <rect x="7.5" y="11.5" width="3.5" height="2" rx="0.75"/>
    <rect x="13" y="2.5" width="1" height="11" rx="0.5"/>
  </svg>
);

export const ListIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M5.5 4.5H13.5M5.5 8H13.5M5.5 11.5H13.5" strokeLinecap="round"/>
    <circle cx="3" cy="4.5" r="1" fill="currentColor"/>
    <circle cx="3" cy="8" r="1" fill="currentColor"/>
    <circle cx="3" cy="11.5" r="1" fill="currentColor"/>
  </svg>
);

export const CalendarIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3.5" width="12" height="10.5" rx="1.5"/>
    <path d="M5 2V4M11 2V4M2 6.5H14" strokeLinecap="round"/>
  </svg>
);

export const SunIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="3"/>
    <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M3.4 12.6L4.5 11.5M11.5 4.5L12.6 3.4" strokeLinecap="round"/>
  </svg>
);

export const MoonIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13.5 9.5C12.5 13 8.5 14.5 5 13C3 12 1.8 10 1.5 8C2.5 8.5 4 8.5 5.5 7.5C7.2 6.3 8 4.2 7.5 2C10 2.5 12.5 4.5 13 7C13.2 7.8 13.4 8.7 13.5 9.5Z" strokeLinejoin="round"/>
  </svg>
);

export const HelpIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.5"/>
    <path d="M6.5 6.25C6.5 5.25 7.2 4.5 8 4.5C8.8 4.5 9.5 5.1 9.5 6C9.5 6.8 8.9 7.4 8.3 7.8C7.9 8.1 7.7 8.5 7.7 9" strokeLinecap="round"/>
    <circle cx="7.7" cy="11.5" r="0.6" fill="currentColor"/>
  </svg>
);

export const CloseIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M4 4L12 12M12 4L4 12" strokeLinecap="round"/>
  </svg>
);

export const PlusIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M8 3V13M3 8H13" strokeLinecap="round"/>
  </svg>
);

export const TrashIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 4.5H13M6 4.5V2.5C6 2.2 6.2 2 6.5 2H9.5C9.8 2 10 2.2 10 2.5V4.5M12 4.5V13C12 13.6 11.5 14 11 14H5C4.5 14 4 13.6 4 13V4.5M6.5 7.5V11M9.5 7.5V11" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UndoIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 6.5L1.5 4L4 1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 4H10.5C12.5 4 14 5.5 14 7.5C14 9.5 12.5 11 10.5 11H5" strokeLinecap="round"/>
  </svg>
);

/* ─── Empty state inline SVG illustration ─── */
export const EmptyIllustration = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-svg">
    <rect x="12" y="14" width="40" height="36" rx="6" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="4 4" fill="var(--surface-1)"/>
    <rect x="18" y="22" width="28" height="4" rx="2" fill="var(--n-300)" opacity="0.6"/>
    <rect x="18" y="30" width="18" height="4" rx="2" fill="var(--n-300)" opacity="0.4"/>
    <circle cx="44" cy="40" r="10" fill="var(--color-primary-subtle)" stroke="var(--color-primary)" strokeWidth="1.5"/>
    <path d="M44 36V44M40 40H48" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
