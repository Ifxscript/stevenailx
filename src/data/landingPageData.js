import landingImageOne from '../assets/landing.png';
import landingImageTwo from '../assets/landing2.png';
import imgArt from '../assets/05b546f7-da33-42aa-9970-24db3d722a5e.JPG';
import imgGel from '../assets/9795e025-569d-46f9-81f7-e4646112d16e.JPG';
import imgClassic from '../assets/4805424a-ba58-4ab1-9f67-3e603aea138b.JPG';
import mapMockup from '../assets/abuja_map.png';

import logoImg from '../assets/IMG_8009-removebg-preview.png';

const WHATSAPP_NUMBER = '2347034872747';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SteveNailX!%20I%27d%20like%20to%20book%20an%20appointment.`;

export const landingPageData = {
  brand: {
    name: "Steve Nail X",
    logo: "STEVE NAIL X",
    logoImage: logoImg,
    tagline: "Luxury meets artistry.",
    description: "Where luxury meets artistry. We don't just do nails; we curate confidence and celebrate beauty in every meticulous detail.",
    bio: "Steve Nail X is a premier destination for bespoke nail artistry and high-fashion beauty services, dedicated to excellence in every detail."
  },
  socials: [
    { id: 1, label: 'Book on WhatsApp', href: WHATSAPP_LINK, description: 'Direct booking and inquiries' },
    { id: 2, label: 'Follow on Instagram', href: 'https://instagram.com/stevenailx', description: 'Our latest portfolio and nail art' },
    { id: 3, label: 'Follow on TikTok', href: '#', description: 'Process videos and BTS' },
    { id: 4, label: 'Visit Website', href: '/', description: 'Return to our homepage' }
  ],
  hero: {
    rotation: {
      enabled: true,
      intervalMs: 3500,
    },
    slides: [
      {
        id: 'landing-1',
        heading: 'Stressed, blessed & nail obsessed',
        subheading: 'Premium nail artistry crafted to perfection. Your hands, our masterpiece.',
        ctaPrimary: { label: 'Book Appointment', href: WHATSAPP_LINK, external: true },
        ctaSecondary: { label: 'Discover Services', href: '#services', external: false },
        src: landingImageOne,
        alt: 'SteveNailX manicure showcase look one',
      },
      {
        id: 'landing-2',
        heading: 'Elegance at your fingertips',
        subheading: 'From minimalist chic to statement sets, every design is tailored to your vibe.',
        ctaPrimary: { label: 'Book Appointment', href: WHATSAPP_LINK, external: true },
        ctaSecondary: { label: 'View Services', href: '#services', external: false },
        src: landingImageTwo,
        alt: 'SteveNailX manicure showcase look two',
      },
    ],
  },
  services: {
    title: "DISCOVER THE ARTISTRY",
    subtitle: "BEYOND THE NAILS",
    items: [
      { id: 1, title: 'Classic Luxe', description: 'Timeless elegance with meticulous care, shaping, and a flawless polished finish.', image: imgClassic, link: '/services#classic' },
      { id: 2, title: 'Custom Nail Art', description: 'A masterpiece on every finger-completely bespoke designs that reflect your style.', image: imgArt, link: '/services#art' },
      { id: 3, title: 'Elite Gel Series', description: 'Ultimate durability with a high-fashion edge and incredible, long-lasting shine.', image: imgGel, link: '/services#gel' },
    ],
    otherItems: [
      { id: 1, title: 'Wig Installation', description: 'Precision melting and styling for a flawless, natural scalp finish.', image: imgGel, link: '/services#wigs' },
      { id: 2, title: 'Professional Makeup', description: 'Bespoke artistry ranging from editorial glam to signature natural glows.', image: imgGel, link: '/services#makeup' },
      { id: 3, title: 'Deluxe Pedicure', description: 'Renewing sole therapy with meticulous care and a premium polished end.', image: imgGel, link: '/services#pedicure' },
    ]
  },
  gallery: {
    title: "Sneak Peek",
    exploreLabel: "Explore More",
    items: [
      { id: 1, image: imgArt, title: 'Bespoke Art' },
      { id: 2, image: imgClassic, title: 'Classic Luxe' },
      { id: 3, image: imgGel, title: 'Gel Series' },
      { id: 4, image: landingImageOne, title: 'Manicure' },
      { id: 5, image: landingImageTwo, title: 'Styling' },
      { id: 6, image: imgArt, title: 'Minimalist' },
    ]
  },
  team: {
    title: "TEAM",
    members: [
      { id: 1, name: 'Steve Nail', role: 'Lead Artist & Founder', image: null },
    ]
  },
  reviews: {
    title: "REVIEWS",
    seeAllLabel: "See All Reviews",
    items: [
      { id: 1, name: 'Victoria G.', rating: 5, comment: 'An amazing experience. Professionalism and skill from start to finish.', status: 'approved', date: '2024-04-09T18:09:00' },
      { id: 2, name: 'Sonia C.', rating: 5, comment: 'Very good experience. Highly recommended!', status: 'approved', date: '2024-04-07T12:28:00' },
      { id: 3, name: 'Susana M.', rating: 5, comment: 'First time here for color and I will definitely be back.', status: 'approved', date: '2024-03-28T15:55:00' },
      { id: 4, name: 'Marina M.', rating: 5, comment: 'Friendly and personalized treatment. Very pleasant atmosphere.', status: 'approved', date: '2024-03-26T09:20:00' },
      { id: 5, name: 'James R.', rating: 4, comment: 'Excellent service. The studio is clean and the staff is very welcoming.', status: 'approved', date: '2024-03-20T14:30:00' },
      { id: 6, name: 'Elena P.', rating: 5, comment: 'Absolutely love the bespoke nail art! Truly a masterpiece.', status: 'approved', date: '2024-03-15T11:15:00' },
      { id: 7, name: 'Clara S.', rating: 3, comment: 'Decent experience, but the session took longer than expected.', status: 'approved', date: '2024-03-10T11:15:00' },
      { id: 8, name: 'Alice B.', rating: 2, comment: 'Not quite what I was hoping for. The polish chipped within 3 days.', status: 'approved', date: '2024-03-05T14:45:00' },
      { id: 9, name: 'David W.', rating: 5, comment: 'Best manicure I\'ve had in a long time.Precision and skill.', status: 'approved', date: '2024-03-01T10:00:00' },
      { id: 10, name: 'Sophia L.', rating: 4, comment: 'Great color selection and very friendly staff.', status: 'approved', date: '2024-02-25T16:20:00' },
      { id: 11, name: 'Michael T.', rating: 5, comment: 'Fantastic job. Very meticulous and professional.', status: 'approved', date: '2024-02-20T13:10:00' },
      { id: 12, name: 'Emma H.', rating: 5, comment: 'Wonderful atmosphere and talented artists.', status: 'approved', date: '2024-02-15T15:30:00' },
    ]
  },
  about: {
    heading: "About",
    description: "Where luxury meets artistry. We don't just do nails; we curate confidence and celebrate beauty in every meticulous detail.",
    address: "Saham Plaza, behind New Banex, Shop A20 Upstairs, Abuja, Nigeria 900288",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Saham+Plaza+behind+New+Banex+Shop+A20+Upstairs+Abuja",
    mapImage: mapMockup,
    openingTitle: "Opening times",
    hours: [
      { name: "Monday", hours: "Closed", isOpen: false },
      { name: "Tuesday", hours: "9:30 am - 7:00 pm", isOpen: true },
      { name: "Wednesday", hours: "9:30 am - 7:00 pm", isOpen: true },
      { name: "Thursday", hours: "9:30 am - 7:00 pm", isOpen: true },
      { name: "Friday", hours: "9:30 am - 7:00 pm", isOpen: true },
      { name: "Saturday", hours: "10:00 am - 2:00 pm", isOpen: true },
      { name: "Sunday", hours: "Closed", isOpen: false },
    ]
  },
  footer: {
    navColumns: [
      {
        title: "Navigation",
        links: [
          { label: "Home", href: "#home" },
          { label: "Our Story", href: "#about" },
          { label: "Services", href: "#services" },
          { label: "Gallery", href: "/gallery" }
        ]
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy Policy", href: "#" },
          { label: "Terms of service", href: "#" },
          { label: "Terms of use", href: "#" }
        ]
      },
      {
        title: "Contact",
        links: [
          { label: "📍 Saham Plaza, Abuja", isStatic: true },
          { label: "📞 +234 703 487 2747", href: "tel:+2347034872747" },
          { label: "✉️ hello@stevenailx.com", href: "mailto:hello@stevenailx.com" }
        ]
      },
      {
        title: "Socials",
        links: [
          { label: "Instagram", href: "https://instagram.com/stevenailx", hasArrow: true },
          { label: "TikTok", href: "#", hasArrow: true },
          { label: "WhatsApp", href: WHATSAPP_LINK, hasArrow: true }
        ]
      }
    ],
    copyright: "SteveNailX. All Rights Reserved.",
    language: "English"
  }
};
