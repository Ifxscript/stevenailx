import { AnimatePresence, motion } from 'framer-motion';
import { useBooking } from '../../context/BookingContext';
import { X, ChevronLeft } from 'lucide-react';
import ServiceSelector from './ServiceSelector';
import DateTimePicker from './DateTimePicker';
import BookingAuth from './BookingAuth';
import BookingReview from './BookingReview';
import BookingConfirmation from './BookingConfirmation';
import './BookingDrawer.css';

const STEPS = ['Services', 'Date & Time', 'Account', 'Review'];

function BookingDrawer() {
  const { isDrawerOpen, closeBookingDrawer, currentStep, prevStep } = useBooking();

  if (!isDrawerOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <ServiceSelector />;
      case 1: return <DateTimePicker />;
      case 2: return <BookingAuth />;
      case 3: return <BookingReview />;
      case 4: return <BookingConfirmation />;
      default: return <ServiceSelector />;
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            className="booking-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBookingDrawer}
          />
          <motion.div
            className="booking-drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="booking-header">
              <div className="booking-header-left">
                {currentStep > 0 && currentStep < 4 && (
                  <button className="booking-back-btn" onClick={prevStep}>
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h2 className="booking-title">
                  {currentStep < 4 ? 'Book Appointment' : 'Confirmed!'}
                </h2>
              </div>
              <button className="booking-close-btn" onClick={closeBookingDrawer}>
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            {currentStep < 4 && (
              <div className="booking-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
                <div className="progress-steps">
                  {STEPS.map((label, i) => (
                    <span 
                      key={label} 
                      className={`progress-step ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="booking-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BookingDrawer;
