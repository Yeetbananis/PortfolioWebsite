// app/components/ProjectCard.tsx
'use client'; 

import { motion } from 'framer-motion';
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
    <Link href={link} className="group relative block h-64 w-full overflow-hidden rounded-lg shadow-lg">
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <motion.div
        className="absolute inset-0 flex flex-col justify-end p-6 text-white"
        initial={{ y: 20, opacity: 0 }}
        whileHover={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="mt-1 text-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {description}
        </p>
      </motion.div>
    </Link>
  );
};

export default ProjectCard;