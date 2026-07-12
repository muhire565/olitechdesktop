const STORAGE_KEY = "olitech-recent-staff";
const MAX_RECENT = 4;

export function getRecentStaff() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function rememberStaff(user) {
  if (!user?.id) return;
  const name = user.full_name || user.username || user.email || "Staff";
  const entry = {
    id: user.id,
    name,
    initials: initialsFrom(name),
    role: user.role,
    at: Date.now(),
  };
  const list = getRecentStaff().filter((s) => s.id !== entry.id);
  list.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

function initialsFrom(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
