import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { useCreateReflection } from '../helpers/useReflectionQueries';
import { useHapticFeedbackContext } from '../helpers/HapticFeedbackContext';
import styles from './ReflectionDialog.module.css';
import { Loader2, CheckCircle } from 'lucide-react';

const EMOJIS = [
  { emoji: '😢', rating: 1, label: 'Sad' },
  { emoji: '😐', rating: 2, label: 'Neutral' },
  { emoji: '😊', rating: 3, label: 'Happy' },
  { emoji: '😍', rating: 4, label: 'Excited' },
  { emoji: '🥰', rating: 5, label: 'Loved it' },
];

interface ReflectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number;
  onSuccess: () => void;
}

export const ReflectionDialog: React.FC<ReflectionDialogProps> = ({
  open,
  onOpenChange,
  taskId,
  onSuccess,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sentimentResult, setSentimentResult] = useState<string | null>(null);

  const createReflection = useCreateReflection();
  const { triggerHapticFeedback } = useHapticFeedbackContext();

  useEffect(() => {
    // Reset state when dialog is closed
    if (!open) {
      setTimeout(() => {
        setSelectedRating(null);
        setReflectionText('');
        setIsSubmitted(false);
        setSentimentResult(null);
        createReflection.reset();
      }, 300); // allow for closing animation
    }
  }, [open, createReflection]);

  const handleSubmit = async () => {
    if (!selectedRating || !reflectionText.trim()) {
      // Simple validation feedback, could be improved with toasts
      alert('Please select an emoji and write a reflection.');
      return;
    }

    await createReflection.mutateAsync(
      {
        taskId,
        emojiRating: selectedRating,
        reflectionText,
      },
      {
        onSuccess: (data) => {
          setSentimentResult(data.sentiment);
          setIsSubmitted(true);
          triggerHapticFeedback([100, 50, 100, 50, 200]); // Celebration pattern for successful completion
          setTimeout(() => {
            onSuccess();
            onOpenChange(false);
          }, 3000); // Show success message for 3 seconds to include sentiment
        },
      }
    );
  };

  const isSubmitting = createReflection.isPending;
  const canSubmit = selectedRating !== null && reflectionText.trim().length > 0 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        {isSubmitted ? (
          <div className={styles.successState}>
            <CheckCircle className={styles.successIcon} />
            <h2 className={styles.successTitle}>Great job!</h2>
            <div className={styles.successDescription}>
              <img 
                src="https://assets.floot.app/f2f6c53b-4f49-4b32-8826-0c9dc3d3ed07/2dccdf8e-81e5-41bf-ac41-78c535495933.png" 
                alt="Kaibloom currency" 
                className={styles.kaibloomLogo}
              />
              You've earned 15 KAIBLOOMS!
            </div>
            {sentimentResult && (
              <div className={styles.sentimentResult}>
                <p className={styles.sentimentLabel}>Sentiment Analysis:</p>
                <p className={`${styles.sentimentValue} ${
                  sentimentResult === 'POSITIVE' ? styles.positive :
                  sentimentResult === 'NEGATIVE' ? styles.negative :
                  styles.neutral
                }`}>
                  {sentimentResult === 'POSITIVE' && '😊 Positive'}
                  {sentimentResult === 'NEGATIVE' && '😔 Negative'}
                  {sentimentResult === 'NEUTRAL' && '😐 Neutral'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>How did it go?</DialogTitle>
              <DialogDescription>
                Reflect on your task to learn and grow.
              </DialogDescription>
            </DialogHeader>

            <div className={styles.emojiContainer}>
              {EMOJIS.map(({ emoji, rating, label }) => (
                <button
                  key={rating}
                  className={`${styles.emojiButton} ${selectedRating === rating ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedRating(rating);
                    triggerHapticFeedback([50]); // Short vibration for emoji selection
                  }}
                  aria-label={label}
                  aria-pressed={selectedRating === rating}
                >
                  <span className={styles.emoji}>{emoji}</span>
                </button>
              ))}
            </div>

            <Textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Write a few words about your experience..."
              rows={4}
              className={styles.textarea}
              disabled={isSubmitting}
            />

            {createReflection.isError && (
              <p className={styles.errorText}>
                Error: {createReflection.error.message}
              </p>
            )}

            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className={styles.spinner} />
                    Analyzing...
                  </>
                ) : (
                  'Analyze my text'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};