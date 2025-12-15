import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Check } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const ProfileSettings = () => {
  const { user, updateEmail, updatePassword } = useAuth();
  const { toast } = useToast();

  // Email update state
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }

    if (newEmail === user?.email) {
      setEmailError('New email must be different from current email');
      return;
    }

    setIsUpdatingEmail(true);

    try {
      const { error } = await updateEmail(newEmail);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Update failed',
          description: error.message,
        });
      } else {
        toast({
          title: 'Email update initiated',
          description: 'Please check your new email address to confirm the change.',
        });
        setNewEmail('');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmPasswordError('');

    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) {
      setPasswordError(result.error.errors[0].message);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Update failed',
          description: error.message,
        });
      } else {
        toast({
          title: 'Password updated',
          description: 'Your password has been changed successfully.',
        });
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Update Email Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Update Email</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Current email: <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <form onSubmit={handleEmailUpdate} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Input
              type="email"
              placeholder="New email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={emailError ? 'border-destructive' : ''}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
          <Button type="submit" disabled={isUpdatingEmail || !newEmail}>
            {isUpdatingEmail ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Update Email
          </Button>
        </form>
      </div>

      <div className="border-t border-border" />

      {/* Update Password Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Update Password</h3>
        </div>
        <form onSubmit={handlePasswordUpdate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={passwordError ? 'border-destructive' : ''}
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={confirmPasswordError ? 'border-destructive' : ''}
              />
              {confirmPasswordError && (
                <p className="text-sm text-destructive">{confirmPasswordError}</p>
              )}
            </div>
          </div>
          <Button type="submit" disabled={isUpdatingPassword || !newPassword || !confirmNewPassword}>
            {isUpdatingPassword ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
