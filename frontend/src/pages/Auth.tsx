import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../integrations/supabase/clients';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardDescription,  CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import AuthForm from '../components/auth/AuthForm';
import SocialButtons from '../components/auth/SocialButtons';
import { sendWelcomeEmail, sendConfirmationEmail } from '../components/auth/AuthEmailHandlers';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('login');
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setActiveTab('signup');
    }
  }, [location]);

  const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Step 1: Sign up with email, password, and metadata
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (signUpError) {
      toast({
        title: "Sign Up Failed",
        description: signUpError.message,
        variant: "destructive",
      });
      return;
    }

    // Step 2: As a safeguard, update user metadata (in case it wasn't applied during sign-up)
    if (signUpData?.user) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: username,
        },
      });

      if (updateError) {
        console.error("Metadata update error:", updateError.message);
        toast({
          title: "Metadata Update Failed",
          description: updateError.message,
          variant: "destructive",
        });
      }
    }

    // Step 3: Send welcome and confirmation emails
    if (signUpData?.user) {
      await sendWelcomeEmail(email, username);
      await sendConfirmationEmail(email, username);
    }

    toast({
      title: "Sign Up Successful",
      description: "Check your email for the confirmation link.",
    });

    navigate('/');
  } catch (error) {
    if (error instanceof Error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  } finally {
    setLoading(false);
  }
};


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        navigate('/');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

 const handleSocialLogin = async (provider: 'google' | 'twitter', options?: any) => {
  setLoading(true);

  try {
    const currentOrigin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: currentOrigin,
        ...options,
      },
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Wait a bit for the user to be available after OAuth redirect
      setTimeout(async () => {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
          toast({
            title: "User Retrieval Failed",
            description: userError?.message || "User info not found after login.",
            variant: "destructive",
          });
          return;
        }

       
       toast({
          title: "Login Successful",
          description: "Welcome! You are logged in with Google.",
});


        navigate('/');
      }, 3000); 
    }
  } catch (error) {
    if (error instanceof Error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 mb-4">
        <div className="h-12 w-12 rounded-full bg-cybersafe-600 flex items-center justify-center">
          <img src="/logo.png" alt="Logo" className="h-10 w-10" />
        </div>
        <Link to="/">
          <h1 className="text-xl font-bold text-cybersafe-800">CyberSafe</h1>
        </Link>
      </div>

      
      
      <Card className="w-full max-w-md">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Login to CyberSafe</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AuthForm 
                type="login"
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                username={username}
                setUsername={setUsername}
                loading={loading}
                onSubmit={handleLogin}
              />
              <SocialButtons loading={loading} onSocialLogin={handleSocialLogin} />
            </CardContent>
          </TabsContent>
          
          <TabsContent value="signup">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
              <CardDescription className="text-center">
                Sign up to start detecting cyberbullying
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AuthForm 
                type="signup"
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                username={username}
                setUsername={setUsername}
                loading={loading}
                onSubmit={handleSignUp}
              />
              <SocialButtons loading={loading} onSocialLogin={handleSocialLogin} />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
