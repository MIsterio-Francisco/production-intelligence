"use client";

import React, { useState } from "react";
import { Search, Bell, LogOut, Flame } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card px-4 lg:px-6 shadow-subtle">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-accent text-accent-foreground font-black text-xs tracking-tighter">
            PI
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground uppercase hidden sm:inline-block">
            PRODUCTION <span className="text-accent font-black">INTELLIGENCE</span>
          </span>
        </Link>
        <span className="text-xs bg-accent/10 text-accent font-mono font-semibold px-2 py-0.5 rounded border border-accent/20">
          V1.5
        </span>
      </div>

      {/* Global Search Bar (Section 11.1 PRD requirement) */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies, people, projects..."
            className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-4 text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        <Link
          href="/opportunities"
          className="flex items-center space-x-1 text-xs font-semibold text-accent hover:text-accent-hover bg-accent/5 hover:bg-accent/10 px-2.5 py-1.5 rounded-md border border-accent/20 transition-colors"
        >
          <Flame className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Signals</span>
        </Link>

        <Link
          href="/alerts"
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
          title="Alerts"
        >
          <Bell className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center space-x-1.5 p-1.5 text-xs font-medium text-foreground hover:bg-secondary rounded-md transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
