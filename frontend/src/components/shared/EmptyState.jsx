import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-foreground mb-4">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="font-display font-semibold text-base mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
