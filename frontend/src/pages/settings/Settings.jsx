import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { settingsApi } from '@/api/settings.api';
import { getErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const NOTIF_FIELDS = [
  { key: 'resumeAnalysis', label: 'Resume analysis complete', description: 'Get notified when an AI analysis finishes.' },
  { key: 'applicationUpdates', label: 'Application updates', description: 'Status changes on your tracked applications.' },
  { key: 'weeklyDigest', label: 'Weekly digest', description: 'A weekly summary of your career progress.' },
  { key: 'productUpdates', label: 'Product updates', description: 'New features and announcements.' },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();

  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getMine,
    select: (res) => res.data.data.settings,
  });

  const { control, watch, setValue } = useForm({
    defaultValues: {
      theme: 'system',
      emailNotifications: {
        resumeAnalysis: true,
        applicationUpdates: true,
        weeklyDigest: true,
        productUpdates: false,
      },
      privacyVisibility: 'private',
      preferredTone: 'formal',
    },
  });

  useEffect(() => {
    if (settings) {
      setValue('theme', settings.theme);
      setValue('emailNotifications', settings.emailNotifications);
      setValue('privacyVisibility', settings.privacy?.profileVisibility || 'private');
      setValue('preferredTone', settings.aiPreferences?.preferredTone || 'formal');
    }
  }, [settings, setValue]);

  const updateMutation = useMutation({
    mutationFn: (payload) => settingsApi.updateMine(payload),
    onSuccess: () => {
      toast.success('Settings saved.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to save settings.')),
  });

  const persist = (partial) => updateMutation.mutate(partial);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message="Couldn't load your settings." onRetry={refetch} />;

  const emailNotifications = watch('emailNotifications');

  return (
    <div>
      <PageHeader title="Settings" description="Manage your appearance, notifications, privacy, and AI preferences." />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how CareerForge looks on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="theme"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== 'system') setTheme(value);
                    persist({ theme: value });
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {NOTIF_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center justify-between">
                <div>
                  <Label>{f.label}</Label>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
                <Switch
                  checked={emailNotifications?.[f.key] ?? true}
                  onCheckedChange={(checked) => {
                    const updated = { ...emailNotifications, [f.key]: checked };
                    setValue('emailNotifications', updated);
                    persist({ emailNotifications: updated });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Profile visibility</Label>
                <p className="text-xs text-muted-foreground">Control who can see your profile.</p>
              </div>
              <Controller
                control={control}
                name="privacyVisibility"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      persist({ privacy: { profileVisibility: value } });
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Default writing tone</Label>
                <p className="text-xs text-muted-foreground">Used as the default tone for cover letters.</p>
              </div>
              <Controller
                control={control}
                name="preferredTone"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      persist({ aiPreferences: { preferredTone: value } });
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
