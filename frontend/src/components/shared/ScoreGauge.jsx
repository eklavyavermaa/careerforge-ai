import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * The app's signature visual motif: a radial "molten gauge" used everywhere
 * a 0-100 AI score is shown (ATS score, resume score, interview score,
 * industry readiness, JD match %). The arc gradient runs ember -> gold to
 * echo the "forge" concept, and the fill color also degrades to danger/steel
 * tones for low/mid scores so the gauge is legible without reading the number.
 */
export function ScoreGauge({ value = 0, size = 120, strokeWidth = 10, label, className }) {
  const gradientId = useId();
  const clamped = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const tone = clamped >= 75 ? 'strong' : clamped >= 50 ? 'mid' : 'low';

  return (
    <div className={cn('relative inline-flex flex-col items-center justify-center', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {tone === 'strong' && (
              <>
                <stop offset="0%" stopColor="var(--ember)" />
                <stop offset="100%" stopColor="var(--gold)" />
              </>
            )}
            {tone === 'mid' && (
              <>
                <stop offset="0%" stopColor="var(--steel)" />
                <stop offset="100%" stopColor="var(--gold)" />
              </>
            )}
            {tone === 'low' && (
              <>
                <stop offset="0%" stopColor="var(--danger)" />
                <stop offset="100%" stopColor="var(--ember)" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-semibold text-foreground" style={{ fontSize: size * 0.24 }}>
          {Math.round(clamped)}
        </span>
        {label && (
          <span className="text-muted-foreground text-center px-2 leading-tight" style={{ fontSize: size * 0.09 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
