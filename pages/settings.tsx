import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ChevronLeft, User, Accessibility, Trash2, AlertTriangle, Music, Bell, LogOut } from 'lucide-react';
import { useSettings, useUpdateSettings, useClearData } from '../helpers/useSettingsQueries';
import { useAuth } from '../helpers/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Switch } from '../components/Switch';
import { Skeleton } from '../components/Skeleton';
import { SettingsSection } from '../components/SettingsSection';
import { GradeSelector } from '../components/GradeSelector';
import { ClassesSelector } from '../components/ClassesSelector';
import { Input } from '../components/Input';
import { Slider } from '../components/Slider';
import { useNotifications } from '../helpers/useNotifications';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '../components/Dialog';
import styles from './settings.module.css';
import { toast } from 'sonner';

const SettingsSkeleton = () => (
  <div className={styles.container}>
    <header className={styles.header}>
      <Skeleton style={{ height: '2.5rem', width: '2.5rem', borderRadius: 'var(--radius-full)' }} />
      <Skeleton style={{ height: '1.75rem', width: '120px' }} />
      <div style={{ width: '2.5rem' }} />
    </header>
    <main className={styles.mainContent}>
      <div className={styles.sectionSkeleton}>
        <Skeleton style={{ height: '1.5rem', width: '100px', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ height: '1rem', width: '200px', marginBottom: 'var(--spacing-4)' }} />
        <Skeleton style={{ height: '2.5rem', marginBottom: 'var(--spacing-3)' }} />
        <Skeleton style={{ height: '6rem' }} />
      </div>
      <div className={styles.sectionSkeleton}>
        <Skeleton style={{ height: '1.5rem', width: '120px', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ height: '1rem', width: '220px', marginBottom: 'var(--spacing-4)' }} />
        <Skeleton style={{ height: '2.5rem', marginBottom: 'var(--spacing-3)' }} />
        <Skeleton style={{ height: '2.5rem' }} />
      </div>
    </main>
  </div>
);

const SettingsPage = () => {
  const { data: settings, isLoading, error } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const clearDataMutation = useClearData();
  const [isClearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { permission, requestPermission } = useNotifications();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleUpdate = <K extends keyof NonNullable<typeof settings>>(
    key: K,
    value: NonNullable<typeof settings>[K]
  ) => {
    if (!settings) return;
    updateSettingsMutation.mutate(
      { ...settings, [key]: value },
      {
        onSuccess: () => {
          toast.success('Settings saved!');
        },
        onError: (e) => {
          const errorMessage = e instanceof Error ? e.message : 'Failed to save settings.';
          toast.error(errorMessage);
        },
      }
    );
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        toast.error('Notifications permission is required to enable notifications.');
        return;
      }
    }
    handleUpdate('notificationsEnabled', enabled);
  };

  const handleClearData = () => {
    clearDataMutation.mutate(undefined, {
      onSuccess: () => {
        setClearConfirmOpen(false);
        toast.success('All your data has been cleared.');
      },
      onError: (e) => {
        const errorMessage = e instanceof Error ? e.message : 'Failed to clear data.';
        toast.error(errorMessage);
      },
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log out.';
      toast.error(errorMessage);
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (error || !settings) {
    return (
      <div className={styles.errorState}>
        <p>Could not load settings.</p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings | KAIKOON</title>
        <meta name="description" content="Manage your KAIKOON app settings." />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <Button asChild variant="ghost" size="icon" aria-label="Go back to dashboard">
            <Link to="/dashboard">
              <ChevronLeft size={24} />
            </Link>
          </Button>
          <h1 className={styles.title}>Settings</h1>
          <div style={{ width: '2.5rem' }} /> {/* Spacer */}
        </header>

        <main className={styles.mainContent}>
          <SettingsSection
            icon={<User />}
            title="Profile"
            description="Personalize your experience."
          >
            <div className={styles.settingItem}>
              <label htmlFor="grade-selector" className={styles.settingLabel}>
                Grade
              </label>
              <GradeSelector
                id="grade-selector"
                value={settings.grade ?? ''}
                onChange={(value) => handleUpdate('grade', value)}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
            <div className={styles.settingItem}>
              <label className={styles.settingLabel}>Classes</label>
              <ClassesSelector
                selectedClasses={settings.classes ?? []}
                onChange={(value) => handleUpdate('classes', value)}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Music />}
            title="Kaibeat"
            description="Connect your music playlist for focus sessions."
          >
            <div className={styles.settingItem}>
              <label htmlFor="kaibeat-playlist" className={styles.settingLabel}>
                Playlist URL
              </label>
              <Input
                id="kaibeat-playlist"
                type="url"
                placeholder="Enter your YouTube or Spotify playlist URL"
                value={settings.kaibeatPlaylistUrl ?? ''}
                onChange={(e) => handleUpdate('kaibeatPlaylistUrl', e.target.value || null)}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Bell />}
            title="Notifications"
            description="Manage your notification preferences and reminders."
          >
            <div className={styles.switchItem}>
              <div>
                <label htmlFor="notifications-enabled" className={styles.settingLabel}>
                  Enable Notifications
                </label>
                <p className={styles.settingDescription}>
                  Allow KAIKOON to send you helpful reminders and celebrations
                </p>
              </div>
              <Switch
                id="notifications-enabled"
                checked={settings.notificationsEnabled ?? false}
                onCheckedChange={handleNotificationsToggle}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
            
            {permission === 'denied' && (
              <div className={styles.permissionWarning}>
                <AlertTriangle size={16} />
                <span>Notifications are blocked in your browser. Please enable them in your browser settings to receive notifications.</span>
              </div>
            )}

            <div className={styles.switchItem}>
              <div>
                <label htmlFor="break-reminders" className={styles.settingLabel}>
                  Break Reminders
                </label>
                <p className={styles.settingDescription}>
                  Get reminded to take breaks during focus sessions
                </p>
              </div>
              <Switch
                id="break-reminders"
                checked={settings.breakRemindersEnabled ?? false}
                onCheckedChange={(checked) => handleUpdate('breakRemindersEnabled', checked)}
                disabled={updateSettingsMutation.isPending || !settings.notificationsEnabled}
              />
            </div>

            {settings.breakRemindersEnabled && (
              <div className={styles.settingItem}>
                <label htmlFor="break-interval" className={styles.settingLabel}>
                  Break Reminder Interval: {settings.breakReminderInterval ?? 30} minutes
                </label>
                <Slider
                  id="break-interval"
                  min={15}
                  max={60}
                  step={5}
                  value={[settings.breakReminderInterval ?? 30]}
                  onValueChange={(value) => handleUpdate('breakReminderInterval', value[0])}
                  disabled={updateSettingsMutation.isPending}
                  className={styles.slider}
                />
              </div>
            )}

            <div className={styles.switchItem}>
              <div>
                <label htmlFor="celebration-notifications" className={styles.settingLabel}>
                  Celebration Notifications
                </label>
                <p className={styles.settingDescription}>
                  Get notified when you complete tasks and earn KAIBLOOMS
                </p>
              </div>
              <Switch
                id="celebration-notifications"
                checked={settings.celebrationNotificationsEnabled ?? false}
                onCheckedChange={(checked) => handleUpdate('celebrationNotificationsEnabled', checked)}
                disabled={updateSettingsMutation.isPending || !settings.notificationsEnabled}
              />
            </div>

            <div className={styles.switchItem}>
              <div>
                <label htmlFor="daily-checkin" className={styles.settingLabel}>
                  Daily Check-in Reminders
                </label>
                <p className={styles.settingDescription}>
                  Get a gentle reminder to check in with your tasks each day
                </p>
              </div>
              <Switch
                id="daily-checkin"
                checked={settings.dailyCheckinEnabled ?? false}
                onCheckedChange={(checked) => handleUpdate('dailyCheckinEnabled', checked)}
                disabled={updateSettingsMutation.isPending || !settings.notificationsEnabled}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Accessibility />}
            title="Accessibility"
            description="Adjust the app to your needs."
          >
            <div className={styles.switchItem}>
              <label htmlFor="bigger-text" className={styles.settingLabel}>
                Bigger Text
              </label>
              <Switch
                id="bigger-text"
                checked={settings.biggerText ?? false}
                onCheckedChange={(checked) => handleUpdate('biggerText', checked)}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
            <div className={styles.switchItem}>
              <label htmlFor="haptic-buzz" className={styles.settingLabel}>
                Haptic Buzz
              </label>
              <Switch
                id="haptic-buzz"
                checked={settings.hapticBuzz ?? false}
                onCheckedChange={(checked) => handleUpdate('hapticBuzz', checked)}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<Trash2 />}
            title="Data Management"
            description="Start fresh by clearing your data."
          >
            <Dialog open={isClearConfirmOpen} onOpenChange={setClearConfirmOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={clearDataMutation.isPending}>
                  {clearDataMutation.isPending ? 'Clearing...' : 'Clear All Data'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className={styles.dialogTitle}>
                    <AlertTriangle className={styles.dialogIcon} />
                    Are you absolutely sure?
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete all your tasks, reflections, and reset your KAIBLOOMS points to zero.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" disabled={clearDataMutation.isPending}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleClearData}
                    disabled={clearDataMutation.isPending}
                  >
                    {clearDataMutation.isPending ? 'Clearing...' : "Yes, clear everything"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SettingsSection>

          <SettingsSection
            icon={<LogOut />}
            title="Account"
            description="Manage your account and sign out."
          >
            <Button 
              variant="outline" 
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </Button>
          </SettingsSection>
        </main>
      </div>
    </>
  );
};

export default SettingsPage;