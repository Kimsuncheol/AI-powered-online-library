import Dashboard from './components/Dashboard';
import { HeroSectionProps } from './components/HeroSection';
import { BookSummary, FeaturedBooksSectionProps } from './components/FeaturedBooksSection';
import { Recommendation, RecommendationCarouselProps } from './components/RecommendationCarousel';
import { QuickAction, QuickAccessPanelsProps } from './components/QuickAccessPanels';
import { AIChatWidgetProps } from './components/AIChatWidget';
import { SiteFooterLink, SiteFooterProps } from './components/SiteFooter';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import NoteAltRoundedIcon from '@mui/icons-material/NoteAltRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';

const featuredBooks: BookSummary[] = [
  {
    id: 'quantum-edges',
    title: 'Quantum Edges',
    author: 'Riya Thakur',
    coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
    aiSummary:
      'A deep dive into quantum computing breakthroughs with practical explanations and industry case studies.',
  },
  {
    id: 'storytelling-data',
    title: 'Storytelling with Data',
    author: 'Cole Nussbaumer Knaflic',
    coverImage: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80',
    aiSummary: 'AI highlights the key frameworks to craft persuasive data stories across teams.',
  },
  {
    id: 'future-of-learning',
    title: 'The Future of Learning',
    author: 'Gabriel Meyer',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80',
    aiSummary: 'An exploration of AI-driven classroom experiences and adaptive learning ecosystems.',
  },
  {
    id: 'ethical-ai',
    title: 'Ethical AI in Practice',
    author: 'Marina Ortega',
    coverImage: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
    aiSummary: 'Summaries focus on real-world governance patterns and responsible deployment models.',
  },
  {
    id: 'designing-integrations',
    title: 'Designing Integrations',
    author: 'Everett Lin',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80',
    aiSummary: 'AI notes outline integration archetypes and architecture diagrams for modern platforms.',
  },
  {
    id: 'calm-productivity',
    title: 'Calm Productivity',
    author: 'Anika Sethi',
    coverImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    aiSummary: 'Discover neuroscience-backed practices to sustain focus without burnout with AI-backed routines.',
  },
];

const recommendations: Recommendation[] = [
  {
    id: 'deep-learning-habits',
    title: 'Deep Learning Habits',
    author: 'Maxine Lo',
    coverImage: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=600&q=80',
    matchScore: 0.92,
    reason: 'Because you enjoyed “Storytelling with Data” and follow the Data Science Essentials collection.',
  },
  {
    id: 'synthetic-realities',
    title: 'Synthetic Realities',
    author: 'Dr. Ahmed Farouk',
    coverImage: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=600&q=80',
    matchScore: 0.88,
    reason: 'Matches your interest in ethical AI and includes interactive policy scenarios.',
  },
  {
    id: 'designing-for-agents',
    title: 'Designing for AI Agents',
    author: 'Jules Novak',
    coverImage: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80',
    matchScore: 0.86,
    reason: 'Recommended based on your collaborative workspace setup and product design tags.',
  },
  {
    id: 'knowledge-loops',
    title: 'Knowledge Loops',
    author: 'Dr. Hannah Park',
    coverImage: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=600&q=80',
    matchScore: 0.83,
    reason: 'You bookmarked similar topics on continuous learning systems.',
  },
];

const quickActions: QuickAction[] = [
  {
    id: 'library',
    label: 'My Library',
    icon: <LibraryBooksRoundedIcon />,
    description: 'Keep track of personalized collections, saved shelves, and bundles.',
  },
  {
    id: 'borrowed',
    label: 'Borrowed Books',
    icon: <AutoAwesomeRoundedIcon />,
    description: 'Due date reminders and extension requests in one place.',
  },
  {
    id: 'notes',
    label: 'Reading Notes',
    icon: <NoteAltRoundedIcon />,
    description: 'Capture highlights synced across every format and device.',
  },
  {
    id: 'summaries',
    label: 'AI Summaries',
    icon: <ChatBubbleRoundedIcon />,
    description: 'Regenerate executive briefings and chapter-level insights instantly.',
  },
];

const footerLinks: SiteFooterLink[] = [
  { id: 'about', label: 'About', href: '#' },
  { id: 'contact', label: 'Contact', href: '#' },
  { id: 'terms', label: 'Terms', href: '#' },
  { id: 'privacy', label: 'Privacy', href: '#' },
  { id: 'github', label: 'GitHub', href: '#' },
];

const heroSection: HeroSectionProps = {
  headline: 'Discover Books Smarter with AI.',
  description:
    'Aurora Library helps you explore, borrow, and collaborate on digital books with conversations, summaries, and recommendations powered by AI.',
  featuredInsights: ['Conversational search', 'AI summaries', 'Personalized shelves'],
};

const featuredBooksSection: FeaturedBooksSectionProps = {
  title: 'Featured collections',
  description: 'Trending titles the community is enjoying right now. Curated by AI summaries and your reading history.',
  items: featuredBooks,
};

const recommendationsSection: RecommendationCarouselProps = {
  title: 'Recommended for you',
  subtitle: 'Powered by AI to match your reading journey, skill goals, and recent searches.',
  items: recommendations,
};

const quickAccessPanels: QuickAccessPanelsProps = {
  title: 'Quick access',
  actions: quickActions,
};

const chatWidget: AIChatWidgetProps = {
  messages: [
    { from: 'assistant', text: 'Hi! I can surface summaries, similar authors, and audio versions for you.' },
    { from: 'assistant', text: 'Try: “What should I read after Ethical AI in Practice?”' },
  ],
};

const footerSection: SiteFooterProps = {
  links: footerLinks,
};

export default function DashboardPage() {
  return (
    <Dashboard
      hero={heroSection}
      featuredBooks={featuredBooksSection}
      recommendations={recommendationsSection}
      quickActions={quickAccessPanels}
      chatWidget={chatWidget}
      footer={footerSection}
    />
  );
}
