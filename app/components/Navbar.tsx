// app/components/Navbar.tsx
import Link from 'next/link';
import siteConfig from '@/site.config.js';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-text">
        {/* Left side: Site Title */}
        <Link href="/" className="text-xl font-bold transition-colors hover:text-primary">
          {siteConfig.title}
        </Link>

        {/* Right side: Navigation Links */}
        <div className="flex items-center space-x-6">
          {siteConfig.navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className="text-text-secondary transition-colors hover:text-primary"
            >
              {link.title}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;