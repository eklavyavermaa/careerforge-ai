import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles, History, Mail, ArrowLeft, ClipboardList } from 'lucide-react';
import { resumeApi } from '@/api/resume.api';
import { analysisApi } from '@/api/analysis.api';
import { getErrorMessage } from '@/lib/apiError';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function ResumeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  const resumeQuery = useQuery({
    queryKey: ['resumes', id],
    queryFn: () => resumeApi.getById(id),
    select: (res) => res.data.data.resume,
  });

  const versionsQuery = useQuery({
    queryKey: ['resumes', id, 'versions'],
    queryFn: () => resumeApi.getVersions(id),
    select: (res) => res.data.data.versions,
    enabled: Boolean(resumeQuery.data),
  });

  const analysesQuery = useQuery({
    queryKey: ['analysis', 'resume', id],
    queryFn: () => analysisApi.listForResume(id, { limit: 10 }),
    select: (res) => res.data.data.analyses,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analysisApi.analyze({ resumeId: id, jobDescription: jobDescription.trim() || undefined }),
    onSuccess: (res) => {
      toast.success('Analysis complete!');
      queryClient.invalidateQueries({ queryKey: ['analysis', 'resume', id] });
      setAnalyzeOpen(false);
      setJobDescription('');
      navigate(`/analysis/${res.data.data.analysis._id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Analysis failed. Please try again.')),
  });

  if (resumeQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (resumeQuery.isError) {
    return <ErrorState message="Couldn't load this resume." onRetry={resumeQuery.refetch} />;
  }

  const resume = resumeQuery.data;

  return (
    <div>
      <Link to="/resumes" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 w-fit">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to resumes
      </Link>

      <PageHeader
        title={resume.title}
        description={`Version ${resume.version} · Uploaded ${new Date(resume.createdAt).toLocaleDateString()}`}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link to={`/cover-letters?resumeId=${resume._id}`}>
                <Mail className="h-4 w-4" /> Cover letter
              </Link>
            </Button>
            <Button onClick={() => setAnalyzeOpen(true)}>
              <Sparkles className="h-4 w-4" /> Analyze
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Past analysis reports</CardTitle>
          </CardHeader>
          <CardContent>
            {analysesQuery.isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}
            {!analysesQuery.isLoading && analysesQuery.data?.length === 0 && (
              <EmptyState
                icon={ClipboardList}
                title="No analysis yet"
                description="Run an AI analysis to get your ATS score, strengths, and improvement suggestions."
                action={
                  <Button size="sm" onClick={() => setAnalyzeOpen(true)}>
                    <Sparkles className="h-4 w-4" /> Analyze this resume
                  </Button>
                }
              />
            )}
            <div className="space-y-2">
              {analysesQuery.data?.map((analysis) => (
                <Link
                  key={analysis._id}
                  to={`/analysis/${analysis._id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-surface-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      ATS {analysis.atsScore} · Resume {analysis.resumeScore}
                      {analysis.matchPercentage != null && ` · Match ${analysis.matchPercentage}%`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(analysis.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">View report</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" /> Version history
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {versionsQuery.data?.map((v) => (
              <div
                key={v._id}
                className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0"
              >
                <span>v{v.version}</span>
                <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={analyzeOpen} onOpenChange={setAnalyzeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analyze resume</DialogTitle>
            <DialogDescription>
              Optionally paste a job description to get a match score and tailored missing-skills analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="jd">Job description (optional)</Label>
            <Textarea
              id="jd"
              rows={8}
              placeholder="Paste the job description here for a tailored match analysis…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAnalyzeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => analyzeMutation.mutate()} loading={analyzeMutation.isPending}>
              <Sparkles className="h-4 w-4" /> Run analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
