// app/components/Footer.tsx
import Link from 'next/link';
import siteConfig from '@/site.config.js';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 py-8">
      <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between px-4 md:flex-row">
        <p className="text-sm text-text-secondary">
          &copy; {currentYear} {siteConfig.author}
        </p>
        <div className="mt-4 flex space-x-6 md:mt-0">
          <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer" className="text-text-secondary transition-colors hover:text-primary">
            <FaGithub size={24} />
          </a>
          <a href={siteConfig.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-text-secondary transition-colors hover:text-primary">
            <FaLinkedin size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;