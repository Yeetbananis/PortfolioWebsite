// app/components/ArticlesPageContent.tsx
'use client'; 

import AnimatedWords from "./AnimatedWords";
import { motion } from "framer-motion";
import { articles } from "@/data/content";
import ArticleCard from "./ArticleCard";

type Article = {
  title: string;
  description: string;
  image: string;
  link: string;
  category: string;
};

const groupArticlesByCategory = (articles: Article[]) => {
  return articles.reduce((acc, article) => {
    const { category } = article;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(article);
    return acc;
  }, {} as Record<string, Article[]>);
};

export default function ArticlesPageContent({ articles }: { articles: Article[] }) {
  const groupedArticles = groupArticlesByCategory(articles);

  return (
    <motion.div
      className="container mx-auto max-w-5xl px-4 py-24"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold md:text-5xl">
          <AnimatedWords text="Articles & Insights" />
        </h1>
        <p className="mt-4 mx-auto max-w-2xl text-lg text-text-secondary">
          <AnimatedWords 
            text="A collection of my thoughts and deep dives into quantitative finance, trading concepts, and much more."
            delay={0.1}
          />
        </p>
      </section>

      <div className="space-y-16">
        {Object.entries(groupedArticles).map(([category, articlesInCategory]) => (
          <section key={category}>
            <h2 className="mb-8 text-2xl font-bold text-text">{category}</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articlesInCategory.map(article => (
                <ArticleCard key={article.title} {...article} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </motion.div>
  );
}