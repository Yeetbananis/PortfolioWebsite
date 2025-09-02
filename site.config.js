// site.config.js

const siteConfig = {
  // Website Identity
  title: "Tim Generalov",
  author: "Tim Generalov",
  email: "timofeygen@gmail.com",

  // Social Media Links - UPDATE THESE
  socials: {
    github: "https://github.com/Yeetbananis",
    linkedin: "https://www.linkedin.com/in/tim-generalov/",
  },

  // Site Theme (Monaco)
  theme: {
    primary: '#0070f3',     // Vibrant Blue Accent
    background: '#111111',  // Dark Charcoal
    text: '#f8f8f8',        // Off-White
    textSecondary: '#a1a1aa' // Muted Gray for subtitles
  },

 // Navigation Links
  navLinks: [
    { title: 'Projects', path: '/' },
    { title: 'About', path: '/about' },
    { title: 'Articles', path: '/articles' }, // Add this new line
  ],
};

export default siteConfig;