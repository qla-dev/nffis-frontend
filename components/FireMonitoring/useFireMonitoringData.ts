import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFireHealth, fetchFireIncidentReports, fetchFireNotifications, fetchFires, fetchFireStatistics, FIRE_REFRESH_MS, type FireEventProperties, type FireHealth, type FireNotification, type FireStatistics } from '../../services/fireMonitoringService';
import type { FireIncidentReport } from '../../lib/fireIncidentGroups';

export function useFireMonitoringData() {
  const [stats, setStats] = useState<FireStatistics | null>(null);
  const [events, setEvents] = useState<FireEventProperties[]>([]);
  const [reports, setReports] = useState<FireIncidentReport[]>([]);
  const [health, setHealth] = useState<FireHealth | null>(null);
  const [notifications, setNotifications] = useState<FireNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const cursor = useRef<string>();
  const initial = useRef(true);
  const controller = useRef<AbortController>();

  const load = useCallback(async () => {
    if (document.hidden) return;
    controller.current?.abort();
    controller.current = new AbortController();
    const signal = controller.current.signal;
    try {
      const [nextStats, nextEvents, nextHealth, nextNotifications, nextReports] = await Promise.all([
        fetchFireStatistics(signal), fetchFires(signal, cursor.current), fetchFireHealth(signal),
        fetchFireNotifications(signal).catch(() => ({ data: [], unread_count: 0 })),
        initial.current ? fetchFireIncidentReports(signal).catch(() => ({ data: [] })) : Promise.resolve(null),
      ]);
      setStats(nextStats); setHealth(nextHealth); setNotifications(nextNotifications.data); setUnreadCount(nextNotifications.unread_count);
      setEvents(current => cursor.current
        ? [...new Map([...current, ...nextEvents.data].map(item => [item.id, item])).values()]
        : nextEvents.data);
      if (nextReports) setReports(nextReports.data);
      cursor.current = nextEvents.meta?.server_time || new Date().toISOString();
      initial.current = false; setError('');
    } catch (reason) {
      if ((reason as Error).name !== 'AbortError') setError((reason as Error).message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(load, FIRE_REFRESH_MS);
    const resume = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', resume);
    return () => { controller.current?.abort(); window.clearInterval(timer); document.removeEventListener('visibilitychange', resume); };
  }, [load]);

  return { stats, events, reports, health, notifications, unreadCount, error, loading, reload: load, setUnreadCount };
}
