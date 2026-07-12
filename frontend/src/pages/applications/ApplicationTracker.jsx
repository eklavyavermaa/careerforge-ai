import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Briefcase, Plus, Trash2, ExternalLink } from 'lucide-react';
import { applicationApi } from '@/api/application.api';
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

const STATUS_OPTIONS = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'oa_assessment', label: 'OA / Assessment' },
  { value: 'interview_scheduled', label: 'Interview scheduled' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const STATUS_VARIANT = {
  wishlist: 'secondary',
  applied: 'steel',
  oa_assessment: 'gold',
  interview_scheduled: 'gold',
  interviewing: 'gold',
  offer: 'success',
  rejected: 'danger',
  withdrawn: 'outline',
};

const schema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(150),
  role: z.string().trim().min(1, 'Role is required').max(150),
  jobUrl: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
  location: z.string().max(150).optional(),
  status: z.string(),
});

export default function ApplicationTracker() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { company: '', role: '', jobUrl: '', location: '', status: 'wishlist' },
  });

  const statsQuery = useQuery({
    queryKey: ['applications', 'stats'],
    queryFn: applicationApi.stats,
    select: (res) => res.data.data,
  });

  const listQuery = useQuery({
    queryKey: ['applications', { status: statusFilter }],
    queryFn: () => applicationApi.list({ limit: 50, ...(statusFilter !== 'all' && { status: statusFilter }) }),
    select: (res) => res.data.data.applications,
  });

  const createMutation = useMutation({
    mutationFn: (values) => applicationApi.create({ ...values, jobUrl: values.jobUrl || undefined }),
    onSuccess: () => {
      toast.success('Application added.');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setOpen(false);
      reset();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to add application.')),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => applicationApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated.');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: applicationApi.remove,
    onSuccess: () => {
      toast.success('Application removed.');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const applications = listQuery.data || [];
  const stats = statsQuery.data;

  return (
    <div>
      <PageHeader
        title="Application Tracker"
        description="Keep every application, interview stage, and outcome in one place."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add application
          </Button>
        }
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-display text-xl font-semibold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Interviewing</p>
              <p className="font-display text-xl font-semibold">{stats.statusCounts.interviewing || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Offers</p>
              <p className="font-display text-xl font-semibold text-sage">{stats.statusCounts.offer || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="font-display text-xl font-semibold text-danger">{stats.statusCounts.rejected || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-4 w-56">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {listQuery.isError && <ErrorState message="Couldn't load your applications." onRetry={listQuery.refetch} />}

      {listQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!listQuery.isLoading && applications.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="Track every application from wishlist to offer."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add application
            </Button>
          }
        />
      )}

      <div className="space-y-2">
        {applications.map((app) => (
          <Card key={app._id}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
                  {app.role}
                  <span className="text-muted-foreground font-normal">at {app.company}</span>
                  {app.jobUrl && (
                    <a href={app.jobUrl} target="_blank" rel="noreferrer" className="text-ember">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {app.location || 'Remote/Unspecified'} · Added {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={app.status}
                  onValueChange={(status) => statusMutation.mutate({ id: app._id, status })}
                >
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant={STATUS_VARIANT[app.status]} className="capitalize hidden sm:inline-flex">
                  {app.status.replace(/_/g, ' ')}
                </Badge>
                <button
                  onClick={() => deleteMutation.mutate(app._id)}
                  className="text-muted-foreground hover:text-danger cursor-pointer"
                  aria-label="Delete application"
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
            <DialogTitle>Add application</DialogTitle>
            <DialogDescription>Track a new job application.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Company" htmlFor="company" error={errors.company}>
                <Input id="company" placeholder="Acme Corp" {...register('company')} />
              </FormField>
              <FormField label="Role" htmlFor="role" error={errors.role}>
                <Input id="role" placeholder="Frontend Engineer" {...register('role')} />
              </FormField>
            </div>
            <FormField label="Job URL (optional)" htmlFor="jobUrl" error={errors.jobUrl}>
              <Input id="jobUrl" placeholder="https://…" {...register('jobUrl')} />
            </FormField>
            <FormField label="Location (optional)" htmlFor="location" error={errors.location}>
              <Input id="location" placeholder="Remote / City" {...register('location')} />
            </FormField>
            <FormField label="Status" htmlFor="status">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
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
              <Button type="submit" loading={isSubmitting || createMutation.isPending}>
                Add application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
