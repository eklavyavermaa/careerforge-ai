import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Sparkles, Trash2, ChevronRight } from 'lucide-react';
import { coverLetterApi } from '@/api/coverLetter.api';
import { resumeApi } from '@/api/resume.api';
import { getErrorMessage } from '@/lib/apiError';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  resumeId: z.string().min(1, 'Select a resume'),
  companyName: z.string().max(150).optional(),
  roleTitle: z.string().max(150).optional(),
  jobDescription: z.string().max(10000).optional(),
  tone: z.enum(['formal', 'concise', 'friendly', 'enthusiastic']),
});

export default function CoverLetterList() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      resumeId: searchParams.get('resumeId') || '',
      companyName: '',
      roleTitle: '',
      jobDescription: '',
      tone: 'formal',
    },
  });

  const resumesQuery = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeApi.list({ limit: 50 }),
    select: (res) => res.data.data.resumes,
  });

  const listQuery = useQuery({
    queryKey: ['cover-letters'],
    queryFn: () => coverLetterApi.list({ limit: 20 }),
    select: (res) => res.data.data.coverLetters,
  });

  const generateMutation = useMutation({
    mutationFn: (values) => coverLetterApi.generate(values),
    onSuccess: () => {
      toast.success('Cover letter generated!');
      queryClient.invalidateQueries({ queryKey: ['cover-letters'] });
      setOpen(false);
      reset();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to generate cover letter.')),
  });

  const deleteMutation = useMutation({
    mutationFn: coverLetterApi.remove,
    onSuccess: () => {
      toast.success('Cover letter deleted.');
      queryClient.invalidateQueries({ queryKey: ['cover-letters'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const letters = listQuery.data || [];
  const resumes = resumesQuery.data || [];

  return (
    <div>
      <PageHeader
        title="Cover Letters"
        description="Generate a tailored cover letter from any of your resumes."
        actions={
          <Button onClick={() => setOpen(true)} disabled={resumes.length === 0}>
            <Sparkles className="h-4 w-4" /> Generate
          </Button>
        }
      />

      {listQuery.isError && <ErrorState message="Couldn't load your cover letters." onRetry={listQuery.refetch} />}

      {listQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!listQuery.isLoading && letters.length === 0 && (
        <EmptyState
          icon={Mail}
          title="No cover letters yet"
          description={
            resumes.length === 0
              ? 'Upload a resume first, then generate a tailored cover letter from it.'
              : 'Generate your first AI-written cover letter.'
          }
          action={
            resumes.length > 0 && (
              <Button onClick={() => setOpen(true)}>
                <Sparkles className="h-4 w-4" /> Generate cover letter
              </Button>
            )
          }
        />
      )}

      <div className="space-y-3">
        {letters.map((letter) => (
          <Card key={letter._id}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <Link to={`/cover-letters/${letter._id}`} className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {letter.roleTitle || 'Cover letter'} {letter.companyName && `· ${letter.companyName}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on {letter.resume?.title} (v{letter.resume?.version}) ·{' '}
                  {new Date(letter.createdAt).toLocaleDateString()}
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/cover-letters/${letter._id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <button
                  onClick={() => deleteMutation.mutate(letter._id)}
                  className="text-muted-foreground hover:text-danger cursor-pointer"
                  aria-label="Delete cover letter"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate cover letter</DialogTitle>
            <DialogDescription>Pick a resume and add details for a tailored letter.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => generateMutation.mutate(v))} className="space-y-4" noValidate>
            <FormField label="Resume" htmlFor="resumeId" error={errors.resumeId}>
              <Controller
                control={control}
                name="resumeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="resumeId">
                      <SelectValue placeholder="Select a resume" />
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

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Company (optional)" htmlFor="companyName" error={errors.companyName}>
                <Input id="companyName" placeholder="Acme Corp" {...register('companyName')} />
              </FormField>
              <FormField label="Role (optional)" htmlFor="roleTitle" error={errors.roleTitle}>
                <Input id="roleTitle" placeholder="Frontend Engineer" {...register('roleTitle')} />
              </FormField>
            </div>

            <FormField label="Tone" htmlFor="tone">
              <Controller
                control={control}
                name="tone"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Job description (optional)" htmlFor="jobDescription" error={errors.jobDescription}>
              <Textarea id="jobDescription" rows={5} placeholder="Paste the job description…" {...register('jobDescription')} />
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
