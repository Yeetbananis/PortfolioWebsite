// app/components/ArticleCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

type ArticleCardProps = {
  title: string;
  description: string;
  image: string;
  link: string;
  category: string;
};

const ArticleCard = ({ title, description, image, link, category }: ArticleCardProps) => {
  return (
    <Link href={link} className="group flex flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
      <div className="relative aspect-video w-full">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-2 text-sm text-primary">{category}</p>
        <h3 className="text-xl font-bold text-text">{title}</h3>
        <p className="mt-2 flex-1 text-text-secondary">{description}</p>
      </div>
    </Link>
  );
};

export default ArticleCard;