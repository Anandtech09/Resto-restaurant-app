import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';

export const Auth = () => {
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [timer, setTimer] = useState(300);
  const [otpDisplay, setOtpDisplay] = useState<string | null>(null);
  const [expectedOtp, setExpectedOtp] = useState<string>(''); // 👉 Store the correct OTP here

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (otpSent && timer > 0) {
      const countdown = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(countdown);
    }
  }, [otpSent, timer]);

  const fullPhone = `${countryCode}${phone}`;
  const dummyEmail = `${fullPhone.replace('+', '')}@phone.local`;

  const handleSendOtp = async () => {
    if (!phone.trim() || !password.trim() || (isSignUp && !fullName.trim())) {
      toast({
        title: 'Missing fields',
        description: 'Please fill out all fields before sending OTP.',
        variant: 'destructive',
      });
      return;
    }

    setOtpDisplay(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sent-otp', {
        body: { phone: fullPhone, action: 'send' },
      });

      if (error || !data?.otp) {
        throw new Error(data?.message || error?.message || 'Failed to send OTP');
      }

      setExpectedOtp(data.otp); // 👉 Store OTP
      setOtpSent(true);
      setTimer(300);

      toast({
        title: 'OTP Sent',
        description: `OTP has been sent to ${fullPhone}`,
      });

      setTimeout(() => {
        setOtpDisplay(`Your OTP is: ${data.otp}`);
      }, 5000);
    } catch (err) {
      console.error('Send OTP Error:', err);

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedOtp(generatedOtp); // 👉 Store fallback OTP

      setOtpSent(true);
      setTimer(300);

      toast({
        title: 'Unable to send OTP',
        description: 'Due to free Twilio account or function error, OTP not sent to mobile.',
        variant: 'destructive',
      });

      setTimeout(() => {
        setOtpDisplay(`Your OTP is: ${generatedOtp}`);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndSignup = async () => {
    if (!otp.trim()) {
      toast({
        title: 'OTP required',
        description: 'Please enter the verification code.',
        variant: 'destructive',
      });
      return;
    }

    if (otp !== expectedOtp) {
      toast({
        title: 'Invalid OTP',
        description: 'The verification code is incorrect.',
        variant: 'destructive',
      });
      return;
    }

    setVerifyingOtp(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: dummyEmail,
        password,
        options: {
          data: { full_name: fullName, phone: fullPhone },
        },
      });

      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) throw new Error('Sign-up failed.');

      await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: fullName,
        phone: fullPhone,
      });

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password,
      });

      if (loginError) throw loginError;

      toast({
        title: 'Success',
        description: 'Account created and signed in.',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Signup Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Signed In',
        description: 'Welcome back!',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="border-gold">
            {otpDisplay && (
              <div className="bg-[#f5f0e6] border-2 border-[#6f4e37] text-[#2d2d2d] font-bold p-2 text-center mb-2">
                {otpDisplay}
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription>
                {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSignUp && !otpSent ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendOtp();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      className="border-gold"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      placeholder="Enter your password"
                      className="border-gold"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex space-x-2 border-gold">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+1">+1 (US)</SelectItem>
                          <SelectItem value="+91">+91 (IN)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter phone"
                        className="flex-1 border-gold"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </form>
              ) : isSignUp && otpSent ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      maxLength={6}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      {timer > 0
                        ? `OTP expires in ${Math.floor(timer / 60)}:${('0' + (timer % 60)).slice(-2)}`
                        : 'OTP expired'}
                    </p>
                  </div>

                  <Button
                    onClick={handleVerifyOtpAndSignup}
                    className="w-full"
                    disabled={verifyingOtp || otp.length !== 6}
                  >
                    {verifyingOtp ? 'Verifying...' : 'Verify & Sign Up'}
                  </Button>

                  <Button variant="outline" className="w-full" onClick={handleSendOtp} disabled={timer > 0}>
                    Resend OTP
                  </Button>

                  <Button variant="outline" className="w-full" onClick={() => setOtpSent(false)}>
                    Change Phone Number
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex space-x-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+1">+1 (US)</SelectItem>
                          <SelectItem value="+91">+91 (IN)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter phone"
                        className="flex-1 border-gold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      className="border-gold"
                      placeholder="Enter your password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              )}

              {!otpSent && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setOtp('');
                      setOtpSent(false);
                      setPhone('');
                      setPassword('');
                      setFullName('');
                      setOtpDisplay(null);
                      setExpectedOtp('');
                    }}
                  >
                    {isSignUp ? 'Sign in here' : 'Create account'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
