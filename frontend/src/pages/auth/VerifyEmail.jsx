import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { getErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    authApi
      .verifyEmail({ token })
      .then(() => setStatus('success'))
      .catch((error) => {
        setStatus('error');
        setMessage(getErrorMessage(error, 'This verification link is invalid or has expired.'));
      });
  }, [token]);

  return (
    <div className="text-center py-4">
      {status === 'verifying' && (
        <>
          <Loader2 className="h-10 w-10 mx-auto text-ember animate-spin mb-4" />
          <h1 className="font-display text-xl font-semibold">Verifying your email…</h1>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className="h-10 w-10 mx-auto text-sage mb-4" />
          <h1 className="font-display text-xl font-semibold mb-1">Email verified!</h1>
          <p className="text-sm text-muted-foreground mb-6">Your account is ready. You can now log in.</p>
          <Button asChild className="w-full">
            <Link to="/login">Go to login</Link>
          </Button>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-10 w-10 mx-auto text-danger mb-4" />
          <h1 className="font-display text-xl font-semibold mb-1">Verification failed</h1>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <Button asChild variant="secondary" className="w-full">
            <Link to="/login">Back to login</Link>
          </Button>
        </>
      )}
    </div>
  );
}
