// data/projects.ts

export const projects = [
  {
    title: "Quant Analysis Platform",
    description: "A full-featured desktop workstation for equity and derivatives trading and risk modeling.",
    image: "/images/OptionsApp1.png",
    link: "/projects/quant-analysis-platform",
    tags: ["Python", "Pandas", "Monte Carlo", "Gemini API", "Matplotlib"],
  },
  {
    title: "Dual-AI Forex Trading Assistant",
    description: "An LSTM Scout and RL Manager trade GBP/JPY autonomously via the OANDA API.",
    image: "/images/GJTest.png", // This is the correct web path
    link: "/projects/dual-ai-forex-assistant",
    tags: ["Python", "PyTorch", "OANDA API", "Scikit-Learn", "NumPy"],
  },
];

export const courses = [
  {
    title: "Financial Markets",
    issuer: "Yale University (via Coursera)",
  },
  {
    title: "Machine Learning for Trading",
    issuer: "Google Cloud & New York Institute of Finance (via Coursera)",
  },
];

// Add this new array for your articles
export const articles = [
  // Article Series: A Trader's Guide to Financial Derivatives
  {
    title: "The Basics: From Handshakes to a Global Marketplace",
    description: "An introduction to the fundamental concepts of forward and futures contracts.",
    image: "/images/CrossedFinger.png",
    link: "/articles/1-futures-basics",
    category: "A Trader's Guide to Financial Derivatives",
  },
  {
    title: "The Power of Choice: An Introduction to Options",
    description: "Explaining the core value of options: the right, not the obligation, and the two basic types.",
    image: "/images/ChoiceOptions.png",
    link: "/articles/2-options-intro",
    category: "A Trader's Guide to Financial Derivatives",
  },
  {
    title: "Understanding Your Option's Position (OTM, ATM, ITM)",
    description: "A clear guide to an option's state and the two halves of its price: intrinsic and extrinsic value.",
    image: "/images/OptionMoneyness.png",
    link: "/articles/3-option-positioning",
    category: "A Trader's Guide to Financial Derivatives",
  },
  {
    title: "The Price Is Right: Inside the Black-Scholes Model",
    description: "A demystification of the famous formula for pricing an option's premium.",
    image: "/images/sdx.png",
    link: "/articles/4-black-scholes-model",
    category: "A Trader's Guide to Financial Derivatives",
  },
  {
    title: "Your Risk Dashboard: An Introduction to the Greeks",
    description: "Introducing Delta, Vega, Theta, and Gamma as essential tools for managing risk.",
    image: "/images/GreeksImage.png",
    link: "/articles/5-intro-to-the-greeks",
    category: "A Trader's Guide to Financial Derivatives",
  },
  {
    title: "Advanced Risk Management: Higher-Order Greeks",
    description: "A mathematical and intuitive look at second and third-order Greeks and the concept of delta and gamma hedging.",
    image: "/images/Advanced.png",
    link: "/articles/6-advanced-risk-management",
    category: "A Trader's Guide to Financial Derivatives",
  },
];
