import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { authAPI } from '@/lib/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setError('No verification token provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await authAPI.verifyEmail(token);
        setVerified(true);
        setError(null);
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth?mode=login');
        }, 3000);
      } catch (err: any) {
        console.error('Email verification error:', err);
        if (err.message && err.message.includes('expired')) {
          setTokenExpired(true);
          setError('Verification token has expired. Please request a new one.');
        } else {
          setError(err.message || 'Failed to verify email');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyEmailToken();
  }, [token, navigate]);

  const handleResendEmail = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setResendLoading(true);
      setError(null);
      await authAPI.resendVerificationEmail(email);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md py-12 md:py-24">
        {loading ? (
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">Verifying your email...</p>
            </CardContent>
          </Card>
        ) : verified ? (
          <Card className="border-border/50 shadow-lg border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
                <h1 className="text-2xl font-bold text-green-700">Email Verified!</h1>
                <p className="text-muted-foreground">
                  Your email has been verified successfully. You can now login to your account.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to login page in 3 seconds...
                </p>
                <Button asChild className="mt-4" size="lg">
                  <Link to="/auth?mode=login">Go to Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Email Verification Failed
              </CardTitle>
              <CardDescription>
                {tokenExpired
                  ? 'Your verification link has expired'
                  : 'Unable to verify your email'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Resend Section */}
              {tokenExpired ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your email address to receive a new verification link.
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                      onClick={handleResendEmail}
                      disabled={resendLoading}
                      className="w-full"
                      size="lg"
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </div>

                  {resendSuccess && (
                    <Alert className="bg-green-50/50 border-green-200 text-green-800">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Verification email sent! Check your inbox and spam folder.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Something went wrong while verifying your email. Please try again or request a new verification link.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/auth?mode=signup">Back to Sign Up</Link>
                  </Button>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-center text-sm text-muted-foreground mb-3">
                  Already have an account?
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth?mode=login">Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default VerifyEmailPage;
