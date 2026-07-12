import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-ember/15 text-ember',
        secondary: 'border-transparent bg-surface-2 text-muted-foreground',
        steel: 'border-transparent bg-steel/15 text-steel',
        gold: 'border-transparent bg-gold/15 text-gold',
        success: 'border-transparent bg-sage/15 text-sage',
        danger: 'border-transparent bg-danger/15 text-danger',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
