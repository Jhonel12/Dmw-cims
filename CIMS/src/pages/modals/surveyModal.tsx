import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import Lottie from "lottie-react";
import logo from "../../assets/dmwlogo2.svg";
import clientFeedbackService, { type FeedbackSubmissionResponse } from '../../services/clientFeedbackService';
type SurveyModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  clientType: "walk-in" | "online";
  onSuccess: (controlNo?: string) => void;
};

interface CustomerFeedbackData {
  control_no: string;
  client_type?: string;
  client_channel?: 'walk-in' | 'online';
  date: string;
  sex?: 'Male' | 'Female';
  age?: number;
  region?: string;
  service_availed?: string;
  cc1?: string;
  cc2?: string;
  cc3?: string;
  sqd0?: string;
  sqd1?: string;
  sqd2?: string;
  sqd3?: string;
  sqd4?: string;
  sqd5?: string;
  sqd6?: string;
  sqd7?: string;
  sqd8?: string;
  suggestions?: string;
  email?: string;
}

// Lottie animation URLs for different emojis
const emojiAnimations = {
  sad: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/lottie.json", // 😭
  disappointed: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f641/lottie.json", // 🙁
  neutral: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f610/lottie.json", // 😐
  happy: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f642/lottie.json", // 🙂
  excited: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f603/lottie.json", // 😀
};

// Animated Lottie emoji component
const AnimatedEmoji = React.memo(({ type, size = 20 }: { type: keyof typeof emojiAnimations; size?: number }) => {
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    setError(false);
    
    fetch(emojiAnimations[type])
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setAnimationData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(`Lottie fetch failed for ${type}, using static emoji:`, err);
        setError(true);
        setLoading(false);
      });
  }, [type]);

  // Fallback static emojis
  const staticEmojis = {
    sad: "😢",
    disappointed: "🙁", 
    neutral: "😐",
    happy: "🙂",
    excited: "😀"
  };

  if (loading) {
    return <span style={{ fontSize: `${size}px` }}>⏳</span>;
  }

  if (error || !animationData) {
    return <span style={{ fontSize: `${size}px` }}>{staticEmojis[type]}</span>;
  }

  return (
    <div style={{ 
      width: `${size}px`, 
      height: `${size}px`,
      display: 'inline-block',
      overflow: 'hidden'
    }}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ 
          width: size, 
          height: size,
          transform: 'none',
          animation: 'none'
        }}
      />
    </div>
  );
});

export function SurveyModal({
  isModalOpen,
  setIsModalOpen,
  clientType,
  onSuccess,
}: SurveyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add custom CSS to prevent checkbox animations and emoji bouncing
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .no-animation-checkbox {
        animation: none !important;
        transition: none !important;
        transform: none !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 0 !important;
        animation-play-state: paused !important;
        animation-fill-mode: none !important;
        animation-timing-function: none !important;
      }
      .no-animation-checkbox:active {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
      .no-animation-checkbox:focus {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
      .emoji-container {
        contain: layout style paint;
        will-change: auto;
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
      .emoji-container * {
        pointer-events: none !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  interface SurveyData {
    // Client Information
    clientType: string;
    date: string;
    sex: string;
    age: string;
    region: string;
    serviceAvailed: string;
    
    // Citizens Charter
    cc1: string; // Awareness of CC
    cc2: string; // Visibility of CC
    cc3: string; // Helpfulness of CC
    
    // Service Quality Dimensions
    sqd0: string; // Overall satisfaction
    sqd1: string; // Reasonable time
    sqd2: string; // Followed requirements
    sqd3: string; // Easy steps
    sqd4: string; // Easy to find info
    sqd5: string; // Reasonable fees
    sqd6: string; // Fair treatment
    sqd7: string; // Courteous staff
    sqd8: string; // Got what needed
    
    // Optional
    suggestions: string;
    email: string;
  }

  // Get current Philippine date in word format
  const getPhilippineDate = () => {
    const now = new Date();
    const philippineTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    return philippineTime.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate control number format: MMDDYY{PRIMARY_KEY}
  // Note: The primary key will be added by the backend after insertion
  const generateControlNumberBase = () => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${month}${day}${year}`;
  };

  const getInitialFormData = (): SurveyData => ({
    // Client Information
    clientType: clientType === "walk-in" ? "Citizen" : "Citizen",
    date: getPhilippineDate(),
    sex: "",
    age: "",
    region: "",
    serviceAvailed: "",
    
    // Citizens Charter
    cc1: "",
    cc2: "",
    cc3: "",
    
    // Service Quality Dimensions
    sqd0: "",
    sqd1: "",
    sqd2: "",
    sqd3: "",
    sqd4: "",
    sqd5: "",
    sqd6: "",
    sqd7: "",
    sqd8: "",
    
    // Optional
    suggestions: "",
    email: "",
  });

  const [formData, setFormData] = useState<SurveyData>(getInitialFormData());

  const [touched, setTouched] = useState<Record<string, boolean>>({});



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.sex) errors.sex = "Sex is required";
    if (!formData.age || parseInt(formData.age) < 1) errors.age = "Valid age is required";
    if (!formData.region.trim()) errors.region = "Region is required";
    if (!formData.serviceAvailed.trim()) errors.serviceAvailed = "Service availed is required";
    
    // Service Quality Dimensions validation (required fields marked with *)
    if (!formData.sqd0) errors.sqd0 = "Overall satisfaction is required";
    if (!formData.sqd1) errors.sqd1 = "Response to reasonable time is required";
    if (!formData.sqd2) errors.sqd2 = "Response to requirements followed is required";
    if (!formData.sqd6) errors.sqd6 = "Response to fair treatment is required";
    if (!formData.sqd7) errors.sqd7 = "Response to courteous staff is required";
    if (!formData.sqd8) errors.sqd8 = "Response to getting what you needed is required";
    
    return errors;
  };

  // Utility functions for validation styling
  const getInputClass = (field: string) => {
    if (!touched[field]) return "border-gray-300";
    const value = formData[field as keyof SurveyData];
    const hasError = validateForm()[field];
    return hasError
      ? "border-red-500 focus:ring-red-500"
      : value
      ? "border-green-500 focus:ring-green-500"
      : "border-gray-300";
  };

  const getErrorMessage = (field: string) => {
    if (!touched[field]) return null;
    return validateForm()[field] || null;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      // Mark all fields as touched to show validation errors
      const touchedFields: Record<string, boolean> = {};
      Object.keys(errors).forEach(field => {
        touchedFields[field] = true;
      });
      setTouched(touchedFields);
      return;
    }
    
    setIsSubmitting(true);
  
    try {
      // Convert date to MySQL format (YYYY-MM-DD)
      const convertDateToMySQLFormat = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Gets YYYY-MM-DD format
      };

      // Transform form data to match API format
      const feedbackData: CustomerFeedbackData = {
        control_no: generateControlNumberBase(), // Base format, backend will append primary key
        client_type: formData.clientType,
        client_channel: clientType, // Include the client channel (walk-in or online)
        date: convertDateToMySQLFormat(formData.date),
        sex: formData.sex as 'Male' | 'Female',
        age: formData.age ? parseInt(formData.age) : undefined,
        region: formData.region,
        service_availed: formData.serviceAvailed,
        cc1: formData.cc1,
        cc2: formData.cc2,
        cc3: formData.cc3,
        sqd0: formData.sqd0,
        sqd1: formData.sqd1,
        sqd2: formData.sqd2,
        sqd3: formData.sqd3,
        sqd4: formData.sqd4,
        sqd5: formData.sqd5,
        sqd6: formData.sqd6,
        sqd7: formData.sqd7,
        sqd8: formData.sqd8,
        suggestions: formData.suggestions,
        email: formData.email,
      };
  
      const response = await clientFeedbackService.submitFeedback(feedbackData) as FeedbackSubmissionResponse;
  
      if (response.success) {
        // Clear form data
        setFormData(getInitialFormData());
        setTouched({});
        
        // Close modal and trigger success toast with control number
        setIsModalOpen(false);
        onSuccess(response.data.control_no);
      }
    } catch (error) {
      console.error('Survey submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white w-full max-w-4xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white p-3 sm:p-4 md:p-5 border-b-2 border-gray-300 z-10">
              {/* Control Number and ARTA Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-2 sm:mb-3">
                <div className="text-xs sm:text-sm w-full sm:w-auto">
                  <span className="font-semibold">Control No: </span>
                  <span className="font-mono text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">
                    {generateControlNumberBase()}***
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 ml-1 sm:ml-2 block sm:inline mt-1 sm:mt-0">(ID will be assigned after submission)</span>
                </div>
                <div className="text-left border border-gray-400 p-2 sm:p-3 w-full sm:w-auto">
                  <div className="font-bold text-[9px] sm:text-[10px] leading-tight mb-0.5 sm:mb-1">ANTI-RED TAPE AUTHORITY</div>
                  <div className="font-bold text-[9px] sm:text-[10px] leading-tight mb-0.5 sm:mb-1">CLIENT SATISFACTION MEASUREMENT FORM</div>
                  <div className="text-[10px] sm:text-xs leading-tight">PSA Approval No.: ARTA-2242-3</div>
                </div>
              </div>

              {/* DMW Logo and Title */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                <img
                  src={logo}
                  alt="DMW Logo"
                  className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain"
                />
                <div className="text-center">
                  <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-black mb-1">DEPARTMENT OF MIGRANT WORKERS</h1>
                  <h2 className="text-xs sm:text-sm md:text-base font-bold text-black">HELP US SERVE YOU BETTER!</h2>
                  {/* Client Type Indicator */}
                  <div className="mt-1 sm:mt-2">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      clientType === "walk-in" 
                        ? "bg-blue-100 text-blue-800 border border-blue-300" 
                        : "bg-green-100 text-green-800 border border-green-300"
                    }`}>
                      {clientType === "walk-in" ? "🏢 Walk-in Client Survey" : "💻 Online Client Survey"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[10px] sm:text-xs text-gray-700 mb-2 leading-relaxed">
                This Client Satisfaction Measurement (CSM) tracks the customer experience of government offices. 
                Your feedback on your recently concluded transaction will help this office provide a better service. 
                Personal information shared will be kept confidential and you always have the option to not answer this form.
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto flex-1 flex flex-col"
            >
              <div className="px-3 sm:px-4 md:px-6 lg:px-8 pt-2 pb-4 sm:pb-6 md:pb-8 space-y-4 sm:space-y-6 md:space-y-8">

              {/* Client Information Section */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4 md:mb-6">Client Information</h3>
                
                {/* Client Type */}
                <div className="mb-6">
                  <span className="text-sm font-semibold">Client type: </span>
                  <div className="flex flex-wrap gap-4 ml-4 mt-2">
                    {["Citizen", "Business", "Government (Employee or another agency)"].map((type) => (
                      <label key={type} className="flex items-center space-x-1 text-sm">
                        <input
                          type="checkbox"
                          name="clientType"
                          value={type}
                          checked={formData.clientType === type}
                          onChange={handleChange}
                          className="w-4 h-4"
                        />
                        <span className="whitespace-nowrap">{type}</span>
                      </label>
                    ))}
                  </div>
                  {/* Client Channel Indicator */}
                  <div className="mt-2 ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      clientType === "walk-in" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {clientType === "walk-in" ? "🏢 Physical Office Visit" : "💻 Online Transaction"}
                    </span>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold mr-2 whitespace-nowrap">Date: <span className="text-red-500">*</span></span>
                    <span className="text-sm text-gray-700 border-b border-gray-400 pb-1 flex-1">
                      {formData.date}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm font-semibold mr-2 whitespace-nowrap">Sex: <span className="text-red-500">*</span></span>
                    <div className="flex gap-4">
                      {["Male", "Female"].map((sex) => (
                        <label key={sex} className="flex items-center space-x-1 text-sm">
                          <input
                            type="checkbox"
                            name="sex"
                            value={sex}
                            checked={formData.sex === sex}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="w-4 h-4"
                          />
                          <span>{sex}</span>
                        </label>
                      ))}
                    </div>
                    {getErrorMessage("sex") && (
                      <span className="text-red-500 text-xs ml-2">{getErrorMessage("sex")}</span>
                    )}
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm font-semibold mr-2 whitespace-nowrap">Age: <span className="text-red-500">*</span></span>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`border-b focus:outline-none text-sm w-20 ${getInputClass("age")}`}
                      min="1"
                      max="120"
                    />
                    {getErrorMessage("age") && (
                      <span className="text-red-500 text-xs ml-2">{getErrorMessage("age")}</span>
                    )}
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm font-semibold mr-2 whitespace-nowrap">Region: <span className="text-red-500">*</span></span>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`border-b focus:outline-none text-sm flex-1 ${getInputClass("region")}`}
                    />
                    {getErrorMessage("region") && (
                      <span className="text-red-500 text-xs ml-2">{getErrorMessage("region")}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="text-sm font-semibold mr-2">Service Availed: <span className="text-red-500">*</span></span>
                  <input
                    type="text"
                    name="serviceAvailed"
                    value={formData.serviceAvailed}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`border-b focus:outline-none text-sm flex-1 ${getInputClass("serviceAvailed")}`}
                  />
                  {getErrorMessage("serviceAvailed") && (
                    <span className="text-red-500 text-xs ml-2">{getErrorMessage("serviceAvailed")}</span>
                  )}
                </div>
              </div>

              {/* Citizens Charter Section */}
              <div className="border-t-2 border-gray-300 pt-6">
                <div className="mb-6">
                  <p className="text-sm font-bold">
                    <strong>INSTRUCTIONS:</strong> Check mark (✔) your answer to the Citizen's Charter (CC) questions. 
                    The Citizen's Charter is an official document that reflects the services of a government agency/office 
                    including its requirements, fees, and processing times among others.
                  </p>
                </div>

                {/* CC1 */}
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-3">CC1: Which of the following best describes your awareness of a CC?</p>
                  <div className="space-y-2">
                    {[
                      "I know what a CC is and I saw this office's CC.",
                      "I know what a CC is but I did NOT see this office's CC.",
                      "I learned of the CC only when I saw this office's CC.",
                      "I do not know what a CC is and I did not see one in this office. (Answer 'N/A' on CC2 and CC3)"
                    ].map((option, index) => (
                      <label key={index} className="flex items-start space-x-2 text-sm">
                        <input
                          type="checkbox"
                          name="cc1"
                          value={String(index + 1)}
                          checked={formData.cc1 === String(index + 1)}
                          onChange={handleChange}
                          className="w-4 h-4 mt-0.5"
                        />
                        <span>{index + 1}. {option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* CC2 */}
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-3">CC2: If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was ...?</p>
                  <div className="space-y-2">
                    {[
                      "Easy to see",
                      "Somewhat easy to see", 
                      "Difficult to see",
                      "Not visible at all",
                      "N/A"
                    ].map((option, index) => (
                      <label key={index} className="flex items-start space-x-2 text-sm">
                        <input
                          type="checkbox"
                          name="cc2"
                          value={String(index + 1)}
                          checked={formData.cc2 === String(index + 1)}
                          onChange={handleChange}
                          className="w-4 h-4 mt-0.5"
                        />
                        <span>{index + 1}. {option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* CC3 */}
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-3">CC3: If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?</p>
                  <div className="space-y-2">
                    {[
                      "Helped very much",
                      "Somewhat helped",
                      "Did not help",
                      "N/A"
                    ].map((option, index) => (
                      <label key={index} className="flex items-start space-x-2 text-sm">
                        <input
                          type="checkbox"
                          name="cc3"
                          value={String(index + 1)}
                          checked={formData.cc3 === String(index + 1)}
                          onChange={handleChange}
                          className="w-4 h-4 mt-0.5"
                        />
                        <span>{index + 1}. {option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Quality Dimensions Section */}
              <div className="border-t-2 border-gray-300 pt-6">
                <div className="mb-6">
                  <p className="text-sm font-bold">
                    <strong>INSTRUCTIONS:</strong> For SQD 0-8, please put a check mark (✔) on the column that best corresponds to your answer.
                  </p>
                </div>

                {/* SQD Questions Table */}
                <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8">
                  <table className="w-full text-[10px] sm:text-xs border border-gray-400 min-w-[640px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-0.5 sm:p-1 text-left font-semibold w-1/2">Questions</th>
                        <th className="border border-gray-400 p-0.5 sm:p-1 text-center w-1/12 text-[9px] sm:text-xs">
                          <div className="flex justify-center">
                            <AnimatedEmoji type="sad" size={16} />
                          </div>
                          <div className="hidden sm:block">Strongly Disagree</div>
                          <div className="sm:hidden">Str. Disagree</div>
                        </th>
                        <th className="border border-gray-400 p-0.5 sm:p-1 text-center w-1/12 text-[9px] sm:text-xs">
                          <div className="flex justify-center">
                            <AnimatedEmoji type="disappointed" size={16} />
                          </div>
                          <div>Disagree</div>
                        </th>
                        <th className="border border-gray-400 p-0.5 sm:p-1 text-center w-1/12 text-[9px] sm:text-xs">
                          <div className="flex justify-center">
                            <AnimatedEmoji type="neutral" size={16} />
                          </div>
                          <div>Neither</div>
                        </th>
                        <th className="border border-gray-400 p-0.5 sm:p-1 text-center w-1/12 text-[9px] sm:text-xs">
                          <div className="flex justify-center">
                            <AnimatedEmoji type="happy" size={16} />
                          </div>
                          <div>Agree</div>
                        </th>
                        <th className="border border-gray-400 p-0.5 sm:p-1 text-center w-1/12 text-[9px] sm:text-xs">
                          <div className="flex justify-center">
                            <AnimatedEmoji type="excited" size={16} />
                          </div>
                          <div className="hidden sm:block">Strongly Agree</div>
                          <div className="sm:hidden">Str. Agree</div>
                        </th>
                        <th className="border border-gray-400 p-0.5 sm:p-1 text-center w-1/12 text-[9px] sm:text-xs">
                          <div>N/A</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: "sqd0", question: "I am satisfied with the service that I availed.", required: true },
                        { key: "sqd1", question: "I spent a reasonable amount of time for my transaction.", required: true },
                        { key: "sqd2", question: "The office followed the transaction's requirements and steps based on the information provided.", required: true },
                        { key: "sqd3", question: "The steps (including payment) I needed to do for my transaction were easy and simple.", required: false },
                        { key: "sqd4", question: "I easily found information about my transaction from the office or its website.", required: false },
                        { key: "sqd5", question: "I paid a reasonable amount of fees for my transaction.", required: false },
                        { key: "sqd6", question: "I feel the office was fair to everyone, or \"walang palakasan\", during my transaction.", required: true },
                        { key: "sqd7", question: "I was treated courteously by the staff, and (if asked for help) the staff was helpful.", required: true },
                        { key: "sqd8", question: "I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.", required: true }
                      ].map(({ key, question, required }) => (
                        <tr key={key} className={getErrorMessage(key) ? "bg-red-50" : ""}>
                          <td className="border border-gray-400 p-0.5 sm:p-1 font-medium text-[10px] sm:text-xs leading-tight">
                            {question}
                            {required && <span className="text-red-500 ml-1">*</span>}
                            {getErrorMessage(key) && (
                              <div className="text-red-500 text-[9px] sm:text-xs mt-1">{getErrorMessage(key)}</div>
                            )}
                          </td>
                          {["1", "2", "3", "4", "5", "6"].map((value) => (
                            <td key={value} className="border border-gray-400 p-0.5 sm:p-1 text-center">
                              <label className="block">
                                <input
                                  type="checkbox"
                                  name={key}
                                  value={value}
                                  checked={formData[key as keyof SurveyData] === value}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 focus:outline-none focus:ring-0 no-animation-checkbox"
                                />
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Suggestions and Email */}
              <div className="border-t-2 border-gray-300 pt-6">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Suggestions on how we can further improve our services (optional):
                    </p>
                    <textarea
                      name="suggestions"
                      value={formData.suggestions}
                      onChange={handleChange}
                      placeholder="Enter your suggestions here..."
                      className="w-full border-0 border-b-2 border-gray-400 focus:outline-none text-sm bg-transparent"
                      rows={3}
                      style={{ paddingBottom: '4px' }}

                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Email address (optional):
                    </p>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address..."
                      className="w-full border-0 border-b-2 border-gray-400 focus:outline-none text-sm bg-transparent"
                      style={{ paddingBottom: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Thank You Message */}
              <div className="text-center py-6">
                <h3 className="text-2xl font-bold text-black">THANK YOU!</h3>
              </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white p-3 sm:p-4 md:p-6 border-t-2 border-gray-300 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-4 z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-400 text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors duration-200 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
  type="submit"
  disabled={isSubmitting}
  className="px-4 sm:px-6 py-2 bg-blue-600 text-sm sm:text-base text-white hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed order-1 sm:order-2"
>
  {isSubmitting ? 'Submitting...' : 'Submit Survey'}
</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
