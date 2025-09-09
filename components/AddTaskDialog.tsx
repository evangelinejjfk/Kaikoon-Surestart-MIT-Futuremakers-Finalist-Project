import React, { useState } from 'react';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from './Form';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { useCreateTask } from '../helpers/useTaskQueries';
import { useGenerateTaskSteps } from '../helpers/useTaskGeneration';
import { useHapticFeedbackContext } from '../helpers/HapticFeedbackContext';
import { Spinner } from './Spinner';
import { Sparkles, AlertCircle } from 'lucide-react';
import styles from './AddTaskDialog.module.css';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type GeneratedStep = {
  description: string;
  materials: string | null;
  selected: boolean;
  edited?: boolean;
};

const addTaskSchema = z.object({
  title: z.string().min(1, { message: 'Task title cannot be empty.' }),
  estimatedMinutes: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .int('Must be a whole number.')
    .positive({ message: 'Must be a positive number.' }),
});

type AddTaskFormValues = z.infer<typeof addTaskSchema>;

export const AddTaskDialog = ({ open, onOpenChange, onSuccess }: AddTaskDialogProps) => {
  const createTaskMutation = useCreateTask();
  const generateStepsMutation = useGenerateTaskSteps();
  const { triggerHapticFeedback } = useHapticFeedbackContext();
  
  const [generatedSteps, setGeneratedSteps] = useState<GeneratedStep[]>([]);
  const [stepsGenerated, setStepsGenerated] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const form = useForm({
    schema: addTaskSchema,
    defaultValues: {
      title: '',
      estimatedMinutes: 30,
    } as AddTaskFormValues,
  });

  const handleGenerateSteps = async () => {
    if (!form.values.title.trim()) {
      return;
    }

    // Haptic feedback for button press
    triggerHapticFeedback([100, 50, 100]);

    setGenerationError(null);
    
    try {
      const steps = await generateStepsMutation.mutateAsync({ 
        title: form.values.title 
      });
      
      const stepsWithSelection = steps.map(step => ({
        ...step,
        selected: true, // Pre-select all steps by default
      }));
      
      setGeneratedSteps(stepsWithSelection);
      setStepsGenerated(true);
    } catch (error) {
      console.error('Failed to generate steps:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate steps. Please try again.';
      setGenerationError(errorMessage);
    }
  };

  const handleStepToggle = (index: number) => {
    setGeneratedSteps(prev => 
      prev.map((step, i) => 
        i === index ? { ...step, selected: !step.selected } : step
      )
    );
  };

  const handleStepDescriptionChange = (index: number, newDescription: string) => {
    setGeneratedSteps(prev => 
      prev.map((step, i) => 
        i === index 
          ? { ...step, description: newDescription, edited: true }
          : step
      )
    );
  };

  const handleStepMaterialsChange = (index: number, newMaterials: string) => {
    setGeneratedSteps(prev => 
      prev.map((step, i) => 
        i === index 
          ? { ...step, materials: newMaterials || null, edited: true }
          : step
      )
    );
  };

  const resetDialog = () => {
    form.setValues({
      title: '',
      estimatedMinutes: 30,
    });
    setGeneratedSteps([]);
    setStepsGenerated(false);
    setGenerationError(null);
  };

  const onSubmit = async (values: AddTaskFormValues) => {
    try {
      const selectedSteps = generatedSteps
        .filter(step => step.selected)
        .map(step => ({
          description: step.description,
          materials: step.materials,
        }));

      const taskData = {
        ...values,
        ...(selectedSteps.length > 0 && { steps: selectedSteps }),
      };

      await createTaskMutation.mutateAsync(taskData);
      
      // Haptic feedback for successful task creation
      triggerHapticFeedback([200, 100, 200, 100, 300]);
      
      resetDialog();
      onSuccess();
    } catch (error) {
      console.error('Failed to create task:', error);
      
      // Haptic feedback for form/creation error
      triggerHapticFeedback([300, 100, 300]);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const canGenerateSteps = form.values.title.trim().length > 0 && !generateStepsMutation.isPending;
  const hasSelectedSteps = generatedSteps.some(step => step.selected);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>Add a New Task</DialogTitle>
          <DialogDescription>
            What do you need to get done? Let's break it down step by step.
          </DialogDescription>
        </DialogHeader>
        
        <div className={styles.content}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="add-task-form">
              <FormItem name="title">
                <FormLabel>Task Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Finish math homework"
                    value={form.values.title}
                    onChange={(e) => form.setValues(prev => ({ ...prev, title: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              {/* Break into Steps Button */}
              {form.values.title.trim() && !stepsGenerated && (
                <div className={styles.generateStepsSection}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGenerateSteps}
                    disabled={!canGenerateSteps}
                    className={styles.generateButton}
                  >
                    {generateStepsMutation.isPending ? (
                      <Spinner size="sm" />
                    ) : (
                      <Sparkles className={styles.sparkleIcon} />
                    )}
                    {generateStepsMutation.isPending ? 'Breaking it down...' : 'Break into steps'}
                  </Button>
                  <p className={styles.generateHint}>
                    Let AI suggest steps to make this task easier to tackle!
                  </p>
                </div>
              )}

              {/* Generation Error */}
              {generationError && (
                <div className={styles.errorMessage}>
                  <AlertCircle className={styles.errorIcon} />
                  <span>{generationError}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSteps}
                    disabled={generateStepsMutation.isPending}
                  >
                    Try again
                  </Button>
                </div>
              )}

              {/* Generated Steps */}
              {stepsGenerated && generatedSteps.length > 0 && (
                <div className={styles.stepsSection}>
                  <div className={styles.stepsHeader}>
                    <h3 className={styles.stepsTitle}>Suggested Steps</h3>
                    <p className={styles.stepsHint}>
                      Review and customize these steps. Uncheck any you don't need.
                    </p>
                  </div>
                  
                  <div className={styles.stepsList}>
                    {generatedSteps.map((step, index) => (
                      <div key={index} className={styles.stepItem}>
                        <div className={styles.stepHeader}>
                          <Checkbox
                            checked={step.selected}
                            onChange={() => handleStepToggle(index)}
                            className={styles.stepCheckbox}
                          />
                          <span className={styles.stepNumber}>Step {index + 1}</span>
                        </div>
                        
                        <div className={styles.stepContent}>
                          <Textarea
                            value={step.description}
                            onChange={(e) => handleStepDescriptionChange(index, e.target.value)}
                            placeholder="Step description..."
                            className={styles.stepDescription}
                            disableResize
                          />
                          
                          {step.materials && (
                            <div className={styles.materialsSection}>
                              <label className={styles.materialsLabel}>Materials needed:</label>
                              <Input
                                value={step.materials}
                                onChange={(e) => handleStepMaterialsChange(index, e.target.value)}
                                placeholder="Materials..."
                                className={styles.materialsInput}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasSelectedSteps && (
                    <div className={styles.selectedStepsInfo}>
                      ✨ {generatedSteps.filter(s => s.selected).length} steps selected
                    </div>
                  )}
                </div>
              )}

              <FormItem name="estimatedMinutes">
                <FormLabel>Estimated Time (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={form.values.estimatedMinutes}
                    onChange={(e) => form.setValues(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) || 0 }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </form>
          </Form>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleDialogClose(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="add-task-form" 
            disabled={createTaskMutation.isPending}
          >
            {createTaskMutation.isPending && <Spinner size="sm" />}
            {hasSelectedSteps ? 'Create Task with Steps' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};