import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { forgotPasswordSchema } from '@/lib/validation/auth.schema';
import { getErrorMessage } from '@/lib/apiError';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values) => {
    try {
      await authApi.forgotPassword(values);
      setSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <MailCheck className="h-10 w-10 mx-auto text-ember mb-4" />
        <h1 className="font-display text-xl font-semibold mb-1">Check your inbox</h1>
        <p className="text-sm text-muted-foreground mb-6">
          If an account exists for that email, we've sent a link to reset your password.
        </p>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/login">Back to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Forgot password?</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your email and we'll send you a link to reset it.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        <Link to="/login" className="text-ember font-medium hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
