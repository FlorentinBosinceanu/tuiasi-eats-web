// ==========================================
// Notification & Sound Utilities
// ==========================================

/**
 * Request browser notification permission.
 * Call this early (e.g. on login or first interaction).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Show a browser notification (only if permission granted).
 */
export function showNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      icon: icon || '/tuiasi-eats-icon.png',
      badge: '/tuiasi-eats-icon.png',
      tag: 'tuiasi-eats', // replaces previous notification
    });
  } catch (e) {
    console.warn('Notification failed:', e);
  }
}

/**
 * Play a notification sound using Web Audio API.
 * type: 'order-ready' for student, 'new-order' for admin
 */
export function playNotificationSound(type: 'order-ready' | 'new-order' | 'status-update' = 'status-update') {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

    if (type === 'new-order') {
      // Double beep for admin: new order
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } else if (type === 'order-ready') {
      // Triple ascending beep for student: order ready
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.24);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } else {
      // Single beep for generic status update
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn('Sound failed:', e);
  }
}

/**
 * Format an order ID to a readable number: e.g. "20260311-A3F2"
 * Takes the created_at timestamp + first 4 chars of UUID
 */
export function formatOrderNumber(orderId: string, createdAt?: string): string {
  const date = createdAt ? new Date(createdAt) : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const suffix = orderId.substring(0, 4).toUpperCase();
  return `${y}${m}${d}-${suffix}`;
}
