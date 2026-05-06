"use client";

import { SessionProvider }  from "next-auth/react";
import { ConfirmProvider }  from "@/components/ui/ConfirmModal";
import { ThemeProvider }    from "@/components/ui/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
