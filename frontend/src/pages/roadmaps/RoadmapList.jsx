import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Map as MapIcon, Sparkles, Trash2, ChevronRight } from 'lucide-react';
import { roadmapApi } from '@/api/roadmap.api';
import { resumeApi } from '@/api/resume.api';
import { getErrorMessage } from '@/lib/apiError';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  resumeId: z.string().optional(),
});

export default function RoadmapList() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { targetRole: '', resumeId: searchParams.get('resumeId') || '' },
  });

  const resumesQuery = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeApi.list({ limit: 50 }),
    select: (res) => res.data.data.resumes,
  });

  const listQuery = useQuery({
    queryKey: ['roadmaps'],
    queryFn: () => roadmapApi.list({ limit: 20 }),
    select: (res) => res.data.data.roadmaps,
  });

  const generateMutation = useMutation({
    mutationFn: (values) => roadmapApi.generate({ ...values, resumeId: values.resumeId || undefined }),
    onSuccess: () => {
      toast.success('Learning roadmap generated!');
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      setOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to generate roadmap.')),
  });

  const deleteMutation = useMutation({
    mutationFn: roadmapApi.remove,
    onSuccess: () => {
      toast.success('Roadmap deleted.');
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const roadmaps = listQuery.data || [];
  const resumes = resumesQuery.data || [];

  return (
    <div>
      <PageHeader
        title="Learning Roadmap"
        description="AI-generated skill-gap roadmaps to get you ready for your target role."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Sparkles className="h-4 w-4" /> Generate roadmap
          </Button>
        }
      />

      {listQuery.isError && <ErrorState message="Couldn't load your roadmaps." onRetry={listQuery.refetch} />}

      {listQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!listQuery.isLoading && roadmaps.length === 0 && (
        <EmptyState
          icon={MapIcon}
          title="No roadmaps yet"
          description="Generate a personalized learning roadmap based on a target role and your resume's skill gaps."
          action={
            <Button onClick={() => setOpen(true)}>
              <Sparkles className="h-4 w-4" /> Generate roadmap
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roadmaps.map((roadmap) => (
          <Card key={roadmap._id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <Link to={`/roadmaps/${roadmap._id}`}>
                  <h3 className="font-display font-semibold text-sm hover:text-ember transition-colors">
                    {roadmap.targetRole}
                  </h3>
                </Link>
                <button
                  onClick={() => deleteMutation.mutate(roadmap._id)}
                  className="text-muted-foreground hover:text-danger cursor-pointer"
                  aria-label="Delete roadmap"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{roadmap.milestones?.length || 0} milestones</p>
              <Progress value={roadmap.progressPercentage} className="mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{roadmap.progressPercentage}% complete</span>
                <Link to={`/roadmaps/${roadmap._id}`} className="flex items-center gap-1 text-xs text-ember hover:underline">
                  View <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate learning roadmap</DialogTitle>
            <DialogDescription>
              Optionally base it on a resume's latest analysis to target your actual skill gaps.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => generateMutation.mutate(v))} className="space-y-4" noValidate>
            <FormField label="Target role" htmlFor="targetRole" error={errors.targetRole}>
              <Input id="targetRole" placeholder="e.g. Full Stack Developer" {...register('targetRole')} />
            </FormField>

            <FormField label="Base on resume (optional)" htmlFor="resumeId">
              <Controller
                control={control}
                name="resumeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="resumeId">
                      <SelectValue placeholder="None — general roadmap" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          {r.title} (v{r.version})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting || generateMutation.isPending}>
                <Sparkles className="h-4 w-4" /> Generate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
