import React, { useState } from 'react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
// Fix 1: Import toast from the correct location
import { toast } from '../hooks/use-toast'; // or wherever your toast hook is located

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'User';

  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
      // Fix 2: Use the correct toast syntax for your toast implementation
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (err: any) {
      toast({
        title: 'Logout Failed',
        description: err?.message || 'An error occurred during logout',
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="w-full py-4 px-6 border-b bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-4 lg:mb-0">
          <div className="h-12 w-12 rounded-full bg-cybersafe-600 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="h-10 w-10" />
          </div>
          <Link to="/">
            <h1 className="text-xl font-bold text-cybersafe-800 dark:text-cybersafe-200">CyberBully</h1>
          </Link>
        </div>
        <div className={`flex items-center space-x-6 ${user ? 'justify-end' : 'justify-center'} w-full lg:w-auto`}>
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <User size={16} className="text-cybersafe-600" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{username}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                </div>
              </div>
              <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-cybersafe-200 hover:bg-cybersafe-50 text-cybersafe-800 dark:text-cybersafe-200 dark:border-cybersafe-400 dark:hover:bg-cybersafe-700 flex items-center gap-1"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign Out Confirmation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to sign out from your account?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {/* Fix 3: Add the missing AlertDialogFooter */}
                  <div className="flex justify-end space-x-2 mt-4">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className="flex items-center space-x-10">
              <Link
                to="/"
                className="text-lg font-medium text-cybersafe-600 hover:text-cybersafe-800 dark:text-cybersafe-200 dark:hover:text-cybersafe-400 transition-colors duration-200"
              >
                Analyze
              </Link>
              <Link
                to="/dashboard"
                className="text-lg font-medium text-cybersafe-600 hover:text-cybersafe-800 dark:text-cybersafe-200 dark:hover:text-cybersafe-400 transition-colors duration-200"
              >
                Dashboard
              </Link>
              <Button
                className="text-lg font-medium bg-cybersafe-600 hover:bg-cybersafe-700 text-white rounded-lg hover:scale-105 transition-transform duration-200"
                asChild
              >
                <Link to="/auth">Log In</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;