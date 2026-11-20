/** The fixed periods a chart or card on the overview can show. */
export const OVERVIEW_PERIODS = ["7d", "30d", "90d"] as const;
export type OverviewPeriod = (typeof OVERVIEW_PERIODS)[number];
