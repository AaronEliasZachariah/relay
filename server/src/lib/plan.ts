/**
 * Plan limits. Free accounts are capped; Pro is unlimited. The caps are what
 * "Pro gating" enforces — the API rejects creates over the limit with HTTP 402
 * (Payment Required), and the app routes the user to the paywall.
 */
export const FREE_LIMITS = {
  campaigns: 2,
  rules: 1,
} as const;

export type LimitedResource = keyof typeof FREE_LIMITS;
