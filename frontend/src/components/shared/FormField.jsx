import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function FormField({ label, htmlFor, error, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error && <p className="text-xs text-danger">{error.message}</p>}
    </div>
  );
}
