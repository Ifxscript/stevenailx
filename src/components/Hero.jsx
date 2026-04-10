import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLandingPage } from '../context/LandingPageContext';

const TEXT_LIMITS = {
  desktop: {
    heading: { maxLines: 3, maxCharsPerLine: 24, totalChars: 72 },
    subheading: { maxLines: 3, maxCharsPerLine: 44, totalChars: 132 },
  },
  mobile: {
    heading: { maxLines: 4, maxCharsPerLine: 22, totalChars: 88 },
    subheading: { maxLines: 4, maxCharsPerLine: 36, totalChars: 144 },
  },
};

function truncateWithLineControl(text, limits) {
  if (!text) return '';

  const cleanedText = text.replace(/\s+/g, ' ').trim();
  const hardTrimmed =
    cleanedText.length > limits.totalChars
      ? `${cleanedText.slice(0, limits.totalChars - 1).trimEnd()}...`
      : cleanedText;

  const words = hardTrimmed.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= limits.maxCharsPerLine) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;

    if (lines.length >= limits.maxLines) break;
  }

  if (currentLine && lines.length < limits.maxLines) lines.push(currentLine);

  if (lines.length > limits.maxLines) lines.length = limits.maxLines;
  if (lines.length === limits.maxLines && hardTrimmed.length < cleanedText.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\.*$/, '')}...`;
  }

  return lines.join('\n');
}

// Animation variants for the cinematic reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.4
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: [0.215, 0.61, 0.355, 1]
    }
  }
};

const imageVariants = {
  hidden: { opacity: 0, scale: 1.05, x: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 2.2,
      ease: [0.215, 0.61, 0.355, 1]
    }
  }
};

function Hero() {
  const { hero } = useLandingPage();
  const slides = useMemo(() => hero.slides || [], [hero.slides]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );

  useEffect(() => {
    if (!hero.rotation?.enabled || slides.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % slides.length);
    }, hero.rotation.intervalMs || 3500);

    return () => window.clearInterval(intervalId);
  }, [slides, hero.rotation]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  const activeSlide = slides[activeImageIndex] || null;
  const ctaPrimary = activeSlide?.ctaPrimary;
  const ctaSecondary = activeSlide?.ctaSecondary;
  const limits = isMobile ? TEXT_LIMITS.mobile : TEXT_LIMITS.desktop;
  const safeHeading = truncateWithLineControl(activeSlide?.heading, limits.heading);
  const safeSubheading = truncateWithLineControl(activeSlide?.subheading, limits.subheading);

  return (
    <section className="hero" id="home">
      <div className="hero-circle"></div>
      <motion.div 
        className="hero-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        <div className="hero-text">
          <AnimatePresence mode="wait">
            {activeSlide && (
              <motion.div
                className="hero-copy-block"
                key={`hero-copy-${activeSlide.id}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <motion.h1 variants={itemVariants}>{safeHeading}</motion.h1>
                <motion.p variants={itemVariants}>{safeSubheading}</motion.p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {activeSlide && (
            <motion.div 
              className="hero-buttons" 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              {ctaPrimary && (
                <a
                  href={ctaPrimary.href}
                  target={ctaPrimary.external ? '_blank' : undefined}
                  rel={ctaPrimary.external ? 'noopener noreferrer' : undefined}
                  className="btn-primary"
                >
                  {ctaPrimary.label}
                </a>
              )}
              {ctaSecondary && (
                <a
                  href={ctaSecondary.href}
                  target={ctaSecondary.external ? '_blank' : undefined}
                  rel={ctaSecondary.external ? 'noopener noreferrer' : undefined}
                  className="btn-secondary"
                >
                  {ctaSecondary.label}
                </a>
              )}
            </motion.div>
          )}
        </div>

        <div className="hero-image-wrapper">
          <AnimatePresence mode="popLayout">
            {activeSlide && (
              <motion.img
                key={activeSlide.id}
                src={activeSlide.src}
                alt={activeSlide.alt}
                className="hero-image"
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4 } }}
              />
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </section>
  );
}

export default Hero;
