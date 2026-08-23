import { refreshApolloBudgetPhase } from "../../lib/contacts/apollo-budget";

export const handler = async () => {
  try {
    const phase = await refreshApolloBudgetPhase();
    console.log(JSON.stringify({ event: "APOLLO_BUDGET_PHASE_REFRESH", phase, checkedAt: new Date().toISOString() }));
    return { statusCode: 200, body: JSON.stringify({ phase }) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Apollo budget rollover failed.";
    return { statusCode: 500, body: JSON.stringify({ error: message }) };
  }
};

export const config = { schedule: "15 0 * * *" };
