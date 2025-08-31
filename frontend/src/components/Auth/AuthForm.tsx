
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'signup';
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  username: string;
  setUsername: (username: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const AuthForm = ({ 
  type, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  username, 
  setUsername, 
  loading, 
  onSubmit 
}: AuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit}>
      {type === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="signup-username">Username</Label>
          <Input
            id="signup-username"
            type="text"
            placeholder="johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`${type}-email`}>Email</Label>
        <div className="relative">
          <Input 
            id={`${type}-email`}
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
          />
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${type}-password`}>Password</Label>
        <div className="relative">
          <Input
            id={`${type}-password`}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
          />
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full bg-cybersafe-600 hover:bg-cybersafe-700 mt-4" 
        disabled={loading}
      >
        {loading 
          ? (type === 'login' ? 'Logging in...' : 'Creating Account...') 
          : (type === 'login' ? 'Login' : 'Sign Up')
        }
      </Button>
    </form>
  );
};

export default AuthForm;
