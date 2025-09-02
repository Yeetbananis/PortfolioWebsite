// app/projects/[slug]/page.tsx
import { projects } from '@/data/content';
import { generatePageMetadata } from '@/app/lib/metadata'; // Import helper
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { compileMDX } from 'next-mdx-remote/rsc';
import path from 'path';
import fs from 'fs/promises';
import AnimatedWords from '@/app/components/AnimatedWords';
import AnimatedBlock from '@/app/components/AnimatedBlock';

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.link.split('/').pop(),
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const project = projects.find((p) => p.link.endsWith(params.slug));
  if (!project) {
    return generatePageMetadata({ title: 'Project Not Found' });
  }
  return generatePageMetadata({
    title: project.title,
    description: project.description,
  });
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = projects.find((p) => p.link.endsWith(params.slug));
  if (!project) notFound();

  // This is the logic that was missing from the previous snippet
  const filePath = path.join(process.cwd(), 'projects', `${params.slug}.mdx`);
  let mdxSource;
  try {
    mdxSource = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    notFound();
  }

  const { content } = await compileMDX({
    source: mdxSource,
    options: { parseFrontmatter: false },
  });
  // End of missing logic

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12 text-center">
        <AnimatedWords
          el="h1"
          className="text-5xl font-bold"
          text={project.title}
        />
        <AnimatedWords
          el="p"
          className="mt-2 text-xl text-text-secondary"
          text={project.description}
          delay={0.1}
        />
      </div>
      
      <AnimatedBlock delay={0.2}>
        <div className="relative mb-12 aspect-video w-full overflow-hidden rounded-lg shadow-lg">
          <Image src={project.image} alt={project.title} fill className="object-cover" />
        </div>
      </AnimatedBlock>

      <AnimatedBlock delay={0.3}>
        <article className="prose prose-invert max-w-none">
          {content}
        </article>
      </AnimatedBlock>
    </div>
  );
}