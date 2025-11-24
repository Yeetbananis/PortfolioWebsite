// app/articles/[slug]/page.tsx
import { articles } from '@/data/content';
import { generatePageMetadata } from '@/app/lib/metadata';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import path from 'path';
import fs from 'fs/promises';
import AnimatedWords from '@/app/components/AnimatedWords';
import Link from 'next/link';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ImageWithFullscreen from '@/app/components/ImageWithFullscreen';
import PCAMathAnimator from '@/app/components/PCAMathAnimator'; 
import SigmoidVisualizer from '@/app/components/SigmoidVisualizer';
import GradientDescentAnimator from '@/app/components/GradientDescentAnimator';

type PageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return articles.map((article) => ({ slug: article.link.split('/').pop() }));
}

export async function generateMetadata({ params }: PageProps) {
  const article = articles.find((p) => p.link.endsWith(params.slug));
  return generatePageMetadata({ title: article?.title, description: article?.description });
}

export default async function ArticlePage({ params }: PageProps) {
  const currentArticle = articles.find((p) => p.link.endsWith(params.slug));
  if (!currentArticle) notFound();

  const categoryArticles = articles.filter(a => a.category === currentArticle.category);
  const currentIndex = categoryArticles.findIndex(a => a.link === currentArticle.link);
  const nextArticle = categoryArticles[currentIndex + 1];
  const prevArticle = categoryArticles[currentIndex - 1];

  const filePath = path.join(process.cwd(), 'articles', `${params.slug}.mdx`);
  let mdxSource;
  try { mdxSource = await fs.readFile(filePath, 'utf8'); } catch { notFound(); }

 const { content } = await compileMDX({
    source: mdxSource,
    components: {
      ImageWithFullscreen, 
      PCAMathAnimator, 
      SigmoidVisualizer,
      GradientDescentAnimator,
    },
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12 text-center">
        <p className="text-primary">{currentArticle.category}</p>
        <h1 className="text-5xl font-bold"><AnimatedWords text={currentArticle.title} /></h1>
      </div>
      
      <article className="prose prose-invert max-w-none">
        {content}
      </article>

      <hr className="my-12 border-white/10" />

      <div className="flex justify-between">
        {prevArticle ? (
          <Link href={prevArticle.link} className="text-left">
            <p className="text-sm text-text-secondary">Previous in {prevArticle.category}</p>
            <p className="text-lg text-primary hover:underline">{prevArticle.title}</p>
          </Link>
        ) : <div />}
        {nextArticle ? (
          <Link href={nextArticle.link} className="text-right">
            <p className="text-sm text-text-secondary">Next in {nextArticle.category}</p>
            <p className="text-lg text-primary hover:underline">{nextArticle.title}</p>
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}