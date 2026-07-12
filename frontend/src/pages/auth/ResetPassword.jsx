import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { resetPasswordSchema } from '@/lib/validation/auth.schema';
import { getErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values) => {
    try {
      await authApi.resetPassword({ token, password: values.password });
      toast.success('Password reset. Please log in with your new password.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'This reset link is invalid or has expired.'));
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-4" />
        <h1 className="font-display text-xl font-semibold mb-1">Invalid link</h1>
        <p className="text-sm text-muted-foreground mb-6">This reset link is missing its token.</p>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Set a new password</h1>
      <p className="text-sm text-muted-foreground mb-6">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="New password" htmlFor="password" error={errors.password}>
          <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters, 1 number" {...register('password')} />
        </FormField>

        <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
