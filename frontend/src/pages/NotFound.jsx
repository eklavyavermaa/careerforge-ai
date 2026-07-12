import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted-foreground mb-4">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="font-display text-2xl font-semibold mb-1">Page not found</h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button asChild>
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
