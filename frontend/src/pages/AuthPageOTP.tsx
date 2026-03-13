import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, Users, AlertCircle } from 'lucide-react';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  role: z.enum(['reader', 'author'], { errorMap: () => ({ message: 'Please select a role' }) }),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

// ============================================
// ROLE SELECTION COMPONENT
// ============================================
interface RoleCardProps {
  role: 'reader' | 'author';
  isSelected: boolean;
  onSelect: (role: 'reader' | 'author') => void;
}

const RoleCard = ({ role, isSelected, onSelect }: RoleCardProps) => {
  const isAuthor = role === 'author';
  
  return (
    <button
      onClick={() => onSelect(role)}
      className={`p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? isAuthor
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-green-500 bg-green-50 dark:bg-green-950'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          isAuthor
            ? isSelected ? 'bg-blue-200 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
            : isSelected ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          {isAuthor ? (
            <BookOpen className="h-5 w-5" />
          ) : (
            <Users className="h-5 w-5" />
          )}
        </div>
        <div>
          <h3 className="font-semibold">
            {isAuthor ? 'Author' : 'Reader'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isAuthor 
              ? 'Create and publish your own stories' 
              : 'Read and engage with blog posts'}
          </p>
        </div>
      </div>
    </button>
  );
};

// ============================================
// OTP INPUT COMPONENT
// ============================================
interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const OTPInput = ({ value, onChange, disabled = false }: OTPInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(val);
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="000000"
        className="w-full text-center text-4xl font-bold tracking-widest font-mono border-2 border-gray-300 rounded-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
      />
      <p className="text-sm text-muted-foreground text-center">{value.length}/6 digits</p>
    </div>
  );
};

// ============================================
// MAIN AUTH PAGE COMPONENT
// ============================================
const AuthPageOTP = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'mode-select' | 'signup-email' | 'verify-signup' | 'login-email' | 'verify-login'>('mode-select');
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState<'reader' | 'author'>('reader');
  const [signupOTP, setSignupOTP] = useState('');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOTP, setLoginOTP] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const { sendOTPForSignup, verifyOTPForSignup, sendOTPForLogin, verifyOTPForLogin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const role = user.role;
      navigate(role === 'author' ? '/write' : '/');
    }
  }, [user, navigate]);

  // Initialize mode from URL params
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup' || modeParam === 'login') {
      setMode('mode-select');
    }
  }, [searchParams]);

  // Timer for OTP expiry countdown
  useEffect(() => {
    if (!otpExpiry) {
      setRemainingTime(0);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((otpExpiry.getTime() - now.getTime()) / 1000);
      setRemainingTime(Math.max(0, diff));
      
      if (diff <= 0) {
        clearInterval(timer);
        toast({
          variant: 'destructive',
          title: 'OTP Expired',
          description: 'Your OTP has expired. Please request a new one.',
        });
        setMode(mode === 'verify-signup' ? 'signup-email' : 'login-email');
        setOtpExpiry(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiry, mode, toast]);

  // ============================================================================
  // SIGNUP FLOW
  // ============================================================================

  const handleSendSignupOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate input
      const validatedData = signUpSchema.parse({
        name,
        email: signupEmail,
        role: selectedRole,
      });

      setLoading(true);
      const result = await sendOTPForSignup(validatedData.email);

      if (result.error) {
        setErrors({ general: result.error.message });
        toast({
          variant: 'destructive',
          title: 'Failed to Send OTP',
          description: result.error.message,
        });
        return;
      }

      // Set OTP expiry (5 minutes)
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 5);
      setOtpExpiry(expiryTime);

      toast({
        title: 'OTP Sent',
        description: `Check your email at ${validatedData.email}`,
      });

      setMode('verify-signup');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      otpSchema.parse({ otp: signupOTP });

      setLoading(true);
      
      // ✅ DEBUG: Log the selected role before sending to backend
      console.log(`[SIGNUP OTP VERIFY] Selected role: '${selectedRole}'`);
      
      const result = await verifyOTPForSignup(
        signupEmail,
        signupOTP,
        name,
        username || undefined,
        selectedRole  // ✅ Pass selectedRole to backend
      );

      if (result.error) {
        setErrors({ general: result.error.message });
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: result.error.message,
        });
        return;
      }

      toast({
        title: 'Success!',
        description: 'Your account has been created. Redirecting...',
      });

      // Redirect based on role from response user object (API source of truth)
      if (result.user) {
        const role = result.user.role;
        console.log(`[SIGNUP OTP VERIFY] Account created with role: '${role}'`);
        // role is 'reader' (regular user) or 'author' (content creator)
        setTimeout(() => {
          navigate(role === 'author' ? '/write' : '/');
        }, 500);
      } else {
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ general: error.errors[0].message });
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // LOGIN FLOW
  // ============================================================================

  const handleSendLoginOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = emailSchema.parse({
        email: loginEmail,
      });

      setLoading(true);
      const result = await sendOTPForLogin(validatedData.email);

      if (result.error) {
        setErrors({ general: result.error.message });
        toast({
          variant: 'destructive',
          title: 'Failed to Send OTP',
          description: result.error.message,
        });
        return;
      }

      // Set OTP expiry (5 minutes)
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 5);
      setOtpExpiry(expiryTime);

      toast({
        title: 'OTP Sent',
        description: `Check your email at ${validatedData.email}`,
      });

      setMode('verify-login');
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ general: error.errors[0].message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      otpSchema.parse({ otp: loginOTP });

      setLoading(true);
      const result = await verifyOTPForLogin(loginEmail, loginOTP);

      if (result.error) {
        setErrors({ general: result.error.message });
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: result.error.message,
        });
        return;
      }

      toast({
        title: 'Welcome Back!',
        description: 'You have been logged in successfully.',
      });

      // Redirect based on role
      if (result.user) {
        const role = result.user.role;
        setTimeout(() => {
          navigate(role === 'author' ? '/write' : '/');
        }, 500);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ general: error.errors[0].message });
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // MODE SELECT (INITIAL SCREEN)
  // ============================================================================
  if (mode === 'mode-select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Welcome to Blogging Bliss</CardTitle>
            <CardDescription>Choose how you'd like to proceed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setMode('signup-email')}
              className="w-full h-12"
              size="lg"
            >
              Create New Account
            </Button>
            <Button
              onClick={() => setMode('login-email')}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // SIGNUP EMAIL FORM
  // ============================================================================
  if (mode === 'signup-email') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <button
              onClick={() => setMode('mode-select')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>Join as a reader or author</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendSignupOTP} className="space-y-4">
              {errors.general && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  disabled={loading}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username (Optional)</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Leave blank to use your email name</p>
              </div>

              <div className="space-y-3">
                <Label>I want to:</Label>
                <div className="space-y-2">
                  <RoleCard
                    role="reader"
                    isSelected={selectedRole === 'reader'}
                    onSelect={setSelectedRole}
                  />
                  <RoleCard
                    role="author"
                    isSelected={selectedRole === 'author'}
                    onSelect={setSelectedRole}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP to Email'}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login-email')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Sign In
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // VERIFY SIGNUP OTP
  // ============================================================================
  if (mode === 'verify-signup') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <button
              onClick={() => setMode('signup-email')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {signupEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifySignupOTP} className="space-y-6">
              {errors.general && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}

              <OTPInput
                value={signupOTP}
                onChange={setSignupOTP}
                disabled={loading}
              />

              {remainingTime > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="text-sm font-medium">OTP expires in:</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || signupOTP.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup-email');
                  setSignupOTP('');
                  setOtpExpiry(null);
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Didn't receive code? Request a new one
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // LOGIN EMAIL FORM
  // ============================================================================
  if (mode === 'login-email') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <button
              onClick={() => setMode('mode-select')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <CardTitle>Sign In to Your Account</CardTitle>
            <CardDescription>Enter your email to receive a login code</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendLoginOTP} className="space-y-4">
              {errors.general && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={loading}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP to Email'}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup-email')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Create one
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // VERIFY LOGIN OTP
  // ============================================================================
  if (mode === 'verify-login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <button
              onClick={() => setMode('login-email')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <CardTitle>Verify Your Identity</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {loginEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyLoginOTP} className="space-y-6">
              {errors.general && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}

              <OTPInput
                value={loginOTP}
                onChange={setLoginOTP}
                disabled={loading}
              />

              {remainingTime > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="text-sm font-medium">OTP expires in:</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || loginOTP.length !== 6}
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode('login-email');
                  setLoginOTP('');
                  setOtpExpiry(null);
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Didn't receive code? Request a new one
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AuthPageOTP;
