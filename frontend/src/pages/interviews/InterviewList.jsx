import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MessagesSquare, Sparkles, Trash2, ChevronRight } from 'lucide-react';
import { interviewApi } from '@/api/interview.api';
import { getErrorMessage } from '@/lib/apiError';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { FormField } from '@/components/shared/FormField';

const schema = z.object({
  targetRole: z.string().trim().min(1, 'Target role is required').max(150),
  experienceLevel: z.enum(['student', 'fresher', 'junior', 'mid', 'senior']),
  count: z.coerce.number().int().min(3).max(10),
});

const STATUS_VARIANT = { in_progress: 'secondary', completed: 'success' };

export default function InterviewList() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { targetRole: '', experienceLevel: 'fresher', count: 6 },
  });

  const listQuery = useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewApi.list({ limit: 20 }),
    select: (res) => res.data.data.sessions,
  });

  const startMutation = useMutation({
    mutationFn: (values) => interviewApi.start({ ...values, categories: ['hr', 'technical', 'behavioral'] }),
    onSuccess: (res) => {
      toast.success('Interview session started!');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setOpen(false);
      window.location.assign(`/interviews/${res.data.data.session._id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to start interview session.')),
  });

  const deleteMutation = useMutation({
    mutationFn: interviewApi.remove,
    onSuccess: () => {
      toast.success('Session deleted.');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const sessions = listQuery.data || [];

  return (
    <div>
      <PageHeader
        title="Interview Prep"
        description="Practice mock interviews and get instant AI feedback on every answer."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Sparkles className="h-4 w-4" /> Start interview
          </Button>
        }
      />

      {listQuery.isError && <ErrorState message="Couldn't load your interview sessions." onRetry={listQuery.refetch} />}

      {listQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!listQuery.isLoading && sessions.length === 0 && (
        <EmptyState
          icon={MessagesSquare}
          title="No mock interviews yet"
          description="Start a mock interview tailored to your target role and get real-time AI feedback."
          action={
            <Button onClick={() => setOpen(true)}>
              <Sparkles className="h-4 w-4" /> Start interview
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <Card key={session._id}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <Link to={`/interviews/${session._id}`} className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{session.targetRole}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {session.experienceLevel} · {session.questions?.length || 0} questions ·{' '}
                  {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                {session.status === 'completed' && session.overallScore != null && (
                  <Badge variant="gold">{session.overallScore}/100</Badge>
                )}
                <Badge variant={STATUS_VARIANT[session.status]} className="capitalize">
                  {session.status.replace('_', ' ')}
                </Badge>
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/interviews/${session._id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <button
                  onClick={() => deleteMutation.mutate(session._id)}
                  className="text-muted-foreground hover:text-danger cursor-pointer"
                  aria-label="Delete session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start mock interview</DialogTitle>
            <DialogDescription>
              We'll generate a mix of HR, technical, and behavioral questions for your target role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => startMutation.mutate(v))} className="space-y-4" noValidate>
            <FormField label="Target role" htmlFor="targetRole" error={errors.targetRole}>
              <Input id="targetRole" placeholder="e.g. Backend Engineer" {...register('targetRole')} />
            </FormField>

            <FormField label="Experience level" htmlFor="experienceLevel">
              <Controller
                control={control}
                name="experienceLevel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="experienceLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="fresher">Fresher</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid-level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Number of questions" htmlFor="count" error={errors.count}>
              <Input id="count" type="number" min={3} max={10} {...register('count')} />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting || startMutation.isPending}>
                <Sparkles className="h-4 w-4" /> Start
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
