export const ROLE_META = {
  admin: {
    key: 'admin',
    label: 'Admin',
    shortLabel: 'ADM',
    color: '#f59e0b',
    bg: 'color-mix(in srgb,#f59e0b 12%,transparent)',
    border: 'color-mix(in srgb,#f59e0b 30%,transparent)',
  },
  operator: {
    key: 'operator',
    label: 'Petugas',
    shortLabel: 'PTG',
    color: '#60a5fa',
    bg: 'color-mix(in srgb,#60a5fa 12%,transparent)',
    border: 'color-mix(in srgb,#60a5fa 30%,transparent)',
  },
  user: {
    key: 'user',
    label: 'Owner',
    shortLabel: 'OWN',
    color: 'var(--accent)',
    bg: 'color-mix(in srgb,var(--accent) 12%,transparent)',
    border: 'color-mix(in srgb,var(--accent) 30%,transparent)',
  },
};

export function getRoleMeta(role) {
  return ROLE_META[role] || ROLE_META.user;
}

export function getRoleLabel(role) {
  return getRoleMeta(role).label;
}

