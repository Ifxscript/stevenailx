import React from 'react';

/**
 * AdminSectionDescription
 * 
 * A reusable description component for mobile admin drawer sections.
 * Renders a styled paragraph below the drawer header to provide
 * contextual information about the active section.
 * 
 * @param {string} text - The description text to display.
 */
const AdminSectionDescription = ({ text }) => {
  if (!text) return null;

  return (
    <p style={{
      fontSize: '0.88rem',
      color: '#8E8484',
      fontWeight: 500,
      lineHeight: 1.5,
      margin: '0 0 20px 0',
      padding: 0,
    }}>
      {text}
    </p>
  );
};

export default AdminSectionDescription;
