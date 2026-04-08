import landingImageOne from '../assets/landing.png';
import landingImageTwo from '../assets/landing2.png';

const WHATSAPP_NUMBER = '2347034872747';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SteveNailX!%20I%27d%20like%20to%20book%20an%20appointment.`;

export const heroContent = {
  rotation: {
    enabled: true,
    intervalMs: 3500,
  },
  slides: [
    {
      id: 'landing-1',
      heading: 'Stressed, blessed & nail obsessed',
      subheading: 'Premium nail artistry crafted to perfection. Your hands, our masterpiece.',
      ctaPrimary: {
        label: 'Book Appointment',
        href: WHATSAPP_LINK,
        external: true,
      },
      ctaSecondary: {
        label: 'Discover Services',
        href: '#services',
        external: false,
      },
      src: landingImageOne,
      alt: 'SteveNailX manicure showcase look one',
    },
    {
      id: 'landing-2',
      heading: 'Elegance at your fingertips',
      subheading: 'From minimalist chic to statement sets, every design is tailored to your vibe.',
      ctaPrimary: {
        label: 'Book Appointment',
        href: WHATSAPP_LINK,
        external: true,
      },
      ctaSecondary: {
        label: 'View Services',
        href: '#services',
        external: false,
      },
      src: landingImageTwo,
      alt: 'SteveNailX manicure showcase look two',
    },
  ],
};
