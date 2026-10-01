import React, { useState, useEffect, useRef } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import type { UserResponseDto } from '@nis/shared';
import { useLogoutMutation } from '@/features/auth/api/use-logout-mutation';
import { BranchSwitcher } from '@/features/branches/components/BranchSwitcher';
import { useSocketSetup } from '@/hooks/useSocketSetup';
import { Spotlight } from '@/components/ui/Spotlight';

interface Props {
  user: UserResponseDto;
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SidebarCollapseIcon({
  className = 'h-5 w-5',
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M9 3v18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 9l-3 3 3 3" />
    </svg>
  );
}

function SidebarExpandIcon({ className = 'h-5 w-5' }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M9 3v18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 15l3-3-3-3" />
    </svg>
  );
}

export function AppShell({ user, children }: Props): React.ReactElement {
  useSocketSetup();
  const logout = useLogoutMutation();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nis_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const profileRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nis_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Keyboard shortcut listener: Cmd+B or Ctrl+B to toggle sidebar (Vercel-style)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileCardOpen(false);
  }, [currentPath]);

  // Click outside listener for profile card
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileCardOpen(false);
      }
    }
    if (profileCardOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileCardOpen]);

  // Escape key listener (R-32 Keyboard Accessibility)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (profileCardOpen) {
          setProfileCardOpen(false);
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    }
    if (mobileMenuOpen || profileCardOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [mobileMenuOpen, profileCardOpen]);

  const navItems: NavItem[] =
    user.role === 'TEACHER'
      ? [
          {
            to: '/',
            label: 'Dashboard',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            ),
          },
          {
            to: '/my-class',
            label: 'My class',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            ),
          },
          {
            to: '/attendance',
            label: 'Attendance',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            ),
          },
          {
            to: '/grades',
            label: 'Grades',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            ),
          },
          {
            to: '/schedule',
            label: 'Schedule',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            ),
          },
          {
            to: '/clubs',
            label: "To'garaklar",
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3a9 9 0 019 9M12 21a9 9 0 01-9-9M3.6 9h16.8M3.6 15h16.8"
                />
              </svg>
            ),
          },
          {
            to: '/profile',
            label: 'Profile',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            ),
          },
        ]
      : [
          {
            to: '/',
            label: 'Dashboard',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            ),
          },
          {
            to: '/users',
            label: 'Users',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ),
          },
          {
            to: '/branches',
            label: 'Filiallar',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            ),
          },
          {
            to: '/classes',
            label: 'Classes',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            ),
          },
          {
            to: '/students',
            label: 'Students',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                />
              </svg>
            ),
          },
          {
            to: '/attendance',
            label: 'Attendance',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            ),
          },
          {
            to: '/grades',
            label: 'Grades',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            ),
          },
          {
            to: '/billing',
            label: 'Billing',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
          },
          {
            to: '/clubs',
            label: "To'garaklar & Doiralar",
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3a9 9 0 019 9M12 21a9 9 0 01-9-9M3.6 9h16.8M3.6 15h16.8"
                />
              </svg>
            ),
          },
          {
            to: '/leads',
            label: 'Leads CRM',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            ),
          },
          {
            to: '/notifications',
            label: 'Notifications',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            ),
          },
          {
            to: '/reports',
            label: 'Hisobotlar',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            ),
          },
          {
            to: '/subjects',
            label: 'Subjects',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            ),
          },
          {
            to: '/rooms',
            label: 'Rooms',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
            ),
          },
          {
            to: '/schedule',
            label: 'Schedule',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            ),
          },
          {
            to: '/profile',
            label: 'Profile',
            icon: (_active) => (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            ),
          },
        ];

  const initials = getInitials(user.fullName);

  return (
    <div className="min-h-dvh flex bg-muted-surface text-tertiary">
      <Spotlight />
      {/* ------------------------------------------------------------- */}
      {/* 1. DESKTOP LEFT SIDEBAR                                       */}
      {/* ------------------------------------------------------------- */}
      <aside
        aria-label="Desktop Sidebar"
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-30 bg-surface border-r border-border/50 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-64'
        }`}
      >
        {/* Brand / Logo + Toggle */}
        <div
          className={`flex h-16 items-center border-b border-border transition-all duration-200 ${
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted-surface text-tertiary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Expand sidebar"
              title="Expand sidebar (Ctrl+B)"
            >
              <div className="h-9 w-9 rounded-lg bg-primary text-tertiary font-bold flex items-center justify-center text-sm shadow-sm tracking-wide">
                NIS
              </div>
            </button>
          ) : (
            <>
              <Link
                to="/"
                className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <div className="h-9 w-9 rounded-lg bg-primary text-tertiary font-bold flex items-center justify-center text-sm shadow-sm tracking-wide shrink-0">
                  NIS
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-tertiary text-base leading-tight tracking-tight truncate">
                    Nordic CRM
                  </span>
                  <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider truncate">
                    International School
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                className="min-h-[44px] min-w-[44px] p-2 inline-flex items-center justify-center rounded-lg text-neutral-500 hover:bg-muted-surface hover:text-tertiary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Collapse sidebar"
                title="Collapse sidebar (Ctrl+B)"
              >
                <SidebarCollapseIcon />
              </button>
            </>
          )}
        </div>

        {/* Navigation list */}
        <div
          className={`flex-1 flex flex-col justify-between overflow-y-auto py-5 transition-all duration-200 ${
            sidebarCollapsed ? 'px-2' : 'px-4'
          }`}
        >
          <nav aria-label="Main Navigation" className="space-y-1">
            {navItems.map((item) => {
              const active =
                currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  className={`min-h-[44px] py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                    sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                  } ${
                    active
                      ? 'bg-[#DBEAFE] text-secondary font-semibold'
                      : 'text-neutral-500 hover:text-tertiary hover:bg-muted-surface'
                  }`}
                >
                  <span className={`shrink-0 ${active ? 'text-secondary' : 'text-neutral-400'}`}>
                    {item.icon(active)}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Info */}
          {!sidebarCollapsed ? (
            <div className="pt-4 border-t border-border text-xs text-neutral-500 px-2 space-y-1">
              <div className="font-medium text-neutral-500">NIS Tashkent</div>
              <div>Academic Year 2026-2027</div>
            </div>
          ) : (
            <div className="pt-4 border-t border-border flex justify-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className="min-h-[44px] min-w-[44px] p-2 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:bg-muted-surface hover:text-tertiary transition-colors"
                aria-label="Expand sidebar"
                title="Expand sidebar (Ctrl+B)"
              >
                <SidebarExpandIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE DRAWER SIDEBAR                                      */}
      {/* ------------------------------------------------------------- */}
      {mobileMenuOpen ? (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-tertiary/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface shadow-2xl border-r border-border/50">
            {/* Drawer Header */}
            <div className="h-16 px-6 border-b border-border flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="h-8 w-8 rounded-lg bg-primary text-tertiary font-bold flex items-center justify-center text-sm shadow-sm">
                  NIS
                </div>
                <span className="font-semibold text-tertiary text-base">Nordic CRM</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] p-2 inline-flex items-center justify-center rounded-lg text-neutral-500 hover:bg-muted-surface focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close sidebar"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Nav Items */}
            <nav
              aria-label="Mobile Drawer Navigation"
              className="flex-1 px-4 py-4 space-y-1 overflow-y-auto"
            >
              {navItems.map((item) => {
                const active =
                  currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                      active
                        ? 'bg-[#DBEAFE] text-secondary font-semibold'
                        : 'text-tertiary hover:bg-muted-surface hover:text-tertiary'
                    }`}
                  >
                    <span className={active ? 'text-secondary' : 'text-neutral-400'}>
                      {item.icon(active)}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN CONTENT AREA (Offset by sidebar width on desktop)     */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-64'
        }`}
      >
        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/50 bg-surface/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger & Desktop toggle button */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-h-[44px] min-w-[44px] p-2 inline-flex items-center justify-center rounded-lg text-tertiary hover:bg-muted-surface focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Open sidebar"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop header toggle button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:inline-flex min-h-[44px] min-w-[44px] p-2 items-center justify-center rounded-lg text-neutral-500 hover:bg-muted-surface hover:text-tertiary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            >
              {sidebarCollapsed ? <SidebarExpandIcon /> : <SidebarCollapseIcon />}
            </button>

            <div className="hidden sm:flex items-center gap-2.5">
              <span className="text-sm font-semibold text-tertiary tracking-tight">
                Nordic International School
              </span>
              <span className="text-border">/</span>
              <BranchSwitcher />
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-spotlight'))}
              className="w-full flex items-center text-left px-3 py-1.5 text-sm text-neutral-500 bg-muted-surface hover:bg-border rounded-lg border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <svg
                className="h-4 w-4 mr-2 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              Search or type a command...
              <span className="ml-auto flex gap-1 items-center">
                <kbd className="font-sans text-[10px] px-1.5 py-0.5 rounded-lg bg-surface border border-border/50 shadow-sm text-neutral-500 font-medium">
                  Cmd+K
                </kbd>
              </span>
            </button>
          </div>

          {/* TOP-RIGHT PROFILE ZONE */}
          <div className="relative" ref={profileRef}>
            {/* Profile Button Trigger (R-03 >=44px touch target) */}
            <button
              type="button"
              id="profile-menu-button"
              onClick={() => setProfileCardOpen(!profileCardOpen)}
              className="min-h-[44px] flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full hover:bg-muted-surface border border-border/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-haspopup="true"
              aria-expanded={profileCardOpen}
              aria-label="User profile menu"
            >
              {/* Avatar circle */}
              <div className="h-8 w-8 rounded-full bg-primary text-tertiary font-semibold flex items-center justify-center text-xs shadow-sm ring-2 ring-white">
                {initials}
              </div>

              {/* Name & Role (hidden on tiny screens) */}
              <div className="text-left hidden sm:block leading-tight">
                <div className="text-sm font-semibold text-tertiary truncate max-w-[130px]">
                  {user.fullName}
                </div>
                <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                  {user.role}
                </div>
              </div>

              {/* Down chevron icon */}
              <svg
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                  profileCardOpen ? 'rotate-180 text-secondary' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* PROFILE CARD POPOVER */}
            {profileCardOpen ? (
              <div
                className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-surface shadow-xl border-none ring-1 ring-border divide-y divide-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="profile-menu-button"
              >
                {/* User Identity Card Header */}
                <div className="p-4 flex items-center gap-3 bg-muted-surface/70 rounded-t-xl">
                  <div className="h-11 w-11 rounded-full bg-primary text-tertiary font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-secondary/20 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-tertiary truncate">
                      {user.fullName}
                    </div>
                    <div className="text-xs text-neutral-500 truncate" title={user.email}>
                      {user.email}
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DBEAFE] text-secondary uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="p-2 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setProfileCardOpen(false)}
                    className="min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-tertiary hover:bg-muted-surface hover:text-tertiary transition-colors"
                    role="menuitem"
                  >
                    <svg
                      className="h-4 w-4 text-neutral-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>My Profile</span>
                  </Link>
                </div>

                {/* Card Action / Sign Out */}
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileCardOpen(false);
                      logout.mutate();
                    }}
                    disabled={logout.isPending}
                    className="min-h-[44px] w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-error hover:bg-[#FEE2E2] hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-error"
                    role="menuitem"
                  >
                    <svg
                      className="h-4 w-4 text-error"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>{logout.isPending ? 'Signing out...' : 'Sign out'}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
