import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useSetupFlow } from '../helpers/useSetupFlow';
import { Skeleton } from '../components/Skeleton';
import styles from './_index.module.css';

const KAIKOONLogo = () => (
  <img
    src="https://assets.floot.app/f2f6c53b-4f49-4b32-8826-0c9dc3d3ed07/d24a21e4-931c-419a-a3cf-989a5c69baa0.png"
    alt="KAIKOON Logo"
    width="120"
    height="120"
    className={styles.logo}
  />
);

const HomePage = () => {
  const navigate = useNavigate();
  const { needsSetup, isLoadingSettings, error } = useSetupFlow();

  useEffect(() => {
    // Only set up the timer once we know the setup status
    if (!isLoadingSettings && !error) {
      const timer = setTimeout(() => {
        if (needsSetup) {
          console.log('User needs setup, redirecting to setup page.');
          navigate('/setup');
        } else {
          console.log('User setup complete, redirecting to dashboard.');
          navigate('/dashboard');
        }
      }, 2500); // 2.5 seconds delay

      // Cleanup the timer if the component unmounts early.
      return () => clearTimeout(timer);
    }
  }, [navigate, needsSetup, isLoadingSettings, error]);

  const handleTapToContinue = () => {
    if (isLoadingSettings) return; // Don't allow tap while loading
    
    if (needsSetup) {
      navigate('/setup');
    } else {
      navigate('/dashboard');
    }
  };

  // Show error state if there's an error loading settings
  if (error) {
    console.error('Error loading user settings:', error);
    // Still show the splash screen but redirect to dashboard as fallback
    setTimeout(() => navigate('/dashboard'), 1000);
  }

  return (
    <>
      <Helmet>
        <title>Welcome to KAIKOON</title>
        <meta name="description" content="KAIKOON - Your focus, simplified." />
      </Helmet>
      <div className={styles.container} onClick={handleTapToContinue}>
        <div className={styles.content}>
          <KAIKOONLogo />
          <h1 className={styles.appName}>KAIKOON</h1>
          <p className={styles.tagline}>Tackle tasks, one step at a time.</p>
          {isLoadingSettings ? (
            <div className={styles.loadingState}>
              <Skeleton style={{ width: '120px', height: '1rem', margin: '0 auto' }} />
            </div>
          ) : (
            <p className={styles.tapHint}>Tap anywhere to continue</p>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;