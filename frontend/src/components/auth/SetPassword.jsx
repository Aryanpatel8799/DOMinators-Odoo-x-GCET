import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function SetPassword({ token, onSuccess, onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Validate token on component mount
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('No token provided. Please use the link from your email.');
      setValidating(false);
      return;
    }
    
    try {
      setValidating(true);
      // We'll validate by checking if the token format is correct
      // The actual validation happens when setting the password
      setTokenValid(true);
    } catch (err) {
      setError('Invalid or expired token. Please request a new password reset link.');
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await authAPI.setPassword(token, formData.password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (onNavigateToLogin) {
          onNavigateToLogin();
        }
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to set password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Validating your link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Password Set Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your password has been set. You can now login with your email and new password.
            </p>
            <p className="text-sm text-gray-500 mb-4">Redirecting to login...</p>
            <Button onClick={onNavigateToLogin} className="w-full">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-4">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <Button onClick={onNavigateToLogin} className="w-full">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Shiv Furniture</h1>
            <p className="text-gray-600 mt-1">Set Your Password</p>
          </div>
          
          <p className="text-sm text-gray-600 mb-6 text-center">
            Welcome! Please create a password for your account to access your invoices and make payments.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your new password"
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting Password...
                </>
              ) : (
                'Set Password'
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={onNavigateToLogin}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={loading}
            >
              Already have a password? Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
