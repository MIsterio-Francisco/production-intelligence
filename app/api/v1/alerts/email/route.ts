import { NextResponse } from "next/server";
import { sendProjectOpportunityEmailAlert } from "@/lib/services/email-alert-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const recipientEmail = body.recipientEmail || "francisco@misteriocolorlab.com";
    const projectId = body.projectId || "p_vaca1";

    const sampleProject = {
      id: "p_vaca1",
      title: "Celda 211 (Cell 211)",
      original_title: "Celda 211",
      project_type: "feature_film",
      status: "post_production",
      release_date: "2025-10-15",
      country_code: "ES",
      genre: ["Thriller", "Action", "Drama"],
      director_name: "Daniel Monzón",
      dop_name: "Carles Gusi (AEC)",
      writers: ["Jorge Guerricaechevarría", "Daniel Monzón"],
      language: "Spanish",
      budget_min: 6500000,
      budget_max: 9000000,
      budget_currency: "EUR",
      description: "High-budget theatrical thriller in picture finishing and 4K HDR master color grading phase.",
    };

    const sampleCompany = {
      id: "c43",
      name: "Vaca Films",
      slug: "vaca-films",
      country_name: "Spain",
      city: "A Coruña",
      website_url: "https://vacafilms.com",
      contact_email: "emma@vacafilms.com",
      phone: "+34 981 145 001",
    };

    const sampleExecutives = [
      { full_name: "Emma Lustres", role: "Founder & Head of Production", contact_email: "emma@vacafilms.com", phone: "+34 981 145 001" },
      { full_name: "Borja Pena", role: "Managing Director & Producer", contact_email: "borja@vacafilms.com", phone: "+34 981 145 002" },
    ];

    const result = await sendProjectOpportunityEmailAlert({
      recipientEmail,
      project: sampleProject,
      company: sampleCompany,
      executives: sampleExecutives,
      signal: {
        signal_type: "PROJECT_ENTERED_POST",
        severity: "CRITICAL",
        signal_score: 96,
        signal_title: "Project Entered Post-Production: Celda 211",
        signal_description: "Vaca Films feature thriller has entered picture finishing and 4K HDR color grading phase with urgent post-production vendor selection.",
        mcl_match_score: 96,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Project Opportunity email alert successfully dispatched to ${recipientEmail}`,
      details: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dispatch email alert" },
      { status: 500 }
    );
  }
}
