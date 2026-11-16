'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  FlaskConical,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function LoginPage() {
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
  } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formShakeCount, setFormShakeCount] = useState(0);
  const [emailShakeCount, setEmailShakeCount] = useState(0);
  const [isEmailError, setIsEmailError] = useState(false);

  const showEmailError = (message: string) => {
    setErrorMessage(message);
    setIsEmailError(true);
    setEmailShakeCount((value) => value + 1);
  };

  const showFormError = (message: string) => {
    setErrorMessage(message);
    setIsEmailError(false);
    setFormShakeCount((value) => value + 1);
  };

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const mapFirebaseError = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your details.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return error?.message || 'Authentication failed. Please try again.';
    }
  };

  const handleTabSwitch = (targetMode: AuthMode) => {
    setMode(targetMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEmailError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      showEmailError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showEmailError('Enter a valid email address.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      showFormError('Please enter your name.');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      try {
        await sendPasswordReset(cleanEmail);
        setIsEmailError(false);
        setSuccessMessage(`Reset link sent to ${cleanEmail}. Check your inbox.`);
      } catch (error: any) {
        if (error?.code === 'auth/invalid-email') {
          showEmailError('Please enter a valid email address.');
        } else {
          showFormError(mapFirebaseError(error));
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      showFormError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        showFormError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        showFormError('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      try {
        await signUpWithEmail(cleanEmail, password, name.trim());
        router.push('/dashboard');
      } catch (error: any) {
        if (error?.code === 'auth/invalid-email') {
          showEmailError('Please enter a valid email address.');
        } else {
          showFormError(mapFirebaseError(error));
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmail(cleanEmail, password);
      router.push('/dashboard');
    } catch (error: any) {
      if (error?.code === 'auth/invalid-email') {
        showEmailError('Please enter a valid email address.');
      } else {
        showFormError(mapFirebaseError(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEmailError(false);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error: any) {
      showFormError(mapFirebaseError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fafafa] text-[#18181b] antialiased selection:bg-[#dbe5ff] selection:text-[#18181b]">
      {/* Ambient decoration is independent of the authenticated workspace theme. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-380px] h-[740px] w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,91,219,0.065),transparent_68%)]" />
        <div className="absolute -left-56 top-[30%] h-[420px] w-[720px] -rotate-[24deg] rounded-[50%] border border-[#e9ebef]" />
        <div className="absolute -right-72 bottom-[8%] h-[480px] w-[780px] rotate-[22deg] rounded-[50%] border border-[#eceef2]" />
      </div>

      

      <main className="relative z-10 mx-auto flex w-full max-w-[1140px] flex-1 flex-col items-center justify-center px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[440px]"
        >
          <div className="mb-7 text-center">
              <p className="mb-5 inline-flex items-center gap-2 font-[family-name:var(--font-space-grotesk,inherit)] text-[19px] font-bold tracking-[-0.04em] text-[#18181b]">
                <FlaskConical
                  className="h-4 w-4 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>Labora</span>
              </p>            
              <h1 className="font-[family-name:var(--font-space-grotesk,inherit)] text-[clamp(2rem,5vw,2.65rem)] font-semibold tracking-[-0.055em] text-[#18181b]">
              {mode === 'signin' ? 'Welcome back.' : mode === 'signup' ? 'Create your workspace.' : 'Reset your password.'}
            </h1>
            <p className="mx-auto mt-2 max-w-[340px] text-[13px] leading-6 text-[#777b85] sm:text-sm">
              {mode === 'signin'
                ? 'Sign in to continue working on your lab records.'
                : mode === 'signup'
                  ? 'Start creating and organizing lab records in one place.'
                  : 'Enter your email and we’ll send you a reset link.'}
            </p>
          </div>

          <div className="rounded-[20px] border border-[#e8e9ed] bg-white p-6 shadow-[0_18px_60px_-32px_rgba(29,33,48,0.18),0_2px_10px_rgba(29,33,48,0.025)] sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode="popLayout">
                  {errorMessage && (
                    <motion.div key="error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} role="alert" className="mb-4 overflow-hidden">
                      <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {errorMessage}
                      </div>
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div key="success" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} role="status" className="mb-4 overflow-hidden">
                      <div className="flex gap-2 rounded-lg border border-[#d5dfd8] bg-[#f2f7f3] px-3 py-2.5 text-xs leading-5 text-[#435c4a]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {successMessage}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.form
                  onSubmit={handleSubmit}
                  noValidate
                  key={`form-${mode}-${formShakeCount}`}
                  animate={formShakeCount ? { x: [0, -7, 6, -4, 3, 0] } : { x: 0 }}
                  transition={{ x: { duration: 0.28, ease: 'easeInOut' } }}
                  className="space-y-[18px]"
                >
                  {mode === 'signup' && (
                    <div>
                      <label htmlFor="auth-name" className="mb-2 block text-[13px] font-medium text-[#4b515c]">Full name</label>
                      <input id="auth-name" autoComplete="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} placeholder="e.g. Alex Morgan" className="h-11 w-full rounded-[10px] border border-[#E5E5E5] bg-white px-3.5 text-sm outline-none focus:outline-none focus:border-[#3B5BDB] focus:ring-0 transition-colors duration-150 disabled:opacity-60" />
                    </div>
                  )}
                  <div>
                    <label htmlFor="auth-email" className="mb-2 block text-[13px] font-medium text-[#4b515c]">Email address</label>
                    <motion.input
                      key={`auth-email-input-${emailShakeCount}`}
                      animate={emailShakeCount ? { x: [0, -8, 7, -5, 4, -2, 0] } : { x: 0 }}
                      transition={{ x: { duration: 0.32, ease: 'easeInOut' } }}
                      id="auth-email"
                      autoComplete="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (isEmailError) setIsEmailError(false);
                      }}
                      disabled={isSubmitting}
                      placeholder="name@example.com"
                      required
                      className={`h-11 w-full rounded-[10px] border bg-white px-3.5 text-sm outline-none focus:outline-none focus:ring-0 transition-colors duration-150 placeholder:text-[#a3a7af] disabled:opacity-60 ${
                        isEmailError
                          ? 'border-rose-400 focus:border-rose-500'
                          : 'border-[#E5E5E5] focus:border-[#3B5BDB]'
                      }`}
                    />
                  </div>
                  {mode !== 'forgot' && (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label htmlFor="auth-password" className="text-[13px] font-medium text-[#4b515c]">Password</label>
                        {mode === 'signin' && <button type="button" onClick={() => handleTabSwitch('forgot')} className="text-xs font-medium text-[#3B5BDB] hover:text-[#364FC7]">Forgot password?</button>}
                      </div>
                      <div className="relative">
                        <input id="auth-password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'} required className="h-11 w-full rounded-[10px] border border-[#E5E5E5] bg-white px-3.5 pr-11 text-sm outline-none focus:outline-none focus:border-[#3B5BDB] focus:ring-0 transition-colors duration-150 placeholder:text-[#a3a7af] disabled:opacity-60" />
                        <button type="button" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#838893] hover:text-[#262a32]">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {mode === 'signup' && (
                    <div>
                      <label htmlFor="auth-confirm" className="mb-2 block text-[13px] font-medium text-[#4b515c]">Confirm password</label>
                      <input id="auth-confirm" autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSubmitting} placeholder="Re-enter your password" required className="h-11 w-full rounded-[10px] border border-[#E5E5E5] bg-white px-3.5 text-sm outline-none focus:outline-none focus:border-[#3B5BDB] focus:ring-0 transition-colors duration-150 placeholder:text-[#a3a7af] disabled:opacity-60" />
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting || authLoading} className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-[#3B5BDB] px-4 text-[13px] font-semibold text-white shadow-[0_5px_13px_rgba(59,91,219,0.13)] transition hover:bg-[#364FC7] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <>
                      {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset email'}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>}
                  </button>
                </motion.form>

                {mode !== 'forgot' && (
                  <div className="mt-5">
                    <div className="mb-4 flex items-center gap-3 text-[11px] text-[#9a9ea7]"><div className="h-px flex-1 bg-[#eceef1]" /><span>or continue with</span><div className="h-px flex-1 bg-[#eceef1]" /></div>
                    <button type="button" onClick={handleGoogleSignIn} disabled={isSubmitting || authLoading} className="flex h-11 w-full items-center justify-center gap-2.5 rounded-[11px] border border-[#e1e4e8] bg-white text-[13px] font-medium text-[#3f444e] transition hover:bg-[#f8f9fa] disabled:opacity-60">
                      <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                      Continue with Google
                    </button>
                  </div>
                )}

                {mode === 'forgot' ? (
                  <button type="button" onClick={() => handleTabSwitch('signin')} className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-[#3B5BDB] hover:text-[#364FC7]"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</button>
                ) : (
                  <p className="mt-6 text-center text-[12px] text-[#777b85]">
                    {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button type="button" disabled={isSubmitting} onClick={() => handleTabSwitch(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-[#3B5BDB] hover:text-[#364FC7] hover:underline disabled:opacity-50">
                      {mode === 'signin' ? 'Create account' : 'Sign in'}
                    </button>
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-[1140px] items-center justify-center px-5 py-6 text-center text-[11px] text-[#9a9ea7] sm:px-8">
        © {new Date().getFullYear()} Labora. Lab records, simplified.
      </footer>
    </div>
  );
}
