import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, BookOpen, Users } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['user', 'author'], { errorMap: () => ({ message: 'Please select a role' }) }),
});

// ============================================
// ROLE SELECTION COMPONENT
// ============================================
interface RoleCardProps {
  role: 'user' | 'author';
  isSelected: boolean;
  onSelect: (role: 'user' | 'author') => void;
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
            {isAuthor ? 'Writer' : 'Reader'}
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
// MAIN AUTH PAGE COMPONENT
// ============================================
const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  
  // Sign up state
  const [name, setName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'author'>('user');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signUpAsUser, signUpAsAuthor, signIn, user, isAuthor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirect based on role
      if (isAdmin && isAdmin()) {
        navigate('/admin');
      } else if (isAuthor()) {
        navigate('/my-blogs');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate, isAuthor, isAdmin]);

  // ============================================
  // SIGN UP HANDLER
  // ============================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate form
      const validationData = {
        name,
        email: signUpEmail,
        password: signUpPassword,
        role: selectedRole,
      };
      
      signUpSchema.parse(validationData);

      // Call appropriate signup function based on role
      let error;
      if (selectedRole === 'author') {
        const result = await signUpAsAuthor(name, signUpEmail, signUpPassword);
        error = result.error;
      } else {
        const result = await signUpAsUser(name, signUpEmail, signUpPassword);
        error = result.error;
      }

      if (error) {
        toast({ 
          title: 'Signup Error', 
          description: error.message || 'An error occurred during signup',
          variant: 'destructive' 
        });
        setLoading(false);
      } else {
        toast({ 
          title: 'Account Created!', 
          description: 'Please check your email to verify your account before logging in.',
          duration: 5000
        });
        // Clear form
        setName('');
        setSignUpEmail('');
        setSignUpPassword('');
        setSelectedRole('user');
        setLoading(false);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
        });
        setErrors(fieldErrors);
        toast({ 
          title: 'Validation Error', 
          description: Object.values(fieldErrors)[0] || 'Please check all fields',
          variant: 'destructive'
        });
      }
      setLoading(false);
    }
  };

  // ============================================
  // LOGIN HANDLER
  // ============================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate form
      loginSchema.parse({ email: loginEmail, password: loginPassword });

      // Login - backend identifies role from database
      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        // Check for email verification status
        if (error.status === 403 && !error.isEmailVerified) {
          toast({ 
            title: 'Email Not Verified', 
            description: 'Please verify your email first. Check your inbox for the verification link.',
            variant: 'destructive'
          });
        } else if (error.message && error.message.includes('verify your email')) {
          toast({ 
            title: 'Email Not Verified', 
            description: 'Please verify your email first. Check your inbox for the verification link.',
            variant: 'destructive'
          });
        } else {
          toast({ 
            title: 'Login Error', 
            description: error?.message || 'Invalid email or password',
            variant: 'destructive' 
          });
        }
        setLoading(false);
      } else {
        toast({ 
          title: 'Welcome back!', 
          description: 'You have been signed in successfully.'
        });
        // Redirect based on role - handled by useEffect after user state updates
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
        });
        setErrors(fieldErrors);
        toast({ 
          title: 'Validation Error', 
          description: Object.values(fieldErrors)[0] || 'Please check all fields',
          variant: 'destructive'
        });
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        
        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <Link to="/" className="inline-block mb-4">
              <Logo />
            </Link>
            
            {isSignUp ? (
              <>
                <CardTitle className="font-serif text-2xl">Create Your Account</CardTitle>
                <CardDescription>Join our community and start your journey</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent>
            {isSignUp ? (
              // ============================================
              // SIGN UP FORM
              // ============================================
              <form onSubmit={handleSignUp} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="John Doe"
                    disabled={loading}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    value={signUpEmail} 
                    onChange={(e) => setSignUpEmail(e.target.value)} 
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters, with uppercase, lowercase, and numbers
                  </p>
                  <div className="relative">
                    <Input 
                      id="signup-password" 
                      type={showPassword ? 'text' : 'password'} 
                      value={signUpPassword} 
                      onChange={(e) => setSignUpPassword(e.target.value)} 
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                  <Label>What would you like to do?</Label>
                  <div className="space-y-2">
                    <RoleCard 
                      role="user" 
                      isSelected={selectedRole === 'user'} 
                      onSelect={setSelectedRole}
                    />
                    <RoleCard 
                      role="author" 
                      isSelected={selectedRole === 'author'} 
                      onSelect={setSelectedRole}
                    />
                  </div>
                  {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full btn-glow" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>

                {/* Switch to Login */}
                <div className="text-center text-sm">
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <button 
                      onClick={() => {
                        setIsSignUp(false);
                        setErrors({});
                      }} 
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              // ============================================
              // LOGIN FORM
              // ============================================
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="login-password" 
                      type={showPassword ? 'text' : 'password'} 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)} 
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full btn-glow" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                {/* Switch to Signup */}
                <div className="text-center text-sm">
                  <p className="text-muted-foreground">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => {
                        setIsSignUp(true);
                        setErrors({});
                      }} 
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            {isSignUp 
              ? 'By signing up, you agree to our Terms of Service and Privacy Policy'
              : 'Don\'t remember your password? You can reset it on the next page'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
