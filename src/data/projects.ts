/** A project shown on the front page; posts link to it by `slug`. */
export interface Project {
  slug: string;
  name: string;
  summary: string;
  role: string;
  stack: string[];
  liveUrl?: string;
}

// Placeholder copy: rewrite each summary in your own words before publishing.
export const projects: Project[] = [
  {
    slug: 'tracktions',
    name: 'Tracktions',
    summary: 'Trading journal that helps traders review their trades and stay consistent.',
    role: 'Solo founder: product, backend, frontend, operations',
    stack: ['Go', 'Angular', 'TypeScript', 'PostgreSQL'],
  },
  {
    slug: 'artha-engine',
    name: 'artha-engine',
    summary: 'Event-driven trading engine: broker feeds, bars, option chains, archival and a live dashboard.',
    role: 'Design and implementation',
    stack: ['Python', 'React', 'Parquet'],
  },
];
