import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Send, CheckCircle2, Sparkles, Trophy } from 'lucide-react';
import { interviewApi } from '@/api/interview.api';
import { getErrorMessage } from '@/lib/apiError';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { ScoreGauge } from '@/components/shared/ScoreGauge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const CATEGORY_VARIANT = { hr: 'steel', technical: 'default', behavioral: 'gold' };

function QuestionCard({ sessionId, question, disabled }) {
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState(question.userAnswer || '');

  const submitMutation = useMutation({
    mutationFn: () => interviewApi.submitAnswer(sessionId, question._id, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', sessionId] });
      toast.success('Feedback generated.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to get feedback. Please try again.')),
  });

  const answered = Boolean(question.aiFeedback);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="font-medium text-sm leading-relaxed">{question.question}</p>
          <Badge variant={CATEGORY_VARIANT[question.category]} className="capitalize shrink-0">
            {question.category}
          </Badge>
        </div>

        <Textarea
          rows={4}
          placeholder="Type your answer…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled}
          className="mb-3"
        />

        {!disabled && (
          <Button
            size="sm"
            onClick={() => submitMutation.mutate()}
            loading={submitMutation.isPending}
            disabled={!answer.trim()}
          >
            <Send className="h-3.5 w-3.5" /> {answered ? 'Re-submit answer' : 'Submit answer'}
          </Button>
        )}

        {answered && (
          <div className="mt-4 rounded-md bg-surface-2 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-sage" />
              <span className="text-sm font-medium">Feedback</span>
              <Badge variant="gold" className="ml-auto">
                {question.score}/10
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{question.aiFeedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function InterviewSession() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: session, isLoading, isError, refetch } = useQuery({
    queryKey: ['interviews', id],
    queryFn: () => interviewApi.getById(id),
    select: (res) => res.data.data.session,
  });

  const completeMutation = useMutation({
    mutationFn: () => interviewApi.complete(id),
    onSuccess: () => {
      toast.success('Interview session completed!');
      queryClient.invalidateQueries({ queryKey: ['interviews', id] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to complete session.')),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message="Couldn't load this interview session." onRetry={refetch} />;

  const isCompleted = session.status === 'completed';
  const questions = session.questions || [];
  const answeredCount = questions.filter((q) => q.aiFeedback).length;

  return (
    <div>
      <Link to="/interviews" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 w-fit">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to interviews
      </Link>

      <PageHeader
        title={session.targetRole}
        description={`${session.experienceLevel} level · ${answeredCount}/${questions.length} answered`}
        actions={
          !isCompleted && (
            <Button
              onClick={() => completeMutation.mutate()}
              loading={completeMutation.isPending}
              disabled={answeredCount === 0}
            >
              <Trophy className="h-4 w-4" /> Complete session
            </Button>
          )
        }
      />

      {isCompleted && (
        <Card className="mb-6 border-gold/40">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <ScoreGauge value={session.overallScore} size={110} label="Overall Score" />
            <div>
              <h3 className="font-display font-semibold mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" /> Overall feedback
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{session.overallFeedback}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionCard key={q._id} sessionId={id} question={q} disabled={isCompleted} />
        ))}
      </div>
    </div>
  );
}
