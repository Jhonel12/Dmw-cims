import React, { useState, useRef, useEffect } from 'react';

interface CalendarProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  value = '',
  onChange,
  placeholder = 'Select date',
  label,
  required = false,
  disabled = false,
  className = '',
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedDate || new Date()
  );
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Sync internal state with external value prop
  useEffect(() => {
    if (value) {
      // Parse date string safely to avoid timezone issues
      const [year, month, day] = value.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date): string => {
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(formatDate(date));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(prev => new Date(year, prev.getMonth(), 1));
    setShowYearSelector(false);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), month, 1));
    setShowMonthSelector(false);
  };

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 50; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years;
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, i - startingDayOfWeek + 1));
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && formatDate(date) < minDate) return true;
    if (maxDate && formatDate(date) > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    // Compare dates by their local date components to avoid timezone issues
    return date.getFullYear() === selectedDate.getFullYear() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getDate() === selectedDate.getDate();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const displayValue = selectedDate ? formatDate(selectedDate) : '';

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      {/* Label */}
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-white/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
          }`}
          disabled={disabled}
        />
        
        {/* Calendar Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg 
            className="w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200/60 z-50 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-blue-200/50 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthSelector(!showMonthSelector);
                    setShowYearSelector(false);
                  }}
                  className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-100/50"
                >
                  {months[currentMonth.getMonth()]}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowYearSelector(!showYearSelector);
                    setShowMonthSelector(false);
                  }}
                  className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-100/50"
                >
                  {currentMonth.getFullYear()}
                </button>
              </div>
              
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-blue-200/50 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Month Selector */}
          {showMonthSelector && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                  <button
                    type="button"
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                      index === currentMonth.getMonth()
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Year Selector */}
          {showYearSelector && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="max-h-48 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2">
                  {getYearRange().map((year) => (
                    <button
                      type="button"
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                        year === currentMonth.getFullYear()
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Body */}
          <div className="p-4">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isSelected = isDateSelected(date);
                const isDisabled = isDateDisabled(date);
                const isTodayDate = isToday(date);

                return (
                  <button
                    type="button"
                    key={index}
                    onClick={() => !isDisabled && handleDateSelect(date)}
                    disabled={isDisabled}
                    className={`
                      h-10 w-10 text-sm rounded-lg transition-all duration-200 flex items-center justify-center
                      ${!isCurrentMonth 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : isTodayDate
                        ? 'bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200'
                        : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setCurrentMonth(today);
                  handleDateSelect(today);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                Today
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;

