import React from 'react';
import type { SurveyResponse } from '../tables/surveyresponseTable';

interface ViewSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyResponse: SurveyResponse | null;
}

const ViewSurveyModal: React.FC<ViewSurveyModalProps> = ({ 
  isOpen, 
  onClose, 
  surveyResponse 
}) => {
  if (!isOpen || !surveyResponse) return null;

  // Helper function to get satisfaction text
  const getSatisfactionText = (value: string | undefined): string => {
    if (!value) return 'Not answered';
    const num = parseInt(value);
    switch (num) {
      case 1: return 'Very Dissatisfied';
      case 2: return 'Dissatisfied';
      case 3: return 'Neutral';
      case 4: return 'Satisfied';
      case 5: return 'Very Satisfied';
      default: return 'Not answered';
    }
  };

  // Helper function to get CC1 answer text
  const getCC1Text = (value: string | undefined): string => {
    if (!value) return 'Not answered';
    const num = parseInt(value);
    switch (num) {
      case 1: return 'I know what a CC is and I saw this office\'s CC.';
      case 2: return 'I know what a CC is but I did NOT see this office\'s CC.';
      case 3: return 'I learned of the CC only when I saw this office\'s CC.';
      case 4: return 'I do not know what a CC is and I did not see one in this office.';
      default: return 'Not answered';
    }
  };

  // Helper function to get CC2 answer text
  const getCC2Text = (value: string | undefined): string => {
    if (!value) return 'Not answered';
    const num = parseInt(value);
    switch (num) {
      case 1: return 'Easy to see';
      case 2: return 'Somewhat easy to see';
      case 3: return 'Difficult to see';
      case 4: return 'Not visible at all';
      case 5: return 'N/A';
      default: return 'Not answered';
    }
  };

  // Helper function to get CC3 answer text
  const getCC3Text = (value: string | undefined): string => {
    if (!value) return 'Not answered';
    const num = parseInt(value);
    switch (num) {
      case 1: return 'Helped very much';
      case 2: return 'Somewhat helped';
      case 3: return 'Did not help';
      case 4: return 'N/A';
      default: return 'Not answered';
    }
  };

  // Helper function to get satisfaction color
  const getSatisfactionColor = (value: string | undefined): string => {
    if (!value) return 'text-gray-500';
    const num = parseInt(value);
    switch (num) {
      case 1: return 'text-red-600';
      case 2: return 'text-orange-600';
      case 3: return 'text-yellow-600';
      case 4: return 'text-green-600';
      case 5: return 'text-green-700';
      default: return 'text-gray-500';
    }
  };

  // Helper function to get channel icon
  const getChannelIcon = (channel: string | undefined) => {
    if (channel === 'walk-in') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    } else if (channel === 'online') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    return null;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold">Survey Response Details</h2>
                  <p className="text-xs text-blue-100">
                    Control No: <span className="bg-yellow-200 text-gray-900 px-2 py-1 rounded font-mono font-bold">{surveyResponse.control_no || 'N/A'}</span> • 
                    Submitted: {formatDate(surveyResponse.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Client Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-blue-900">Client Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">Client Type</label>
                    <p className="text-xs text-gray-800 font-medium">{surveyResponse.client_type || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">Channel</label>
                    <div className="flex items-center space-x-2">
                      <div className="text-blue-600">
                        {getChannelIcon(surveyResponse.client_channel)}
                      </div>
                      <span className="text-xs text-gray-800 font-medium capitalize">
                        {surveyResponse.client_channel || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">Sex</label>
                    <p className="text-xs text-gray-800 font-medium">{surveyResponse.sex || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">Age</label>
                    <p className="text-xs text-gray-800 font-medium">{surveyResponse.age || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-3 border border-blue-200/50">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">Region</label>
                    <p className="text-xs text-gray-800 font-medium">{surveyResponse.region || 'N/A'}</p>
                  </div>
                  
                  <div className="md:col-span-2 lg:col-span-3 bg-white/70 rounded-lg p-3 border border-blue-200/50">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">Service Availed</label>
                    <p className="text-xs text-gray-800 font-medium">{surveyResponse.service_availed || 'N/A'}</p>
                  </div>
                  
                  <div className="md:col-span-2 lg:col-span-3 bg-white/70 rounded-lg p-3 border border-blue-200/50">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">Email</label>
                    <p className="text-xs text-gray-800 font-medium">{surveyResponse.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Customer Care Assessment */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-green-900">Customer Care Assessment</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/70 rounded-lg p-4 border border-green-200/50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-green-700">CC1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800 mb-2">
                          Which of the following best describes your awareness of a CC?
                        </p>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200/50">
                          <p className="text-xs font-semibold text-green-800">
                            {getCC1Text(surveyResponse.cc1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-4 border border-green-200/50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-green-700">CC2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800 mb-2">
                          If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was ...?
                        </p>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200/50">
                          <p className="text-xs font-semibold text-green-800">
                            {getCC2Text(surveyResponse.cc2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-4 border border-green-200/50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-green-700">CC3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800 mb-2">
                          If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?
                        </p>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200/50">
                          <p className="text-xs font-semibold text-green-800">
                            {getCC3Text(surveyResponse.cc3)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Quality Dimensions */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                  Service Quality Dimensions (SQD)
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <span className="font-semibold">SQD0:</span> I am satisfied with the service that I availed.*
                    </p>
                    <p className={`text-xs font-medium ${getSatisfactionColor(surveyResponse.sqd0)}`}>
                      <span className="font-medium">Answer:</span> {getSatisfactionText(surveyResponse.sqd0)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <span className="font-semibold">SQD1:</span> I spent a reasonable amount of time for my transaction.*
                    </p>
                    <p className={`text-xs font-medium ${getSatisfactionColor(surveyResponse.sqd1)}`}>
                      <span className="font-medium">Answer:</span> {getSatisfactionText(surveyResponse.sqd1)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <span className="font-semibold">SQD2:</span> The office followed the transaction's requirements and steps based on the information provided.*
                    </p>
                    <p className={`text-xs font-medium ${getSatisfactionColor(surveyResponse.sqd2)}`}>
                      <span className="font-medium">Answer:</span> {getSatisfactionText(surveyResponse.sqd2)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <span className="font-semibold">SQD3:</span> The steps (including payment) I needed to do for my transaction were easy and simple.
                    </p>
                    <p className={`text-xs font-medium ${getSatisfactionColor(surveyResponse.sqd3)}`}>
                      <span className="font-medium">Answer:</span> {getSatisfactionText(surveyResponse.sqd3)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <span className="font-semibold">SQD4:</span> I easily found information about my transaction from the office or its website.
                    </p>
                    <p className={`text-xs font-medium ${getSatisfactionColor(surveyResponse.sqd4)}`}>
                      <span className="font-medium">Answer:</span> {getSatisfactionText(surveyResponse.sqd4)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <span className="font-semibold">SQD5:</span> I paid a reasonable amount of fees for my transaction.
                    </p>
                    <p className={`text-xs font-medium ${getSatisfactionColor(surveyResponse.sqd5)}`}>
                      <span className="font-medium">Answer:</span> {getSatisfactionText(surveyResponse.sqd5)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <span className="font-semibold">SQD6:</span> I feel the office was fair to everyone, or "walang palakasan", during my transaction.*
                    </p>
                    <p className={`text-xs font-medium ${getSatisfactionColor(surveyResponse.sqd6)}`}>
                      <span className="font-medium">Answer:</span> {getSatisfactionText(surveyResponse.sqd6)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <span className="font-semibold">SQD7:</span> I was treated courteously by the staff, and (if asked for help) the staff was helpful.*
                    </p>
                    <p className={`text-xs font-medium ${getSatisfactionColor(surveyResponse.sqd7)}`}>
                      <span className="font-medium">Answer:</span> {getSatisfactionText(surveyResponse.sqd7)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <span className="font-semibold">SQD8:</span> I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.*
                    </p>
                    <p className={`text-xs font-medium ${getSatisfactionColor(surveyResponse.sqd8)}`}>
                      <span className="font-medium">Answer:</span> {getSatisfactionText(surveyResponse.sqd8)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {surveyResponse.suggestions && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                    Suggestions
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">
                      {surveyResponse.suggestions}
                    </p>
                  </div>
                </div>
              )}

              {/* Submission Details */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                  Submission Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Submitted Date</label>
                    <p className="text-xs text-gray-900">{formatDate(surveyResponse.created_at)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Last Updated</label>
                    <p className="text-xs text-gray-900">{formatDate(surveyResponse.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSurveyModal;
