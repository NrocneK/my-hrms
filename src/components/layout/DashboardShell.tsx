"use client";

import { useState }  from "react";
import { Sidebar }   from "@/components/layout/Sidebar";
import { Header }    from "@/components/layout/Header";

interface Props {
  role:      string;
  user:      { id: string; name?: string | null; email: string; role: string; avatarUrl?: string | null };
  children:  React.ReactNode;
}

export function DashboardShell({ role, user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
