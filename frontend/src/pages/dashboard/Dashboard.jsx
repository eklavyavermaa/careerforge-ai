import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FileText, MessagesSquare, Briefcase, Map as MapIcon, ArrowRight } from 'lucide-react';
import { analyticsApi } from '@/api/analytics.api';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { ScoreGauge } from '@/components/shared/ScoreGauge';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const EVENT_LABELS = {
  resume_uploaded: 'Resumes uploaded',
  resume_analyzed: 'Resumes analyzed',
  cover_letter_generated: 'Cover letters',
  interview_session_completed: 'Interviews completed',
  roadmap_generated: 'Roadmaps generated',
  application_added: 'Applications added',
  application_status_updated: 'Status updates',
  login: 'Logins',
};

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-semibold mt-1">{value ?? '—'}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ember/10 text-ember">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
      {to && (
        <Link to={to} className="flex items-center gap-1 px-5 pb-4 text-xs text-ember hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </Card>
  );
}

function buildWeeklyChartData(weeklyProgress = []) {
  const byWeek = {};
  weeklyProgress.forEach((entry) => {
    const key = `W${entry.week}`;
    if (!byWeek[key]) byWeek[key] = { week: key };
    byWeek[key][entry.eventType] = entry.count;
  });
  return Object.values(byWeek);
}

export default function Dashboard() {
  const { user } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: analyticsApi.summary,
    select: (res) => res.data.data,
  });

  const weeklyQuery = useQuery({
    queryKey: ['analytics', 'weekly-progress'],
    queryFn: analyticsApi.weeklyProgress,
    select: (res) => buildWeeklyChartData(res.data.data.weeklyProgress),
  });

  const activityQuery = useQuery({
    queryKey: ['analytics', 'recent-activity'],
    queryFn: () => analyticsApi.recentActivity({ limit: 6 }),
    select: (res) => res.data.data.events,
  });

  const s = summaryQuery.data;

  return (
    <div>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Here's where your career-forging progress stands."
      />

      {summaryQuery.isError && (
        <ErrorState message="Couldn't load your dashboard summary." onRetry={summaryQuery.refetch} />
      )}

      {!summaryQuery.isError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {summaryQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
            ) : (
              <>
                <StatCard icon={FileText} label="Resumes" value={s.resumeCount} to="/resumes" />
                <StatCard icon={MessagesSquare} label="Interviews completed" value={s.completedInterviewCount} to="/interviews" />
                <StatCard icon={Briefcase} label="Applications" value={s.totalApplications} to="/applications" />
                <StatCard icon={MapIcon} label="Active roadmaps" value={s.activeRoadmaps} to="/roadmaps" />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Latest resume scores</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-6 flex-wrap">
                {summaryQuery.isLoading ? (
                  <Skeleton className="h-28 w-28 rounded-full" />
                ) : s.latestAtsScore != null ? (
                  <>
                    <ScoreGauge value={s.latestAtsScore} size={100} label="ATS Score" />
                    <ScoreGauge value={s.latestResumeScore} size={100} label="Resume Score" />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Analyze a resume to see your scores here.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activity, last 8 weeks</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {weeklyQuery.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : weeklyQuery.data?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyQuery.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="week" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelFormatter={(w) => w}
                        formatter={(value, name) => [value, EVENT_LABELS[name] || name]}
                      />
                      <Bar dataKey="resume_analyzed" stackId="a" fill="var(--ember)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="interview_session_completed" stackId="a" fill="var(--steel)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="application_added" stackId="a" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">
                    No activity yet — start by uploading a resume.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {activityQuery.isLoading &&
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              {!activityQuery.isLoading && activityQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  No activity yet. Upload a resume to get started.
                </p>
              )}
              {activityQuery.data?.map((event) => (
                <div key={event._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{EVENT_LABELS[event.eventType] || event.eventType}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
