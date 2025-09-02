// app/components/ProjectCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

type ProjectCardProps = {
  title: string;
  description: string;
  image: string;
  link: string;
};

const ProjectCard = ({ title, description, image, link }: ProjectCardProps) => {
  return (
    <Link 
      href={link} 
      // The "group" class on the parent makes the whole card a hover trigger
      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg"
    >
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
      />
      
      {/* This overlay has pointer-events-none so it doesn't block hovering */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* This text container uses "group-hover" to appear when the Link is hovered */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="mt-1 text-lg">{description}</p>
      </div>
    </Link>
  );
};

export default ProjectCard;