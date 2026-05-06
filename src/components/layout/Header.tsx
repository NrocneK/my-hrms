"use client";

import { signOut }          from "next-auth/react";
import { getInitials }      from "@/lib/utils";
import { useState }         from "react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle }      from "@/components/ui/ThemeToggle";

interface HeaderProps {
  user:        { id: string; name?: string | null; email: string; role: string; avatarUrl?: string | null };
  onMenuClick: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const displayName = user.name || user.email;

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 dark:bg-gray-900 dark:border-gray-700">
      {/* Left: Hamburger (mobile only) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        aria-label="Mở menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Right: Theme + Bell + User */}
      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />
        <NotificationBell userId={user.id} />

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {getInitials(displayName)}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{displayName}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-36">{user.email}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-20 py-1.5 overflow-hidden">
                {/* User info mini */}
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
