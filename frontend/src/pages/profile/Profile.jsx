import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { profileApi } from '@/api/settings.api';
import { getErrorMessage } from '@/lib/apiError';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormField } from '@/components/shared/FormField';

const schema = z.object({
  headline: z.string().max(150).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
  targetRole: z.string().max(150).optional(),
  experienceLevel: z.enum(['student', 'fresher', 'junior', 'mid', 'senior']),
  skillsInput: z.string().optional(),
  linkedin: z.string().max(300).optional(),
  github: z.string().max(300).optional(),
  portfolio: z.string().max(300).optional(),
  leetcode: z.string().max(300).optional(),
});

export default function Profile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMine,
    select: (res) => res.data.data.profile,
  });

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      headline: '',
      bio: '',
      location: '',
      phone: '',
      targetRole: '',
      experienceLevel: 'student',
      skillsInput: '',
      linkedin: '',
      github: '',
      portfolio: '',
      leetcode: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        headline: profile.headline || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        targetRole: profile.targetRole || '',
        experienceLevel: profile.experienceLevel || 'student',
        skillsInput: (profile.skills || []).join(', '),
        linkedin: profile.links?.linkedin || '',
        github: profile.links?.github || '',
        portfolio: profile.links?.portfolio || '',
        leetcode: profile.links?.leetcode || '',
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (values) =>
      profileApi.updateMine({
        headline: values.headline,
        bio: values.bio,
        location: values.location,
        phone: values.phone,
        targetRole: values.targetRole,
        experienceLevel: values.experienceLevel,
        skills: values.skillsInput
          ? values.skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        links: {
          linkedin: values.linkedin,
          github: values.github,
          portfolio: values.portfolio,
          leetcode: values.leetcode,
        },
      }),
    onSuccess: () => {
      toast.success('Profile updated.');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to update profile.')),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) return <ErrorState message="Couldn't load your profile." onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Profile" description="This information personalizes your AI-generated content." />

      <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} noValidate className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Headline" htmlFor="headline" error={errors.headline}>
              <Input id="headline" placeholder="e.g. Aspiring Full Stack Developer" {...register('headline')} />
            </FormField>
            <FormField label="Bio" htmlFor="bio" error={errors.bio}>
              <Textarea id="bio" rows={4} placeholder="A short bio about yourself…" {...register('bio')} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Location" htmlFor="location" error={errors.location}>
                <Input id="location" placeholder="City, Country" {...register('location')} />
              </FormField>
              <FormField label="Phone" htmlFor="phone" error={errors.phone}>
                <Input id="phone" placeholder="+91 …" {...register('phone')} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Career target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Target role" htmlFor="targetRole" error={errors.targetRole}>
                <Input id="targetRole" placeholder="e.g. Frontend Developer" {...register('targetRole')} />
              </FormField>
              <FormField label="Experience level" htmlFor="experienceLevel">
                <Controller
                  control={control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="experienceLevel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="fresher">Fresher</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Mid-level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
            <FormField label="Skills (comma-separated)" htmlFor="skillsInput" error={errors.skillsInput}>
              <Textarea id="skillsInput" rows={2} placeholder="React, Node.js, MongoDB…" {...register('skillsInput')} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="LinkedIn" htmlFor="linkedin" error={errors.linkedin}>
              <Input id="linkedin" placeholder="https://linkedin.com/in/…" {...register('linkedin')} />
            </FormField>
            <FormField label="GitHub" htmlFor="github" error={errors.github}>
              <Input id="github" placeholder="https://github.com/…" {...register('github')} />
            </FormField>
            <FormField label="Portfolio" htmlFor="portfolio" error={errors.portfolio}>
              <Input id="portfolio" placeholder="https://…" {...register('portfolio')} />
            </FormField>
            <FormField label="LeetCode" htmlFor="leetcode" error={errors.leetcode}>
              <Input id="leetcode" placeholder="https://leetcode.com/…" {...register('leetcode')} />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting || updateMutation.isPending}>
            <Save className="h-4 w-4" /> Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}
