import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useSetupFlow } from '../helpers/useSetupFlow';
import { GradeSelector } from '../components/GradeSelector';
import { ClassesSelector } from '../components/ClassesSelector';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import styles from './setup.module.css';

const SetupSkeleton = () => (
  <div className={styles.container}>
    <div className={styles.card}>
      <div className={styles.header}>
        <Skeleton style={{ height: '2.25rem', width: '70%', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ height: '1.25rem', width: '50%' }} />
      </div>
      <div className={styles.progressIndicator}>
        <Skeleton style={{ height: '1rem', width: '100px' }} />
      </div>
      <div className={styles.content}>
        <Skeleton style={{ height: '1.5rem', width: '150px', marginBottom: 'var(--spacing-3)' }} />
        <Skeleton style={{ height: 'var(--touch-target-comfortable)' }} />
      </div>
      <div className={styles.footer}>
        <Skeleton style={{ height: 'var(--button-height-md)', width: '120px' }} />
      </div>
    </div>
  </div>
);

const SetupPage = () => {
  const navigate = useNavigate();
  const { settings, isLoadingSettings, completeSetup, isUpdatingSettings } = useSetupFlow();

  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState('');
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    if (settings) {
      // Pre-fill form if user comes back to setup
      setGrade(settings.grade || '');
      setClasses(settings.classes || []);
    }
  }, [settings]);

  const handleNext = () => {
    if (grade) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleDone = async () => {
    if (classes.length > 0) {
      await completeSetup(
        { grade, classes },
        {
          onSuccess: () => {
            navigate('/dashboard');
          },
        }
      );
    }
  };

  if (isLoadingSettings) {
    return <SetupSkeleton />;
  }

  return (
    <>
      <Helmet>
        <title>Setup | KAIKOON</title>
        <meta name="description" content="Set up your KAIKOON account." />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome to KAIKOON!</h1>
            <p className={styles.subtitle}>Let's get you set up in just two quick steps.</p>
          </div>

          <div className={styles.progressIndicator}>
            <span className={step === 1 ? styles.activeStep : styles.completedStep}>Step 1: Grade</span>
            <span className={styles.separator}>&rarr;</span>
            <span className={step === 2 ? styles.activeStep : ''}>Step 2: Classes</span>
          </div>

          {step === 1 && (
            <div className={styles.content}>
              <label htmlFor="grade-selector" className={styles.label}>
                First, what's your grade?
              </label>
              <GradeSelector
                id="grade-selector"
                value={grade}
                onChange={setGrade}
                disabled={isUpdatingSettings}
              />
              <div className={styles.footer}>
                <Button onClick={handleNext} disabled={!grade || isUpdatingSettings}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.content}>
              <label className={styles.label}>Great! Now, which classes are you taking?</label>
              <ClassesSelector
                selectedClasses={classes}
                onChange={setClasses}
                disabled={isUpdatingSettings}
              />
              <div className={styles.footer}>
                <Button variant="outline" onClick={handleBack} disabled={isUpdatingSettings}>
                  <ArrowLeft size={16} />
                  Back
                </Button>
                <Button onClick={handleDone} disabled={classes.length === 0 || isUpdatingSettings}>
                  {isUpdatingSettings ? 'Saving...' : 'Done'}
                  <Check size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SetupPage;