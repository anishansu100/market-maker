"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TRPCReactProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {children}
      </TooltipProvider>
    </TRPCReactProvider>
  );
}
