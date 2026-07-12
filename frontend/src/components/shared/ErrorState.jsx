import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({ message = 'Something went wrong while loading this.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="font-display font-semibold text-base mb-1">Couldn't load this</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
