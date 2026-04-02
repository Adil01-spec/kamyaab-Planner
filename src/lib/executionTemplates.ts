export interface ExecutionTemplate {
  slug: string;
  name: string;
  description: string;
  category: string;
  weeks: number;
  tasks: string[];
  milestones: string[];
}

export const executionTemplates: ExecutionTemplate[] = [
  {
    slug: 'launch-saas-product',
    name: 'Launch a SaaS Product',
    description: 'A structured 8-week execution plan to go from idea validation to a live SaaS product with paying customers.',
    category: 'Business',
    weeks: 8,
    tasks: [
      'Validate problem-solution fit with 10 user interviews',
      'Define MVP feature scope and lock requirements',
      'Build core product features (weeks 2-4)',
      'Set up authentication and billing infrastructure',
      'Create landing page with clear value proposition',
      'Run beta testing with 20 early adopters',
      'Iterate on feedback and fix critical bugs',
      'Launch publicly and activate marketing channels',
    ],
    milestones: ['Validation complete', 'MVP built', 'Beta feedback collected', 'Public launch'],
  },
  {
    slug: 'learn-web-development',
    name: 'Learn Web Development',
    description: 'A 12-week structured plan to go from zero to building full-stack web applications with modern technologies.',
    category: 'Learning',
    weeks: 12,
    tasks: [
      'Master HTML & CSS fundamentals with 5 mini-projects',
      'Learn JavaScript core concepts and DOM manipulation',
      'Build 3 interactive front-end projects',
      'Learn React fundamentals and component architecture',
      'Build a full React application with state management',
      'Introduction to back-end: Node.js and databases',
      'Build a full-stack CRUD application',
      'Deploy projects and build a portfolio site',
    ],
    milestones: ['Front-end basics', 'React proficiency', 'Full-stack capable', 'Portfolio complete'],
  },
  {
    slug: 'fitness-transformation',
    name: 'Fitness Transformation Plan',
    description: 'A 10-week progressive fitness execution plan combining strength training, cardio, and nutrition tracking.',
    category: 'Health',
    weeks: 10,
    tasks: [
      'Complete body composition baseline measurements',
      'Establish 4-day workout split routine',
      'Set up meal prep system for weekly nutrition',
      'Progressive overload: increase weights by 5% weekly',
      'Add 3 cardio sessions per week (weeks 4+)',
      'Mid-point assessment and plan adjustment',
      'Intensify training with advanced techniques',
      'Final assessment and transformation documentation',
    ],
    milestones: ['Baseline set', 'Routine established', 'Mid-point check', 'Transformation complete'],
  },
  {
    slug: 'freelance-business-setup',
    name: 'Start a Freelance Business',
    description: 'A 6-week execution plan to set up a freelance business from scratch — from positioning to landing your first 3 clients.',
    category: 'Business',
    weeks: 6,
    tasks: [
      'Define niche, ideal client profile, and service offering',
      'Create portfolio showcasing 3-5 relevant projects',
      'Set up professional profiles on 3 freelance platforms',
      'Build a simple personal website with contact form',
      'Create outreach templates and start cold outreach',
      'Land and deliver first 3 client projects',
    ],
    milestones: ['Positioning done', 'Portfolio ready', 'First client signed', '3 clients delivered'],
  },
  {
    slug: 'exam-preparation',
    name: 'Exam Preparation System',
    description: 'An 8-week structured study plan with spaced repetition, practice tests, and measurable knowledge milestones.',
    category: 'Education',
    weeks: 8,
    tasks: [
      'Create complete syllabus breakdown by topic',
      'Study core topics with active recall (weeks 1-3)',
      'Complete first full practice test and identify gaps',
      'Deep-dive into weak areas with targeted study',
      'Second practice test with timed conditions',
      'Review all high-yield topics and create summary notes',
      'Final practice tests and exam simulation',
      'Rest day, light review, and exam execution',
    ],
    milestones: ['Syllabus mapped', 'First practice test', 'Gaps addressed', 'Exam ready'],
  },
];

export function getTemplateBySlug(slug: string): ExecutionTemplate | undefined {
  return executionTemplates.find((t) => t.slug === slug);
}
