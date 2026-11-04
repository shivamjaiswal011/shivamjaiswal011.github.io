/** A project shown on the front page; posts link to it by `slug`. */
export interface Project {
  slug: string;
  name: string;
  summary: string;
  role: string;
  stack: string[];
  liveUrl?: string;
}

// Facts come from the resume ledger or the project docs (docs/02-writing-plan.md, Bio sources).
export const projects: Project[] = [
  {
    slug: 'tracktions',
    name: 'Tracktions',
    summary:
      'Trading journal for Indian retail traders. Imports fills from broker sync or tradebooks, rebuilds them into trades, and shows each strategy\'s results with the sample size behind every number. Designed, built and run alone, with billing.',
    role: 'Founder and sole engineer · since Oct 2024',
    stack: ['Go', 'Angular', 'TypeScript', 'PostgreSQL', 'AWS'],
    liveUrl: 'https://tracktions.com',
  },
  {
    slug: 'artha-engine',
    name: 'artha-engine',
    summary:
      'Event-driven options trading engine designed around one rule: no failure may cost more than a limit set before the order is sent. Raw event log as the source of truth, replay parity, broker-side stops, one order manager per account.',
    role: 'Design and build · paper trading since Oct 2026',
    stack: ['Python', 'React', 'Parquet'],
  },
];
