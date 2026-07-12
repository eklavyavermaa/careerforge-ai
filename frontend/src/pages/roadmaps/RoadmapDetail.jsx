import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react';
import { roadmapApi } from '@/api/roadmap.api';
import { getErrorMessage } from '@/lib/apiError';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function RoadmapDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: roadmap, isLoading, isError, refetch } = useQuery({
    queryKey: ['roadmaps', id],
    queryFn: () => roadmapApi.getById(id),
    select: (res) => res.data.data.roadmap,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, isCompleted }) => roadmapApi.updateItem(id, itemId, isCompleted),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roadmaps', id] }),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message="Couldn't load this roadmap." onRetry={refetch} />;

  return (
    <div>
      <Link to="/roadmaps" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 w-fit">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to roadmaps
      </Link>

      <PageHeader
        title={roadmap.targetRole}
        description={`${roadmap.milestones.length} milestones · ${roadmap.progressPercentage}% complete`}
      />

      <Progress value={roadmap.progressPercentage} className="mb-6 h-3" />

      {roadmap.missingSkills?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {roadmap.missingSkills.map((skill, i) => (
            <Badge key={i} variant="danger">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {roadmap.milestones.map((milestone, mi) => {
          const milestoneComplete = milestone.items.every((i) => i.isCompleted);
          return (
            <Card key={milestone._id || mi}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-mono shrink-0',
                      milestoneComplete ? 'bg-sage/15 text-sage' : 'bg-surface-2 text-muted-foreground'
                    )}
                  >
                    {mi + 1}
                  </span>
                  {milestone.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {milestone.items.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => toggleMutation.mutate({ itemId: item._id, isCompleted: !item.isCompleted })}
                    className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    {item.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-sage shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', item.isCompleted && 'line-through text-muted-foreground')}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                      {item.estimatedHours > 0 && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" /> ~{item.estimatedHours}h
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
