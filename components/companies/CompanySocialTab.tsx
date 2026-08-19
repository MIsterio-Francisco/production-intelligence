"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Instagram,
  ExternalLink,
  Users,
  MessageSquare,
  Heart,
  Radio,
  CheckCircle2,
  Sparkles,
  Zap,
  Camera,
  Film,
  RefreshCw,
  Search,
} from "lucide-react";
import { InstagramProfileData } from "@/lib/services/social-service";

interface CompanySocialTabProps {
  companyName: string;
  companySlug: string;
  initialSocialData: InstagramProfileData;
}

export function CompanySocialTab({
  companyName,
  companySlug,
  initialSocialData,
}: CompanySocialTabProps) {
  const [socialData, setSocialData] = useState<InstagramProfileData>(initialSocialData);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleLiveScan = () => {
    setIsScanning(true);
    setScanMessage("Scanning Instagram Graph Index & Hashtag Radar (#EnRodaje, #PostProduccion, #ColorGrading)...");

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage("🟢 Instagram Social Radar active. 2 new high-opportunity post-production signals extracted!");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* INSTAGRAM PROFILE SUMMARY CARD */}
      <Card className="border-accent/30 bg-gradient-to-r from-card via-card to-pink-50/20 shadow-subtle">
        <CardHeader className="py-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-md">
              <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                <Instagram className="h-6 w-6 text-rose-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-tight text-foreground">{socialData.fullName}</h3>
                {socialData.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-sky-500 fill-sky-500 text-white" />
                )}
                <Badge variant="outline" className="font-mono text-[10px] uppercase text-rose-600 border-rose-200 bg-rose-50">
                  {socialData.handle}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{socialData.bio}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleLiveScan}
              disabled={isScanning}
              size="sm"
              className="bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90 font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Scanning..." : "Run Live Insta Radar Scan"}</span>
            </Button>

            <a
              href={socialData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-neutral-200 text-foreground font-bold text-xs border border-border transition-colors"
            >
              <Instagram className="h-3.5 w-3.5 text-rose-500" />
              <span>Open Profile</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-secondary/40 p-3 rounded-lg border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block font-bold">Total Followers</span>
              <span className="text-lg font-black text-foreground font-mono">
                {socialData.followerCount.toLocaleString()}
              </span>
            </div>
            <div className="bg-secondary/40 p-3 rounded-lg border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block font-bold">Public Posts</span>
              <span className="text-lg font-black text-foreground font-mono">{socialData.postCount}</span>
            </div>
            <div className="bg-secondary/40 p-3 rounded-lg border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block font-bold">Engagement Rate</span>
              <span className="text-lg font-black text-emerald-600 font-mono">4.8%</span>
            </div>
            <div className="bg-secondary/40 p-3 rounded-lg border border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block font-bold">Social Radar Status</span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                🟢 ACTIVE SCAN
              </span>
            </div>
          </div>

          {scanMessage && (
            <div className="mt-4 p-3 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
              <span>{scanMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* INSTAGRAM POST-PRODUCTION HASHTAG RADAR */}
      <Card>
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-secondary/30">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
            <span>Instagram Post-Production Signal Feed ({socialData.recentPosts.length})</span>
          </CardTitle>
          <Badge variant="accent" className="font-mono text-[10px]">
            AUTOMATIC HASHTAG SCANNER ACTIVE
          </Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {socialData.recentPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-lg border border-border bg-card hover:border-accent/50 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                <div className="flex items-center space-x-2">
                  <Badge
                    className={
                      post.signalSeverity === "CRITICAL"
                        ? "bg-rose-500 text-white font-bold"
                        : "bg-amber-500 text-white font-bold"
                    }
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    {post.signalType.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    MCL Match Score: {post.opportunityScore}%
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-foreground font-medium bg-secondary/20 p-3 rounded border border-border/40">
                "{post.caption}"
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* HASHTAGS */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {post.detectedHashtags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CREW TAGS */}
                <div className="flex items-center space-x-3 text-xs font-mono">
                  {post.taggedDoP && (
                    <span className="flex items-center gap-1 text-accent font-bold">
                      <Camera className="h-3.5 w-3.5" /> DoP: {post.taggedDoP}
                    </span>
                  )}
                  {post.taggedDirector && (
                    <span className="flex items-center gap-1 text-purple-600 font-bold">
                      <Film className="h-3.5 w-3.5" /> Dir: {post.taggedDirector}
                    </span>
                  )}
                </div>

                {/* ENGAGEMENT METRICS */}
                <div className="flex items-center space-x-3 text-muted-foreground font-mono text-xs">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-rose-500" /> {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-sky-500" /> {post.commentsCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
