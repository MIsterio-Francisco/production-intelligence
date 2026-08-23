import { runDailyCompanyIntake } from "../../lib/intake/daily-company-intake";

export const handler = async () => {
  try {
    const result = await runDailyCompanyIntake();
    console.log(JSON.stringify({ event: "DAILY_COMPANY_INTAKE", ...result }));
    return { statusCode: 200, body: JSON.stringify({ data: result, error: null }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daily intake failed.";
    console.error(JSON.stringify({ event: "DAILY_COMPANY_INTAKE_FAILED", error: message }));
    return { statusCode: 500, body: JSON.stringify({ data: null, error: message }) };
  }
};

export const config = { schedule: "0 6 * * *" };
