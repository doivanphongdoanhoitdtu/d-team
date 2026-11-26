// Leak-free Web Notifications & in-session shift reminders

import { getTodayStr } from './date.js';

let swRegistration = null;
const activeTimers = new Map();

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  navigator.serviceWorker.register(swUrl)
    .then((reg) => {
      swRegistration = reg;
    })
    .catch((err) => {
      console.warn('[SW] Đăng ký thất bại:', err?.message || err);
    });
}

export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export async function showWebNotification(title, options = {}) {
  const iconUrl = `${import.meta.env.BASE_URL}logo.jpg`;
  const notifOptions = {
    icon: iconUrl,
    badge: iconUrl,
    ...options
  };

  if ('serviceWorker' in navigator) {
    try {
      const reg = swRegistration || await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch {
      // fallback to Notification constructor
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, notifOptions);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function getShiftStartTime(shiftType) {
  const type = String(shiftType || '').toLowerCase();
  if (type.includes('1')) return { hour: 7, minute: 30 };
  if (type.includes('2')) return { hour: 9, minute: 20 };
  if (type.includes('3')) return { hour: 13, minute: 0 };
  if (type.includes('4')) return { hour: 15, minute: 20 };
  return { hour: 7, minute: 30 };
}

export function clearAllShiftReminders() {
  for (const timerId of activeTimers.values()) {
    clearTimeout(timerId);
  }
  activeTimers.clear();
}

export function scheduleShiftReminder(shift, memberName = '') {
  if (!shift?.date || typeof window === 'undefined' || !('Notification' in window)) return false;

  const parts = String(shift.date).split('-').map(Number);
  if (parts.length < 3) return false;

  const { hour, minute } = getShiftStartTime(shift.shiftType);
  const shiftStart = new Date(parts[0], parts[1] - 1, parts[2], hour, minute, 0);
  const notifyAt = shiftStart.getTime() - 15 * 60 * 1000;
  const delay = notifyAt - Date.now();

  if (delay <= 0 || delay >= 24 * 60 * 60 * 1000) return false;

  const key = shift.id || `${shift.date}_${shift.shiftType}`;
  if (activeTimers.has(key)) {
    clearTimeout(activeTimers.get(key));
  }

  const timerId = setTimeout(() => {
    activeTimers.delete(key);
    if (Notification.permission === 'granted') {
      showWebNotification(`Nhắc lịch trực: ${shift.shiftType}`, {
        body: `Chào ${memberName || 'bạn'}, ca trực ${shift.shiftType} bắt đầu lúc ${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}.`,
        tag: `shift-${key}`
      });
    }
  }, delay);

  activeTimers.set(key, timerId);
  return true;
}

export function syncUpcomingShiftReminders(registrations = [], memberName = '') {
  clearAllShiftReminders();
  if (!Array.isArray(registrations) || registrations.length === 0) return 0;
  const today = getTodayStr();
  const upcoming = registrations.filter((r) => r && r.date && r.date >= today);
  let scheduled = 0;
  for (const reg of upcoming) {
    if (scheduleShiftReminder(reg, memberName)) scheduled += 1;
  }
  return scheduled;
}
