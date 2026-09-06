import React from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStepIndex, onStepClick }) => {
  return (
    <div className="w-full py-3 px-4 bg-surface border border-border rounded-[12px] mb-4 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[600px]">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <div
                className={clsx(
                  'flex items-center gap-2.5 cursor-pointer select-none',
                  onStepClick ? 'hover:opacity-80' : ''
                )}
                onClick={() => onStepClick && onStepClick(idx)}
              >
                <div
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0',
                    isCompleted
                      ? 'bg-status-success text-white'
                      : isCurrent
                      ? 'bg-brand-raspberry text-white shadow-xs ring-4 ring-rose-100'
                      : 'bg-rose-50 border border-border text-status-neutral'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <div>
                  <p
                    className={clsx(
                      'text-xs font-bold leading-tight',
                      isCurrent ? 'text-brand-raspberry' : isCompleted ? 'text-status-success' : 'text-status-neutral'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-[11px] text-status-neutral/70 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {idx < steps.length - 1 && (
                <div
                  className={clsx(
                    'flex-1 h-0.5 mx-3 transition-colors duration-200',
                    idx < currentStepIndex ? 'bg-status-success' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
