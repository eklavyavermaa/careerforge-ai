import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Copy } from 'lucide-react';
import { coverLetterApi } from '@/api/coverLetter.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CoverLetterDetail() {
  const { id } = useParams();

  const { data: letter, isLoading, isError, refetch } = useQuery({
    queryKey: ['cover-letters', id],
    queryFn: () => coverLetterApi.getById(id),
    select: (res) => res.data.data.coverLetter,
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(letter.content);
      toast.success('Copied to clipboard.');
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message="Couldn't load this cover letter." onRetry={refetch} />;

  return (
    <div>
      <Link to="/cover-letters" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 w-fit">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to cover letters
      </Link>

      <PageHeader
        title={letter.roleTitle || 'Cover letter'}
        description={`${letter.companyName || 'General'} · Based on ${letter.resume?.title}`}
        actions={
          <Button variant="secondary" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" /> Copy
          </Button>
        }
      />

      <div className="flex gap-2 mb-4">
        <Badge variant="secondary" className="capitalize">
          {letter.tone}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed font-body">{letter.content}</div>
        </CardContent>
      </Card>
    </div>
  );
}
