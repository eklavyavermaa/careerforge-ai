import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-surface! text-foreground! border-border! shadow-lg! rounded-lg!',
          description: 'text-muted-foreground!',
          actionButton: 'bg-ember! text-ember-foreground!',
          cancelButton: 'bg-surface-2! text-muted-foreground!',
          success: 'border-l-4! border-l-sage!',
          error: 'border-l-4! border-l-danger!',
        },
      }}
    />
  );
}
