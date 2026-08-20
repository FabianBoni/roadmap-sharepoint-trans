import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { FiActivity } from 'react-icons/fi';
import { INSTANCE_COOKIE_NAME, INSTANCE_QUERY_PARAM } from '@/utils/instanceConfig';
import { prefixBasePath } from '@/utils/nextBasePath';
import styles from './ActivityIndicator.module.css';

const POLL_INTERVAL_MS = 15_000;
const RECENT_LIMIT = 8;

type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityLabel: string | null;
  actorDisplayName: string | null;
  instanceSlug: string | null;
  occurredAt: string;
};

type ActivityPayload = {
  items?: unknown;
};

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeItem = (value: unknown): ActivityItem | null => {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const id = readString(item.id);
  const action = readString(item.action);
  const entityType = readString(item.entityType);
  const occurredAt = readString(item.occurredAt) || readString(item.createdAt);
  if (!id || !action || !entityType || !occurredAt) return null;

  return {
    id,
    action,
    entityType,
    entityLabel: readString(item.entityLabel),
    actorDisplayName: readString(item.actorDisplayName) || readString(item.actorName),
    instanceSlug: readString(item.instanceSlug),
    occurredAt,
  };
};

const entityTypeLabel = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '');
  const labels: Record<string, string> = {
    project: 'Projekt',
    category: 'Kategorie',
    projectcategory: 'Kategorie',
    setting: 'Einstellung',
    instance: 'Roadmap',
    roadmapinstance: 'Roadmap',
    attachment: 'Anhang',
    feedback: 'Rückmeldung',
    feedbackvote: 'Abstimmung',
    projectorder: 'Projektreihenfolge',
    categoryorder: 'Kategorienreihenfolge',
    user: 'Benutzerkonto',
    access: 'Berechtigung',
  };
  return labels[normalized] || value;
};

const activityText = (item: ActivityItem): string => {
  const actor = item.actorDisplayName || 'Jemand';
  const target = item.entityLabel || entityTypeLabel(item.entityType);
  const action = item.action.trim().toLowerCase();
  const verb = action.split('.').at(-1) || action;

  if (['create', 'created'].includes(verb)) return `${actor} hat ${target} erstellt`;
  if (['update', 'updated', 'edit', 'edited'].includes(verb)) {
    return `${actor} hat ${target} bearbeitet`;
  }
  if (['delete', 'deleted'].includes(verb)) return `${actor} hat ${target} gelöscht`;
  if (['publish', 'published'].includes(verb)) return `${actor} hat ${target} veröffentlicht`;
  if (['reorder', 'reordered'].includes(verb)) return `${actor} hat ${target} neu sortiert`;
  if (['upload', 'uploaded'].includes(verb)) return `${actor} hat ${target} hochgeladen`;
  if (['vote', 'vote_set'].includes(verb)) return `${actor} hat für ${target} abgestimmt`;
  return `${actor} hat ${target} geändert`;
};

const relativeTime = (isoDate: string, now: number): string => {
  const timestamp = Date.parse(isoDate);
  if (!Number.isFinite(timestamp)) return '';
  const seconds = Math.round((timestamp - now) / 1000);
  const formatter = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
};

const getCookieInstance = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${INSTANCE_COOKIE_NAME}=([^;\\s]+)`, 'i')
  );
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const ActivityIndicator = () => {
  const router = useRouter();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const queryInstance = useMemo(() => {
    const raw = router.query?.[INSTANCE_QUERY_PARAM];
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query]);

  useEffect(() => {
    if (!router.isReady) return;

    const controller = new AbortController();
    let stopped = false;
    let authorized = true;
    let inFlight: Promise<void> | null = null;
    let lastRequestAt = 0;
    const instanceSlug = queryInstance || getCookieInstance();

    // Never keep activities from the previous tenant visible while the next
    // instance is being resolved.
    setItems([]);
    setLoading(true);
    setUnavailable(false);
    setAccessDenied(false);

    // Pages such as the sign-in screen do not have a roadmap context. Avoid a
    // pointless 404 poll there and show the indicator only inside an instance.
    if (!instanceSlug) {
      setLoading(false);
      setAccessDenied(true);
      return () => controller.abort();
    }

    const load = (): Promise<void> => {
      if (stopped || !authorized || document.visibilityState === 'hidden') {
        return Promise.resolve();
      }
      if (inFlight) return inFlight;

      const params = new URLSearchParams({ limit: String(RECENT_LIMIT) });
      params.set(INSTANCE_QUERY_PARAM, instanceSlug);
      lastRequestAt = Date.now();

      inFlight = fetch(prefixBasePath(`/api/activity/recent?${params.toString()}`), {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      })
        .then(async (response) => {
          if (response.status === 401 || response.status === 403) {
            authorized = false;
            setItems([]);
            setUnavailable(false);
            setAccessDenied(true);
            setLoading(false);
            return;
          }
          if (!response.ok) throw new Error(`Activity request failed (${response.status})`);

          const payload = (await response.json()) as ActivityPayload;
          const nextItems = Array.isArray(payload.items)
            ? payload.items.map(normalizeItem).filter((item): item is ActivityItem => Boolean(item))
            : [];
          setItems(nextItems);
          setUnavailable(false);
          setLoading(false);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setUnavailable(true);
          setLoading(false);
        })
        .finally(() => {
          inFlight = null;
        });

      return inFlight;
    };

    void load();
    const interval = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastRequestAt >= POLL_INTERVAL_MS
      ) {
        void load();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryInstance, router.isReady]);

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.relatedTarget || !rootRef.current?.contains(event.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }
  };

  if (accessDenied) return null;

  const now = Date.now();
  return (
    <div
      ref={rootRef}
      className={styles.root}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <section
        id="recent-activity-panel"
        className={styles.panel}
        data-open={open}
        aria-label="Letzte Aktivitäten"
        aria-hidden={!open}
      >
        <div className={styles.panelHeader}>
          <strong>Letzte Aktivitäten</strong>
          <span>Live</span>
        </div>

        {loading ? (
          <p className={styles.empty}>Aktivitäten werden geladen …</p>
        ) : unavailable && items.length === 0 ? (
          <p className={styles.empty}>Aktivitäten sind gerade nicht verfügbar.</p>
        ) : items.length > 0 ? (
          <ol className={styles.list}>
            {items.map((item) => (
              <li key={item.id} className={styles.item}>
                <span className={styles.itemDot} aria-hidden="true" />
                <span className={styles.itemBody}>
                  <span className={styles.itemText}>{activityText(item)}</span>
                  <time dateTime={item.occurredAt} className={styles.itemTime}>
                    {relativeTime(item.occurredAt, now)}
                  </time>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>Noch keine Aktivitäten vorhanden.</p>
        )}
      </section>

      <button
        type="button"
        className={styles.trigger}
        aria-label="Letzte Aktivitäten anzeigen"
        aria-expanded={open}
        aria-controls="recent-activity-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <FiActivity aria-hidden="true" />
        <span className={styles.triggerText}>Aktivität</span>
        {items.length > 0 ? <span className={styles.count}>{items.length}</span> : null}
      </button>
    </div>
  );
};

export default ActivityIndicator;
