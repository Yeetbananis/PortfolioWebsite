// app/projects/[slug]/page.tsx
import { projects } from '@/data/content';
import { generatePageMetadata } from '@/app/lib/metadata';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { compileMDX } from 'next-mdx-remote/rsc';
import path from 'path';
import fs from 'fs/promises';
import AnimatedWords from '@/app/components/AnimatedWords';
import AnimatedBlock from '@/app/components/AnimatedBlock';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ImageWithFullscreen from '@/app/components/ImageWithFullscreen';
import SmoothVideo from '@/app/components/SmoothVideo'; 
import GradientDescentAnimator from '@/app/components/GradientDescentAnimator';
import SigmoidVisualizer from '@/app/components/SigmoidVisualizer';
import GradientLandscape from '@/app/components/GradientLandscape';
import FinBERTViz from '@/app/components/FinBERTViz';

type PageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.link.split('/').pop(),
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const project = projects.find((p) => p.link.endsWith(params.slug));
  if (!project) {
    return generatePageMetadata({ title: 'Project Not Found' });
  }
  return generatePageMetadata({
    title: project.title,
    description: project.description,
  });
}

export default async function ProjectPage({ params }: PageProps) {
  const project = projects.find((p) => p.link.endsWith(params.slug));
  if (!project) notFound();

  const filePath = path.join(process.cwd(), 'projects', `${params.slug}.mdx`);
  let mdxSource;
  try {
    mdxSource = await fs.readFile(filePath, 'utf8');
  } catch {
    notFound();
  }

  const { content } = await compileMDX({
    source: mdxSource,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
    // We will add custom components here in a future step
    components: {
      ImageWithFullscreen, // This makes the component available in your MDX files
      SmoothVideo,
      GradientDescentAnimator,
      SigmoidVisualizer,
      GradientLandscape,
      FinBERTViz,
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold">
          <AnimatedWords text={project.title} />
        </h1>
        <p className="mt-2 text-xl text-text-secondary">
          <AnimatedWords text={project.description} delay={0.1} />
        </p>
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