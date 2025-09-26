'use client';

import React, { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import './login.css';
import RevaniLogo from '@/components/RevaniLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const router = useRouter();
  const { data: session } = useSession();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (session) {
      router.push('/select');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        router.push('/select');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Ocean Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="ocean-background"

        onError={(e) => {
          console.error('Video failed to load:', e);
        }}
      >
        <source src="/71122-537102350_small.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Background Pattern */}
      <div className="background-pattern"></div>
      
      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-orb purple"></div>
        <div className="floating-orb blue"></div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Logo/Brand */}
        <div className="brand-section">
          <div className="brand-logo">
            <span>D</span>
          </div>
          <h1 className="brand-title">Welcome back</h1>
          <p className="brand-subtitle">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <p className="error-text">{error}</p>
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                Remember me
              </label>
              <a href="#" className="forgot-password">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
                             {isLoading ? (
                 <>
                   <div className="loading-spinner"></div>
                   Signing in...
                 </>
               ) : (
                 'Sign in'
               )}
            </button>
          </form>

          

        </div>


      </div>
    </div>
  );
} 