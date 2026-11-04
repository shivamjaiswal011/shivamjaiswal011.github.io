/** The quality areas a post can cover (docs/02-writing-plan.md#concerns). */
export const concernKeys = ['failure', 'security', 'performance', 'ux', 'data-integrity', 'cost'] as const;

export type ConcernKey = (typeof concernKeys)[number];

/** How a concern is shown: its label and the question every post on it answers. */
export interface Concern {
  label: string;
  question: string;
}

export const concerns: Record<ConcernKey, Concern> = {
  failure: { label: 'failure modes', question: 'What happens if this dies between any two lines?' },
  security: { label: 'security', question: 'Who can call this, and what leaks if a secret does?' },
  performance: { label: 'performance', question: 'What is the budget, and what did I measure?' },
  ux: { label: 'UX', question: 'What does the user see when it is slow, wrong or down?' },
  'data-integrity': { label: 'data integrity', question: 'Can every derived number be rebuilt from its source?' },
  cost: { label: 'cost', question: 'What does it cost, and what makes it cost 10×?' },
};
