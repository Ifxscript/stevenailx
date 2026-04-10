import React from 'react';
import { motion } from 'framer-motion';
import { useLandingPage } from '../context/LandingPageContext';
import './AboutSection.css';

const AboutSection = () => {
  const { about } = useLandingPage();
  
  // Logic to find current day index (Monday = 0, Sunday = 6)
  const currentDayIndex = (new Date().getDay() + 6) % 7;

  return (
    <section className="about-section" id="about">
      <div className="about-container">
        <div className="about-grid">
          
          {/* Left Column: About & Map */}
          <motion.div 
            className="about-content"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="about-heading">{about.heading}</h2>
            <p className="about-text">{about.description}</p>
            
            <div className="about-map-container">
              <img src={about.mapImage} alt="Salon Location Map" className="about-map-image" />
            </div>
            
            <div className="about-address-container">
              <span className="address-text">{about.address}</span>
              <a 
                href={about.directionsUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="get-directions-link"
              >
                Get directions
              </a>
            </div>
          </motion.div>

          {/* Right Column: Opening Times */}
          <motion.div 
            className="opening-times-content"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="opening-heading">{about.openingTitle}</h2>
            <div className="opening-list">
              {about.hours.map((day, index) => {
                const isToday = index === currentDayIndex;
                const isClosed = !day.isOpen;
                
                return (
                  <div 
                    key={day.name} 
                    className={`opening-day-row ${isToday ? 'is-today' : ''} ${isClosed ? 'is-closed' : ''}`}
                  >
                    <div className="day-name-group">
                      <span className={`status-dot ${day.isOpen ? 'open' : 'closed'}`}></span>
                      <span className="day-name">{day.name}</span>
                    </div>
                    <span className="day-hours">
                      {isClosed ? 'Closed' : day.hours}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
