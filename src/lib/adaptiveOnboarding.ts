// Adaptive Onboarding Utilities
// Manages tone, field flexibility, and context-aware prompts

import { Code, Palette, GraduationCap, Store, Video, Crown, HelpCircle, type LucideIcon } from 'lucide-react';

// ============================================
// Profession Types & Configuration
// ============================================

export type Profession = 
  | 'software_engineer' 
  | 'freelancer' 
  | 'student' 
  | 'business_owner' 
  | 'content_creator' 
  | 'executive'
  | 'other';

export interface Question {
  key: string;
  label: string;
  type: 'select' | 'text' | 'textarea' | 'chips' | 'boolean';
  options?: string[];
  showIf?: Record<string, string>;
  placeholder?: string;
  helpText?: string;
}

export interface ProfessionConfig {
  label: string;
  icon: LucideIcon;
  questions: Question[];
  // Whether this profession uses open-ended questions by default
  useOpenInputs?: boolean;
}

// ============================================
// Tone Configuration
// ============================================

export type ToneProfile = 'casual' | 'professional';

/**
 * Professions that receive professional/executive tone
 */
const PROFESSIONAL_TONE_PROFESSIONS: Profession[] = [
  'executive',
  'business_owner',
];

/**
 * Get the tone profile for a given profession
 */
export function getToneProfile(profession: Profession): ToneProfile {
  if (PROFESSIONAL_TONE_PROFESSIONS.includes(profession)) {
    return 'professional';
  }
  return 'casual';
}

/**
 * Get tone-adapted copy for common onboarding phrases
 */
export function getTonedCopy(
  key: string, 
  tone: ToneProfile
): string {
  const copy: Record<string, Record<ToneProfile, string>> = {
    whatDoYouDo: {
      casual: "What do you do?",
      professional: "What is your role?",
    },
    customizeExperience: {
      casual: "We'll customize your planning experience",
      professional: "We'll tailor the planning approach to your context",
    },
    projectTitle: {
      casual: "What are you working on?",
      professional: "What initiative are you planning?",
    },
    projectDescription: {
      casual: "Tell us more about your project",
      professional: "Describe the scope and objectives",
    },
    projectDescriptionPlaceholder: {
      casual: "Describe your project goals, milestones, and what success looks like...",
      professional: "Outline the key objectives, success metrics, and any constraints or dependencies...",
    },
    projectDeadline: {
      casual: "When do you want to complete this?",
      professional: "What is your target timeline?",
    },
    noDeadlineLabel: {
      casual: "There is no deadline",
      professional: "Timeline is flexible",
    },
    noDeadlineHint: {
      casual: "No worries! We'll create a flexible plan focused on consistency and steady progress.",
      professional: "We'll create a priority-driven plan that adapts to evolving requirements.",
    },
    planningModeQuestion: {
      casual: "Do you want to plan at a strategic level?",
      professional: "How would you like the plan shaped?",
    },
    standardPlanningTitle: {
      casual: "Standard planning",
      professional: "Execution-focused",
    },
    standardPlanningDescription: {
      casual: "Quick setup, focus on tasks and execution",
      professional: "Prioritize actionable tasks and clear deliverables",
    },
    strategicPlanningTitle: {
      casual: "Strategic planning",
      professional: "Context-aware",
    },
    strategicPlanningDescription: {
      casual: "Advanced context for complex, long-term projects",
      professional: "Include strategic context, dependencies, and risk factors",
    },
    strategicModeHint: {
      casual: "Enable this if you're planning long-term initiatives, business strategy, or complex projects. You can skip this.",
      professional: "Recommended for initiatives with multiple stakeholders, dependencies, or longer time horizons.",
    },
  };

  return copy[key]?.[tone] || copy[key]?.casual || key;
}

// ============================================
// Profession Configuration
// ============================================

export const professionConfig: Record<Profession, ProfessionConfig> = {
  software_engineer: {
    label: 'Software Engineer',
    icon: Code,
    questions: [
      { key: 'employmentType', label: 'Employment Type', type: 'select', options: ['Company', 'Freelancing'] },
      { key: 'level', label: 'Level', type: 'select', options: ['Junior', 'Mid', 'Senior'], showIf: { employmentType: 'Company' } },
      { key: 'stack', label: 'Stack', type: 'select', options: ['Full-stack', 'Front-end', 'Back-end'], showIf: { employmentType: 'Freelancing' } },
      { key: 'technologies', label: 'Technologies', type: 'chips', options: ['React', 'Next.js', 'Node.js', 'Python', 'PHP', 'Flutter', 'TypeScript', 'Vue.js'] },
      { key: 'aiToolsUsed', label: 'Do you use any AI tools or agentic assistance?', type: 'boolean' },
      { key: 'aiToolsList', label: 'AI Tools You Use', type: 'text', showIf: { aiToolsUsed: 'yes' }, placeholder: 'e.g., ChatGPT, Cursor, Copilot, custom agents' },
    ],
  },
  freelancer: {
    label: 'Freelancer',
    icon: Palette,
    questions: [
      { key: 'freelancerType', label: 'Freelancer Type', type: 'select', options: ['Web Development', 'Mobile Development', 'Graphics Design', 'UI/UX Design', 'Other'] },
      { key: 'tools', label: 'Tools & Technologies', type: 'chips', options: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'React', 'WordPress', 'Shopify'] },
      { key: 'portfolioLink', label: 'Portfolio Link (Optional)', type: 'text' },
    ],
  },
  student: {
    label: 'Student',
    icon: GraduationCap,
    questions: [
      { key: 'fieldOfStudy', label: 'Field of Study', type: 'select', options: ['Computer Science', 'Information Technology', 'Business', 'Engineering', 'Other'] },
      { key: 'semester', label: 'Semester/Year', type: 'text' },
      { key: 'capstoneProject', label: 'Capstone/Major Project Idea', type: 'textarea' },
    ],
  },
  business_owner: {
    label: 'Business Owner',
    icon: Store,
    questions: [
      // Updated: Neutral, responsibility-focused questions instead of platform-centric ones
      { 
        key: 'businessType', 
        label: 'What type of business do you run?', 
        type: 'text',
        placeholder: 'e.g., Consulting, Manufacturing, Services, Retail, Tech startup',
        helpText: 'Describe your business in your own words',
      },
      { 
        key: 'primaryResponsibilities', 
        label: 'What are your main responsibilities?', 
        type: 'textarea',
        placeholder: 'e.g., Strategy, operations, sales, product development, team management...',
        helpText: 'This helps us understand what to prioritize in your plan',
      },
      { 
        key: 'currentFocus', 
        label: 'What is your current focus area?', 
        type: 'text',
        placeholder: 'e.g., Growing revenue, launching a new product, hiring, reducing costs',
      },
    ],
  },
  content_creator: {
    label: 'Content Creator',
    icon: Video,
    questions: [
      { key: 'platform', label: 'Primary Platform', type: 'select', options: ['YouTube', 'TikTok', 'Instagram', 'LinkedIn', 'Multiple'] },
      { key: 'niche', label: 'Content Niche', type: 'select', options: ['Tech', 'Vlog', 'Education', 'Entertainment', 'Business', 'Other'] },
      { key: 'postingFrequency', label: 'Posts per Week', type: 'select', options: ['1-2', '3-4', '5-7', 'Daily'] },
    ],
  },
  executive: {
    label: 'Executive / Leadership',
    icon: Crown,
    questions: [
      { key: 'executiveRole', label: 'Your Role', type: 'text', placeholder: 'e.g., CEO, CTO, VP of Engineering, Director of Operations' },
      { key: 'companySize', label: 'Company Size', type: 'select', options: ['Solo / 1-5', '6-20', '21-50', '51-200', '200+'] },
      { key: 'industry', label: 'Industry', type: 'select', options: ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Manufacturing', 'Services', 'Other'] },
      { key: 'primaryFocus', label: 'Current Primary Focus', type: 'text', placeholder: 'e.g., Growth strategy, team scaling, product launch, market expansion' },
    ],
  },
  other: {
    label: 'Other',
    icon: HelpCircle,
    useOpenInputs: true,
    questions: [
      // For "Other" profession, use open-ended questions
      { 
        key: 'fieldDescription', 
        label: 'Describe your field of work', 
        type: 'textarea',
        placeholder: 'Tell us about your profession, role, or the type of work you do...',
        helpText: 'Be as specific as you like—this helps us understand your context',
      },
      { 
        key: 'mainResponsibilities', 
        label: 'What are your main responsibilities?', 
        type: 'textarea',
        placeholder: 'e.g., Managing projects, client work, research, creative work...',
      },
      { 
        key: 'constraints', 
        label: 'Any constraints we should consider? (Optional)', 
        type: 'textarea',
        placeholder: 'e.g., Limited time, working with a team, budget constraints, learning curve...',
      },
    ],
  },
};

/**
 * Check if a profession should show the planning approach selector
 * (Currently only for "Other" profession)
 */
export function shouldShowPlanningApproachSelector(profession: Profession): boolean {
  return profession === 'other';
}

/**
 * Get filtered questions for a profession based on current answers
 */
export function getFilteredQuestions(
  profession: Profession,
  professionDetails: Record<string, any>
): Question[] {
  const config = professionConfig[profession];
  if (!config) return [];

  return config.questions.filter(q => {
    if (!q.showIf) return true;
    return Object.entries(q.showIf).every(([key, value]) => professionDetails[key] === value);
  });
}

/**
 * Check if all required questions for a profession are answered
 */
export function areRequiredQuestionsAnswered(
  profession: Profession,
  professionDetails: Record<string, any>,
  questionIndex: number,
  questions: Question[]
): boolean {
  const question = questions[questionIndex];
  if (!question) return true;

  // Optional fields (containing "Optional" in label or specific keys)
  if (question.label.includes('Optional') || question.key === 'aiToolsList' || question.key === 'constraints') {
    return true;
  }

  // Boolean questions
  if (question.type === 'boolean') {
    return professionDetails[question.key] !== undefined;
  }

  // Chips with custom input
  if (question.type === 'chips') {
    const predefined = professionDetails[question.key] || [];
    const customRaw = professionDetails[`${question.key}_custom`] || '';
    const customItems = customRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    return predefined.length > 0 || customItems.length > 0;
  }

  // Text/textarea - check if non-empty
  if (question.type === 'text' || question.type === 'textarea') {
    const value = professionDetails[question.key];
    return value && String(value).trim().length > 0;
  }

  // Select
  return !!professionDetails[question.key];
}
