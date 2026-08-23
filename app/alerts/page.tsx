"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Shield, Mail, CheckCircle2, Send, Clapperboard, Sparkles, User, Camera, Film } from "lucide-react";

export default function AlertsPage() {
  const [recipientEmail, setRecipientEmail] = useState("francisco@misteriocolorlab.com");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"config" | "preview">("config");

  const handleSendTestEmail = async () => {
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/v1/alerts/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail }),
      });
      const data = await res.json();
      setSendResult(data);
    } catch (err: any) {
      setSendResult({ success: false, error: err.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              Email Alert Configuration
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure alerts after verified projects and recipients are available.
            </p>
          </div>
          <Badge variant="accent" className="font-mono text-xs font-bold">
            NOT CONFIGURED
          </Badge>
        </div>

        {/* Primary Email Configuration Card */}
        <Card className="border-accent/40 bg-card shadow-subtle overflow-hidden">
          <CardHeader className="py-3.5 px-4 bg-accent/5 border-b border-accent/20 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
              <Mail className="h-4 w-4 text-accent" />
              <span>Direct Email Dispatch Configuration</span>
            </CardTitle>
            <Badge variant="success" className="font-mono text-[10px] font-bold">
              RECIPIENT DRAFT
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-accent" /> Target Alert Email Recipient
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="francisco@misteriocolorlab.com"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-[11px] text-muted-foreground">
                  All automated signals for projects entering production/post-production will be dispatched to this email address.
                </p>
              </div>

              <div className="flex flex-col justify-end">
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleSendTestEmail}
                  disabled={true}
                  className="font-bold h-9 w-full shadow-subtle"
                >
                  {isSending ? (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 animate-spin" /> Dispatching...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5" /> Dispatch unavailable
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {sendResult && (
              <div className="p-4 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {sendResult.message || "Email alert successfully dispatched!"}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] bg-white border-emerald-300 text-emerald-800">
                    ID: {sendResult.details?.messageId || "msg_ok"}
                  </Badge>
                </div>
                <div className="text-[11px] font-mono bg-white/80 p-2.5 rounded border border-emerald-200 space-y-1 text-slate-800">
                  <div><strong>Subject:</strong> {sendResult.details?.formattedSubject}</div>
                  <div><strong>Recipient:</strong> {sendResult.details?.recipient}</div>
                  <div><strong>Timestamp:</strong> {sendResult.details?.timestamp}</div>
                </div>
              </div>
            )}

            {/* Included Data Knowledge Matrix */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Included Email Knowledge Payload
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
                  <div className="flex items-center gap-1 font-bold text-foreground">
                    <Film className="h-3.5 w-3.5 text-accent" /> Title &amp; Budget
                  </div>
                  <p className="text-[11px] text-muted-foreground">Title, original title, budget range &amp; genre.</p>
                </div>
                <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
                  <div className="flex items-center gap-1 font-bold text-foreground">
                    <Camera className="h-3.5 w-3.5 text-accent" /> Director &amp; DoP
                  </div>
                  <p className="text-[11px] text-muted-foreground">Director name, Director of Photography (DoP) &amp; writers.</p>
                </div>
                <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
                  <div className="flex items-center gap-1 font-bold text-foreground">
                    <User className="h-3.5 w-3.5 text-accent" /> Decision Makers
                  </div>
                  <p className="text-[11px] text-muted-foreground">Head of Production &amp; Executive Producer direct emails.</p>
                </div>
                <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1">
                  <div className="flex items-center gap-1 font-bold text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-accent" /> MCL Score
                  </div>
                  <p className="text-[11px] text-muted-foreground">MCL Opportunity score &amp; color finishing claim.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 11.8 PRD Active Alert Rules */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span>Configured Alert Triggers &amp; Automations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border text-xs">
              {[
                {
                  id: "rule-1",
                  name: "New Spanish & International Feature entering Production / Post",
                  condition: "Auto-send email brief to francisco@misteriocolorlab.com with Director, DoP, Budget, and Head of Production contacts when project reaches Post-Production status.",
                  active: false,
                  triggered: "Draft — requires verified source data",
                },
                {
                  id: "rule-2",
                  name: "MCL Color Finishing Score > 85% Opportunity Alert",
                  condition: "Auto-dispatch high priority opportunity dossier when MCL Match score exceeds 85% threshold.",
                  active: false,
                  triggered: "Draft — dispatch disabled",
                },
              ].map((rule) => (
                <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-secondary/40">
                  <div className="space-y-1">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <span>{rule.name}</span>
                      <Badge variant="outline">DRAFT</Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px] font-mono">{rule.condition}</p>
                    <div className="text-[10px] text-accent font-semibold">{rule.triggered}</div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs font-semibold">
                    Edit Rule
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
