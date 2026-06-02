export interface StackItem {
  name: string;
  /** astro-icon name, e.g. "simple-icons:typescript" or "lucide:server" */
  icon: string;
}

export interface StackCategory {
  category: string;
  items: StackItem[];
}

export const stack: StackCategory[] = [
  {
    category: "Languages",
    items: [
      { name: "TypeScript", icon: "simple-icons:typescript" },
      { name: "JavaScript", icon: "simple-icons:javascript" },
    ],
  },
  {
    category: "Frontend",
    items: [
      { name: "React", icon: "simple-icons:react" },
      { name: "Next.js", icon: "simple-icons:nextdotjs" },
      { name: "Astro", icon: "simple-icons:astro" },
      { name: "Tailwind CSS", icon: "simple-icons:tailwindcss" },
      { name: "Shadcn UI", icon: "simple-icons:shadcnui" },
    ],
  },
  {
    category: "Backend",
    items: [
      { name: "Bun", icon: "simple-icons:bun" },
      { name: "Hono", icon: "simple-icons:hono" },
      { name: "Node.js", icon: "simple-icons:nodedotjs" },
    ],
  },
  {
    category: "Database & ORM",
    items: [
      { name: "PostgreSQL", icon: "simple-icons:postgresql" },
      { name: "Redis", icon: "simple-icons:redis" },
      { name: "Prisma", icon: "simple-icons:prisma" },
    ],
  },
  {
    category: "Cloud & Tools",
    items: [
      { name: "Docker", icon: "simple-icons:docker" },
      { name: "GitHub Actions", icon: "simple-icons:githubactions" },
      { name: "Vercel", icon: "simple-icons:vercel" },
    ],
  },
];
