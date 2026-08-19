export interface EvidencePacket {
  company: {
    id: string;
    name: string;
    country: string | null;
    type: string | null;
    power_score: number | null;
    mcl_match_score: number | null;
    momentum_score: number | null;
    creative_score: number | null;
    commercial_score: number | null;
    confidence: number | null;
  };
  signals: {
    type: string;
    severity: string;
    title: string;
    date: string;
    evidence: any;
  }[];
  projects: {
    id: string;
    title: string;
    type: string | null;
    status: string | null;
    director: string | null;
    role: string | null;
  }[];
  people: {
    id: string;
    name: string;
    job_title: string | null;
    company_role: string | null;
    is_current: boolean;
  }[];
  awards: {
    name: string;
    year: number | null;
    result: string | null;
  }[];
  sources: {
    name: string;
    credibility: number | null;
  }[];
}

export function buildEvidencePacket(
  company: any,
  signals: any[],
  projects: any[],
  people: any[],
  awards: any[],
  sources: any[]
): EvidencePacket {
  return {
    company: {
      id: company.id,
      name: company.name,
      country: company.country_code,
      type: company.company_type,
      power_score: company.power_score,
      mcl_match_score: company.mcl_match_score,
      momentum_score: company.momentum_score,
      creative_score: company.creative_score,
      commercial_score: company.commercial_score,
      confidence: company.score_confidence,
    },
    signals: (signals || []).map((s) => ({
      type: s.signal_type,
      severity: s.severity,
      title: s.signal_title,
      date: s.signal_date,
      evidence: s.evidence,
    })),
    projects: (projects || []).map((p) => ({
      id: p.id,
      title: p.title,
      type: p.project_type,
      status: p.status,
      director: p.director_name,
      role: p.company_role || "producer",
    })),
    people: (people || []).map((p) => ({
      id: p.id,
      name: p.full_name,
      job_title: p.job_title,
      company_role: p.role,
      is_current: p.is_current ?? true,
    })),
    awards: (awards || []).map((a) => ({
      name: a.name || a.organization,
      year: a.year,
      result: a.result,
    })),
    sources: (sources || []).map((s) => ({
      name: s.source_name || "Official Registry",
      credibility: s.credibility_score || 95,
    })),
  };
}
