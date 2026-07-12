import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle, ThumbsUp, ThumbsDown, SpellCheck, Sparkles, Map as MapIcon } from 'lucide-react';
import { analysisApi } from '@/api/analysis.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { ScoreGauge } from '@/components/shared/ScoreGauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AnalysisDetail() {
  const { id } = useParams();

  const { data: analysis, isLoading, isError, refetch } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => analysisApi.getById(id),
    select: (res) => res.data.data.analysis,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message="Couldn't load this analysis report." onRetry={refetch} />;

  return (
    <div>
      <Link
        to={analysis.resume?._id ? `/resumes/${analysis.resume._id}` : '/resumes'}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to resume
      </Link>

      <PageHeader
        title="Analysis report"
        description={`${analysis.resume?.title || 'Resume'} · ${new Date(analysis.createdAt).toLocaleString()}`}
        actions={
          <Button asChild variant="secondary">
            <Link to={`/roadmaps?resumeId=${analysis.resume?._id}`}>
              <MapIcon className="h-4 w-4" /> Build learning roadmap
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-5">
            <ScoreGauge value={analysis.atsScore} size={96} label="ATS Score" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-5">
            <ScoreGauge value={analysis.resumeScore} size={96} label="Resume Score" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-5">
            <ScoreGauge value={analysis.industryReadinessScore} size={96} label="Industry Ready" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-5">
            {analysis.matchPercentage != null ? (
              <ScoreGauge value={analysis.matchPercentage} size={96} label="JD Match" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-24 text-muted-foreground text-xs px-2">
                No job description was provided for this analysis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ember" /> Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage">
              <ThumbsUp className="h-4 w-4" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths?.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-sage shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <ThumbsDown className="h-4 w-4" /> Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weaknesses?.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Skills found</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analysis.extractedSkills?.map((skill, i) => (
              <Badge key={i} variant="steel">
                {skill}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missing skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analysis.missingSkills?.length ? (
              analysis.missingSkills.map((skill, i) => (
                <Badge key={i} variant="danger">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No major gaps found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Keyword analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.keywordAnalysis?.map((k, i) => (
              <Badge key={i} variant={k.present ? 'success' : 'outline'}>
                {k.present ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {k.keyword}
                <span className="ml-1 opacity-60 capitalize">({k.importance})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {analysis.grammarIssues?.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SpellCheck className="h-4 w-4" /> Grammar & clarity issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.grammarIssues.map((g, i) => (
              <div key={i} className="text-sm border-l-2 border-ember pl-3">
                <p className="font-medium">{g.issue}</p>
                <p className="text-muted-foreground">{g.suggestion}</p>
                {g.location && <p className="text-xs text-muted-foreground mt-1">Location: {g.location}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Improvement suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-decimal list-inside">
            {analysis.improvementSuggestions?.map((s, i) => (
              <li key={i} className="text-sm">
                {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
