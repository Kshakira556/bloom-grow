import type { Feature, Step } from "@/types/landing";

// Centralized home page content for sections
export const homeContent = {
  features: <Feature[]>[
    {
      title: "Control",
      description: "Know your child's whereabouts and manage with ease.",
    },
    {
      title: "Child-first",
      description: "Ensure your child gets the attention and care they need.",
    },
    {
      title: "Mediation",
      description: "Professional guidance and assistance every step of the way.",
    },
    {
      title: "Milestones",
      description: "Make sure no parent gets left in the dark.",
    },
    {
      title: "Vault",
      description: "Emergency vault with important information at hand.",
    },
    {
      title: "Messaging",
      description: "Moderated messaging with AI safeguards.",
    },
  ],
  steps: <Step[]>[
    {
      number: "01",
      title: "Create Structure",
      description: "Set routines, custody plans, and agreements clearly.",
    },
    {
      number: "02",
      title: "Communicate Calmly",
      description: "Reduce emotional misunderstandings with structured messaging.",
    },
    {
      number: "03",
      title: "Stay Aligned",
      description: "Track milestones and keep everything documented.",
    },
  ],
};
