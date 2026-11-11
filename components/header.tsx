'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  FlaskConical,
  Sun,
  Moon,
  LogOut,
  Volume2,
  VolumeX,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { isSoundMuted, toggleSoundMuted } from '@/lib/sound';

export default function Header({ check = true }: { check?: boolean } = {}) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const { user, loading, signOutUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [muted, setMuted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMuted(isSoundMuted());

    const handleMuteChange = () => {
      setMuted(isSoundMuted());
    };

    window.addEventListener('labora_sound_muted_change', handleMuteChange);
    window.addEventListener('storage', handleMuteChange);

    return () => {
      window.removeEventListener('labora_sound_muted_change', handleMuteChange);
      window.removeEventListener('storage', handleMuteChange);
    };
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMute = () => {
    const next = toggleSoundMuted();
    setMuted(next);
  };

  const isEditorActive = pathname === '/dashboard' || pathname === '/';
  const isHistoryActive = pathname.startsWith('/history');

  const getInitials = () => {
    if (!user) return 'U';
    if (user.displayName) {
      const parts = user.displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.displayName.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E5E5] dark:border-[#303033] bg-[#FAFAFA]/90 dark:bg-[#0E0E0F]/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Tab Navigation */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Brand Logo & Wordmark */}
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 select-none transition-opacity hover:opacity-90"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md  text-black transition-transform group-hover:scale-105">
              <FlaskConical className="h-4 w-4 text-black" strokeWidth={2.2} />
            </div>
            <span className="font-heading text-sm font-bold tracking-tight text-[#171717] dark:text-[#F4F4F5]">
              Labora
            </span>
          </Link>

          {/* Simple Horizontal Navigation: Editor    History */}
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              aria-current={isEditorActive ? 'page' : undefined}
              className={`relative py-4 text-xs sm:text-sm font-medium transition-colors ${
                isEditorActive
                  ? 'text-[#171717] dark:text-[#F4F4F5]'
                  : 'text-[#737373] hover:text-[#171717] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5]'
              }`}
            >
              Editor
              {isEditorActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'header-active-nav'}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#171717] dark:bg-[#F4F4F5]"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 500, damping: 35 }
                  }
                />
              )}
            </Link>

            <Link
              href="/history"
              id="tour-history-btn"
              aria-current={isHistoryActive ? 'page' : undefined}
              className={`relative py-4 text-xs sm:text-sm font-medium transition-colors ${
                isHistoryActive
                  ? 'text-[#171717] dark:text-[#F4F4F5]'
                  : 'text-[#737373] hover:text-[#171717] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5]'
              }`}
            >
              History
              {isHistoryActive && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : 'header-active-nav'}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#171717] dark:bg-[#F4F4F5]"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 500, damping: 35 }
                  }
                />
              )}
            </Link>
          </nav>
        </div>

        {/* Right: Controls & User Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={() => toggleTheme()}
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle theme"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5BDB]/40 flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E5E5] dark:border-[#303033] bg-[#FFFFFF] dark:bg-[#19191B] text-[#737373] hover:text-[#171717] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] transition active:scale-95 cursor-pointer"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Mute / Unmute Sound Toggle Button */}
          <button
            onClick={handleToggleMute}
            title={muted ? 'Unmute UI sound' : 'Mute UI sound'}
            aria-label={muted ? 'Unmute UI sound' : 'Mute UI sound'}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5BDB]/40 flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E5E5] dark:border-[#303033] bg-[#FFFFFF] dark:bg-[#19191B] text-[#737373] hover:text-[#171717] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] transition active:scale-95 cursor-pointer"
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-[#737373] dark:text-[#A1A1AA]" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          {/* User Profile / Auth Section */}
          {loading ? (
            <div className="h-8 w-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#303033] bg-[#FFFFFF] dark:bg-[#19191B] px-2 text-xs text-[#171717] dark:text-[#F4F4F5] transition hover:border-neutral-400 dark:hover:border-neutral-600 active:scale-95 cursor-pointer select-none"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                title={user.displayName || user.email || 'User Account'}
              >
                <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px] font-bold text-[#171717] dark:text-[#F4F4F5]">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate text-xs font-medium">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-[#737373] dark:text-[#A1A1AA] transition-transform duration-150 ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl border border-[#E5E5E5] dark:border-[#303033] bg-[#FFFFFF] dark:bg-[#19191B] p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-[#E5E5E5] dark:border-[#303033] mb-1">
                    <p className="text-xs font-semibold text-[#171717] dark:text-[#F4F4F5] truncate">
                      {user.displayName || 'Student'}
                    </p>
                    <p className="text-[11px] text-[#737373] dark:text-[#A1A1AA] truncate mt-0.5">
                      {user.email || 'No email attached'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      signOutUser();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition active:scale-98 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#171717] dark:bg-[#F4F4F5] px-3 text-xs font-medium text-white dark:text-[#171717] transition hover:opacity-90 active:scale-95 cursor-pointer"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
