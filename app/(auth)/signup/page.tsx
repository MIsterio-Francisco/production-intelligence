"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, ArrowRight, Lock, Mail } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSuccess("Account created successfully. Check your email or sign in.");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground font-black text-xl tracking-tighter mb-2 shadow-card">
            PI
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight uppercase">
            PRODUCTION <span className="text-accent">INTELLIGENCE</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Create an Analyst Account
          </p>
        </div>

        <Card className="shadow-float border-border">
          <CardHeader className="space-y-1 pb-4 border-b border-border/50">
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>Sign Up</span>
              <UserPlus className="h-4 w-4 text-accent" />
            </CardTitle>
            <CardDescription>
              Register to save companies, build watchlists, and configure intelligence alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-md font-medium">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md font-medium">
                  {success}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center space-x-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Work Email</span>
                </label>
                <Input
                  type="email"
                  placeholder="analyst@postproduction.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center space-x-1">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Password</span>
                </label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center space-x-1">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Confirm Password</span>
                </label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="accent" className="w-full font-bold" disabled={loading}>
                {loading ? "Creating Account..." : "Register Analyst Account"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
              Already have an account?{" "}
              <Link href="/login" className="text-accent font-bold hover:underline">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
