import { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { getAvailability, getAvailableSlots, isWorkingDay, isDateBlocked, formatDisplayTime } from '../../lib/bookingUtils';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';

function DateTimePicker() {
  const { bookingData, updateBooking, nextStep, getTotalDuration } = useBooking();
  const [availability, setAvailability] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(bookingData.date || null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(bookingData.timeSlot || null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    getAvailability().then(setAvailability);
  }, []);

  useEffect(() => {
    if (selectedDate && availability?.workingHours) {
      setLoadingSlots(true);
      setSelectedTime(null);
      getAvailableSlots(selectedDate, availability.workingHours)
        .then(slots => {
          // Filter out slots that don't have enough time for the total duration
          const totalDur = getTotalDuration();
          const filtered = slots.filter((slot, idx) => {
            // Check that consecutive slots exist
            const needed = Math.ceil(totalDur / 30);
            for (let i = 0; i < needed; i++) {
              if (!slots[idx + i]) return false;
            }
            return true;
          });
          setAvailableSlots(filtered);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDate, availability]);

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    updateBooking({ date: dateStr, timeSlot: null });
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    updateBooking({ timeSlot: time });
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) nextStep();
  };

  // Calendar rendering
  const renderCalendar = () => {
    if (!availability) return <div className="step-loading"><Loader2 className="animate-spin" size={20} /> Loading...</div>;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="cal-day empty" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = date < today;
      const isTooFar = date > new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const isBlocked = isDateBlocked(dateStr, availability.blockedDates || []);
      const isWorking = isWorkingDay(date, availability.workingHours || {});
      const isDisabled = isPast || isTooFar || isBlocked || !isWorking;
      const isSelected = dateStr === selectedDate;

      days.push(
        <button
          key={d}
          className={`cal-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
          disabled={isDisabled}
          onClick={() => handleDateSelect(dateStr)}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="calendar">
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={() => setCurrentMonth(new Date(year, month - 1))}>
            <ChevronLeft size={18} />
          </button>
          <span className="cal-month">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button className="cal-nav-btn" onClick={() => setCurrentMonth(new Date(year, month + 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="cal-weekdays">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <span key={d} className="cal-weekday">{d}</span>
          ))}
        </div>
        <div className="cal-grid">{days}</div>
      </div>
    );
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h3>Pick a date & time</h3>
        <p className="duration-info">
          <Clock size={14} /> Total duration: ~{getTotalDuration()} min
        </p>
      </div>

      {renderCalendar()}

      {/* Time Slots */}
      {selectedDate && (
        <div className="time-slots-section">
          <h4 className="slots-title">Available times</h4>
          {loadingSlots ? (
            <div className="step-loading"><Loader2 className="animate-spin" size={18} /> Checking availability...</div>
          ) : availableSlots.length === 0 ? (
            <p className="no-slots">No available slots for this date. Try another day.</p>
          ) : (
            <div className="time-slots-grid">
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                  onClick={() => handleTimeSelect(slot)}
                >
                  {formatDisplayTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="step-footer">
        <div className="step-footer-info">
          {selectedDate && selectedTime && (
            <span className="selected-datetime">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {formatDisplayTime(selectedTime)}
            </span>
          )}
        </div>
        <button className="step-continue-btn" disabled={!selectedDate || !selectedTime} onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default DateTimePicker;
