// app/components/ProjectCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

type ProjectCardProps = {
  title: string;
  description: string;
  image: string;
  link: string;
  tags?: string[]; // 1. Add 'tags' to the props, making it an optional array of strings
};

const ProjectCard = ({ title, description, image, link, tags }: ProjectCardProps) => {
  return (
    <Link 
      href={link} 
      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg"
    >
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
      />
      
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* This text container uses "group-hover" to appear when the Link is hovered */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div>
          <h3 className="text-2xl font-bold">{title}</h3>
          <p className="mt-1 text-lg">{description}</p>
        </div>

        {/* 2. Add a new container for the tags. It appears with the rest of the text. */}
        {/* We check if 'tags' exists and has items before rendering the container */}
        {tags && tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="rounded-full bg-sky-500/30 px-3 py-1 text-xs font-medium text-sky-200 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProjectCard;

