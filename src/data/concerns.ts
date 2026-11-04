/** The quality areas a post can cover (docs/02-writing-plan.md#concerns). */
export const concernKeys = ['failure', 'security', 'performance', 'ux', 'data-integrity', 'cost'] as const;

export type ConcernKey = (typeof concernKeys)[number];

/** How a concern is shown on a post's tags. Each concern's question is in the writing plan. */
export interface Concern {
  label: string;
}

export const concerns: Record<ConcernKey, Concern> = {
  failure: { label: 'failure modes' },
  security: { label: 'security' },
  performance: { label: 'performance' },
  ux: { label: 'UX' },
  'data-integrity': { label: 'data integrity' },
  cost: { label: 'cost' },
};
