import { aboutData } from '../data/about';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './SocialsPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

function SocialsPage() {
  return (
    <div className="socials-page">
      <BackButton />
      
      <main className="socials-container">
        
        {/* Profile Card */}
        <motion.section 
          className="profile-section"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div className="profile-image">
            <img src={aboutData.profileImage} alt={aboutData.name} />
          </div>
          <h1>{aboutData.name}</h1>
          <p className="tagline">{aboutData.tagline}</p>
          <div className="bio-container">
            <p className="bio">{aboutData.bio}</p>
          </div>
        </motion.section>

        {/* Editorial Link List */}
        <motion.section 
          className="editorial-links"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {aboutData.socials.map((social) => (
            <motion.a 
              key={social.id}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-link-item"
              variants={fadeUp}
            >
              <div className="link-text-block">
                <span className="link-label">{social.label}</span>
                <span className="link-description">{social.description}</span>
              </div>
              <div className="link-arrow">
                <ArrowRight size={28} strokeWidth={1} />
              </div>
            </motion.a>
          ))}
        </motion.section>

      </main>

      <Footer />
    </div>
  );
}

export default SocialsPage;
