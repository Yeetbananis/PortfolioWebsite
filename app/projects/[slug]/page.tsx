// app/projects/[slug]/page.tsx
import { projects } from '@/data/projects';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { compileMDX } from 'next-mdx-remote/rsc';
import path from 'path';
import fs from 'fs/promises';

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.link.split('/').pop(),
  }));
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  // --- START DEBUG LOGS ---
  console.log('--- DEBUG INFO ---');
  console.log('Received params object:', params);
  console.log('Extracted slug:', params.slug);
  // --- END DEBUG LOGS ---

  const project = projects.find((p) => p.link.endsWith(params.slug));

  if (!project) {
    console.log('Project not found in data file! Triggering 404.');
    notFound();
  }

  const filePath = path.join(process.cwd(), 'projects', `${params.slug}.mdx`);
  console.log('Attempting to read file from path:', filePath);

  let mdxSource;
  try {
    mdxSource = await fs.readFile(filePath, 'utf8');
    console.log('Successfully read MDX file.');
  } catch (error) {
    console.error('Error reading file:', error);
    console.log('MDX file not found on disk! Triggering 404.');
    notFound();
  }

  const { content } = await compileMDX({
    source: mdxSource,
    options: { parseFrontmatter: false },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold">{project.title}</h1>
        <p className="mt-2 text-xl text-text-secondary">{project.description}</p>
      </div>
      <div className="relative mb-12 h-96 w-full overflow-hidden rounded-lg shadow-lg">
        <Image src={project.image} alt={project.title} fill className="object-cover" />
      </div>
      <article className="prose prose-invert max-w-none">
        {content}
      </article>
    </div>
  );
}