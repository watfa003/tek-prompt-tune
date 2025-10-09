import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'credentials' | 'code'>('credentials');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/app');
      }
    };
    checkAuth();
  }, [navigate]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          navigate('/app');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const sendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First check if email already exists
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: 'dummy-check' // This will fail but tell us if email exists
      });

      // If we get here without error about invalid credentials, email might exist
      // But we mainly check the error message
    } catch (checkError: any) {
      // If error is NOT "Invalid login credentials", email likely exists
      if (checkError?.message && !checkError.message.includes('Invalid login credentials')) {
        toast({
          title: "Account exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
        setIsSignUp(false);
        setLoading(false);
        return;
      }
    }

    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);

      // Send the code via email
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: formData.email,
          code: code,
          type: 'signup'
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to send verification code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Verification code sent!",
        description: "Check your email for the 6-digit code.",
      });

      setVerificationStep('code');
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify the code matches
      if (verificationCode.trim() !== sentCode) {
        toast({
          title: "Invalid code",
          description: "The verification code you entered is incorrect. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Email verified via our code - now create the account with confirmed email
      const { data: createData, error: createError } = await supabase.functions.invoke('create-verified-user', {
        body: {
          email: formData.email,
          password: formData.password,
          username: formData.username,
        }
      });

      // Handle errors - the error is in FunctionInvokeError when status is non-2xx
      if (createError) {
        // Extract the actual error message from the FunctionInvokeError context
        const errorContext = (createError as any)?.context;
        let errorMessage = 'Failed to create account';
        
        // The error body is in the context
        if (errorContext?.error) {
          errorMessage = errorContext.error;
        } else if ((createError as any)?.message) {
          errorMessage = (createError as any).message;
        }
        
        console.error('Account creation error:', errorMessage);
        
        // Check if user already exists
        if (errorMessage.toLowerCase().includes('already') || 
            errorMessage.toLowerCase().includes('exists') || 
            errorMessage.toLowerCase().includes('registered') ||
            errorMessage.toLowerCase().includes('email')) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
          setIsSignUp(false);
          setVerificationStep('credentials');
          setVerificationCode('');
          setSentCode('');
          setLoading(false);
          return;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Check if response indicates failure
      if (!createData?.success) {
        toast({
          title: "Error",
          description: "Failed to create account. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('User created successfully, signing in...');

      // Now sign in the user immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        toast({
          title: "Account created!",
          description: "Please sign in with your new credentials.",
        });
        setIsSignUp(false);
        setVerificationStep('credentials');
        setVerificationCode('');
        setSentCode('');
        setLoading(false);
        return;
      }

      toast({
        title: "Welcome to PrompTek!",
        description: "You're now signed in and will be redirected shortly.",
      });

      // The auth state listener will handle navigation
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PrompTek
            </span>
          </Link>
          <h1 className="text-3xl font-bold">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp 
              ? 'Start optimizing your prompts today' 
              : 'Sign in to continue optimizing prompts'
            }
          </p>
        </div>

        {/* Auth Form */}
        <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
          {isSignUp && verificationStep === 'credentials' ? (
            <form onSubmit={sendVerificationCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary"
                disabled={loading || !formData.email || !formData.password || !formData.username}
              >
                {loading ? 'Sending code...' : 'Send Verification Code'}
              </Button>
            </form>
          ) : isSignUp && verificationStep === 'code' ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setVerificationStep('credentials');
                    setVerificationCode('');
                    setSentCode('');
                  }}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? 'Creating account...' : 'Verify & Create Account'}
                </Button>
              </div>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={sendVerificationCode}
                disabled={loading}
              >
                Resend code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary"
                disabled={loading || !formData.email || !formData.password}
              >
                {loading ? 'Please wait...' : 'Sign In'}
              </Button>
            </form>
          )}

          {verificationStep === 'credentials' && (
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setFormData({ username: '', email: '', password: '' });
                  setVerificationCode('');
                  setSentCode('');
                }}
                className="p-0 h-auto font-semibold"
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </Button>
            </div>
          )}
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;