import React from 'react';
import { useReflectionLogs } from '../helpers/useReflectionLogs';
import { Skeleton } from './Skeleton';
import { AlertTriangle, Smile, Frown, Meh } from 'lucide-react';
import styles from './ReflectionLogs.module.css';

const EMOJIS = ['😢', '😐', '😊', '😍', '🥰'];

const SentimentDisplay = ({ sentiment }: { sentiment: string | null }) => {
  if (!sentiment) return null;

  const sentimentLower = sentiment.toLowerCase();

  switch (sentimentLower) {
    case 'positive':
      return <div className={`${styles.sentiment} ${styles.positive}`}><Smile size={16} /> Positive</div>;
    case 'negative':
      return <div className={`${styles.sentiment} ${styles.negative}`}><Frown size={16} /> Negative</div>;
    case 'neutral':
      return <div className={`${styles.sentiment} ${styles.neutral}`}><Meh size={16} /> Neutral</div>;
    default:
      return <div className={`${styles.sentiment} ${styles.neutral}`}>{sentiment}</div>;
  }
};

const ReflectionLogSkeleton = () => (
  <div className={styles.logCard}>
    <div className={styles.logHeader}>
      <Skeleton style={{ width: '60%', height: '1.5rem' }} />
      <Skeleton style={{ width: '30%', height: '1rem' }} />
    </div>
    <div className={styles.reflectionText}>
      <Skeleton style={{ width: '100%', height: '3rem' }} />
    </div>
    <div className={styles.logFooter}>
      <Skeleton style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-full)' }} />
      <Skeleton style={{ width: '100px', height: '1.5rem' }} />
    </div>
  </div>
);

export const ReflectionLogs = () => {
  const { data: logs, isLoading, isError, error } = useReflectionLogs();

  if (isLoading) {
    return (
      <div className={styles.container}>
        {Array.from({ length: 3 }).map((_, i) => <ReflectionLogSkeleton key={i} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.errorState}>
        <AlertTriangle size={48} color="var(--error)" />
        <h2>Failed to load reflections</h2>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>No Reflections Yet</h2>
        <p>Complete a task and leave a reflection to see your history here.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {logs.map((log) => (
        <div key={log.id} className={styles.logCard}>
          <div className={styles.logHeader}>
            <h3 className={styles.taskTitle}>{log.taskTitle}</h3>
            <span className={styles.logDate}>
              {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'No date'}
            </span>
          </div>
          {log.reflectionText && (
            <p className={styles.reflectionText}>"{log.reflectionText}"</p>
          )}
          <div className={styles.logFooter}>
            <span className={styles.emoji} aria-label="Emoji rating">
              {log.emojiRating ? EMOJIS[log.emojiRating - 1] : '?'}
            </span>
            <SentimentDisplay sentiment={log.sentiment} />
          </div>
        </div>
      ))}
    </div>
  );
};