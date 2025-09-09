import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { ReflectionLogs } from '../components/ReflectionLogs';
import styles from './reflection-logs.module.css';

export default function ReflectionLogsPage() {
  return (
    <>
      <Helmet>
        <title>Reflection Logs - KAIKOON</title>
        <meta name="description" content="View your past reflections and sentiment analysis history." />
      </Helmet>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <Button asChild variant="ghost" size="icon" aria-label="Go back to dashboard">
            <Link to="/dashboard">
              <ChevronLeft size={24} />
            </Link>
          </Button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Reflection History</h1>
            <p className={styles.subtitle}>
              Track your emotional patterns and review your progress over time.
            </p>
          </div>
          <div style={{ width: '2.5rem' }} /> {/* Spacer */}
        </header>
        <main className={styles.mainContent}>
          <ReflectionLogs />
        </main>
      </div>
    </>
  );
}