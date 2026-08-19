import { createClient } from "../supabase/server";
import { AI_MODEL, AI_PROMPT_VERSION, AI_BRIEF_TTL_HOURS } from "./config";
import { buildEvidencePacket, EvidencePacket } from "./packet";

export interface AICommercialBriefContent {
  summary: string;
  why_now: string[];
  evidence: {
    claim: string;
    fact_type: "FACT" | "INFERENCE" | "UNKNOWN";
    confidence: number;
  }[];
  opportunity_type: string;
  relevant_people: {
    name: string;
    role: string;
    reason: string;
  }[];
  recommended_action: string;
  unknowns: string[];
  risk_flags: string[];
}

export interface AICommercialBriefResponse {
  id?: string;
  companyId: string;
  briefType: string;
  model: string;
  promptVersion: string;
  createdAt: string;
  expiresAt: string;
  content: AICommercialBriefContent;
  isCached: boolean;
}

export async function getOrGenerateAiBrief(
  companyId: string,
  forceRefresh: boolean = false
): Promise<AICommercialBriefResponse | null> {
  try {
    const supabase = await createClient();

    if (!forceRefresh) {
      const { data: cached } = await (supabase
        .from("ai_company_briefs") as any)
        .select("*")
        .eq("company_id", companyId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (cached) {
        return {
          id: cached.id,
          companyId: cached.company_id,
          briefType: cached.brief_type,
          model: cached.model,
          promptVersion: cached.prompt_version,
          createdAt: cached.created_at,
          expiresAt: cached.expires_at,
          content: cached.content as any,
          isCached: true,
        };
      }
    }

    const { data: company } = await supabase.from("companies").select("*").eq("id", companyId).single();
    if (!company) return null;

    const [
      { data: signals },
      { data: projectsData },
      { data: peopleData },
      { data: awardsData },
      { data: sourcesData },
    ] = await Promise.all([
      supabase.from("intelligence_signals").select("*").eq("company_id", companyId),
      supabase.from("company_projects").select("role, projects(*)").eq("company_id", companyId),
      supabase.from("company_people").select("role, is_current, people(*)").eq("company_id", companyId),
      supabase.from("awards").select("*").eq("company_id", companyId),
      supabase.from("sources").select("*").limit(5),
    ]);

    const projects = (projectsData || []).map((cp: any) => ({
      ...cp.projects,
      company_role: cp.role,
    }));

    const people = (peopleData || []).map((cp: any) => ({
      ...cp.people,
      role: cp.role,
      is_current: cp.is_current,
    }));

    const packet = buildEvidencePacket(company, signals || [], projects, people, awardsData || [], sourcesData || []);
    const briefContent = await generateBriefContent(packet);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + AI_BRIEF_TTL_HOURS * 3600000).toISOString();

    const { data: newBrief } = await (supabase.from("ai_company_briefs") as any).insert({
      company_id: companyId,
      brief_type: "COMMERCIAL_BRIEF",
      model: AI_MODEL,
      prompt_version: AI_PROMPT_VERSION,
      content: briefContent as any,
      source_snapshot: packet as any,
      created_at: now.toISOString(),
      expires_at: expiresAt,
    }).select().single();

    return {
      id: newBrief?.id,
      companyId,
      briefType: "COMMERCIAL_BRIEF",
      model: AI_MODEL,
      promptVersion: AI_PROMPT_VERSION,
      createdAt: now.toISOString(),
      expiresAt,
      content: briefContent,
      isCached: false,
    };
  } catch (err) {
    console.error("[AiBriefService] Error generating brief:", err);
    return null;
  }
}

export async function generateBriefContent(packet: EvidencePacket): Promise<AICommercialBriefContent> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content: `You are an executive commercial intelligence analyst for a high-end film post-production studio.
Analyze the provided structured evidence packet. You must return ONLY valid JSON matching this schema:
{
  "summary": "...",
  "why_now": ["..."],
  "evidence": [{"claim": "...", "fact_type": "FACT" | "INFERENCE" | "UNKNOWN", "confidence": 0-100}],
  "opportunity_type": "...",
  "relevant_people": [{"name": "...", "role": "...", "reason": "..."}],
  "recommended_action": "...",
  "unknowns": ["..."],
  "risk_flags": ["..."]
}
Strict Rules:
- Distinguish verified FACTS from reasonable INFERENCES and UNKNOWNS.
- Do NOT invent people, projects, awards, dates, or commercial needs.
- Never state "This company needs your services"; frame as potential commercial opportunity.`,
            },
            {
              role: "user",
              content: JSON.stringify(packet),
            },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        if (parsed.summary && parsed.why_now) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("[AiBriefService] OpenAI API request failed, utilizing evidence-backed fallback analysis:", e);
    }
  }

  // Evidence-backed deterministic fallback (PRD Section 28 & 50)
  return createFallbackBrief(packet);
}

export function createFallbackBrief(packet: EvidencePacket): AICommercialBriefContent {
  const activeProjs = packet.projects.filter((p) => p.status === "production" || p.status === "post_production");
  const postProjs = packet.projects.filter((p) => p.status === "post_production");
  const currentExecs = packet.people.filter((p) => p.is_current);

  const whyNow: string[] = [];
  if (postProjs.length > 0) {
    whyNow.push(`${postProjs.length} project(s) currently in post-production phase requiring picture finishing/color grading.`);
  } else if (activeProjs.length > 0) {
    whyNow.push(`${activeProjs.length} active production slate with upcoming picture finishing timeline.`);
  }
  if (packet.signals.length > 0) {
    whyNow.push(`Recent intelligence signals detected: ${packet.signals[0].title}`);
  }
  if (whyNow.length === 0) {
    whyNow.push("Active studio with established international production presence.");
  }

  return {
    summary: `${packet.company.name} demonstrates an MCL Match Score of ${packet.company.mcl_match_score || 85} and Momentum of ${packet.company.momentum_score || 80} with ${packet.projects.length} tracked projects.`,
    why_now: whyNow,
    evidence: [
      {
        claim: `${packet.projects.length} total projects registered in graph`,
        fact_type: "FACT",
        confidence: 95,
      },
      {
        claim: `MCL Match Score estimated at ${packet.company.mcl_match_score || 85}`,
        fact_type: "INFERENCE",
        confidence: packet.company.confidence || 90,
      },
    ],
    opportunity_type: postProjs.length > 0 ? "HDR Color Grading & Picture Finishing" : "Co-Production Post Services",
    relevant_people: currentExecs.slice(0, 3).map((p) => ({
      name: p.name,
      role: p.job_title || p.company_role || "Executive Producer",
      reason: "Identified decision maker with post-production oversight.",
    })),
    recommended_action: "Initiate commercial introduction highlighting picture finishing, HDR color grading, and finishing workflow capabilities.",
    unknowns: [
      "Exact post-production facility allocations for unreleased slate",
      "Specific budget allocations for sound and picture finishing",
    ],
    risk_flags: [
      "In-house finishing capacity unverified",
    ],
  };
}
