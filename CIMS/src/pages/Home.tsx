import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import bgImage from "../assets/dmw2.jpg";
import logo from "../assets/dmwlogo2.svg";
import smallLogo from "../assets/registration.png";
import { SurveyModal } from "./modals/surveyModal";
import { ToastContainer, useToast } from "../toaster/customtoast";
import AddClientModal from "../modals/addClientModal";

// ✅ Default export Home
export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyClientType, setSurveyClientType] = useState<"walk-in" | "online">("walk-in");
  
  // Toast functionality
  const { toasts, success, removeToast } = useToast();

  const handleSurveyClick = (clientType: "walk-in" | "online") => {
    setSurveyClientType(clientType);
    setIsSurveyModalOpen(true);
  };

  const handleFormSuccess = () => {
    success({
      title: "Registration Successful!",
      message: "Your client information has been submitted successfully.",
      duration: 5000
    });
  };

  const handleSurveySuccess = (controlNo?: string) => {
    success({
      title: "Survey Submitted Successfully!",
      message: controlNo 
        ? `Thank you for your valuable feedback. Your response has been recorded with control number: ${controlNo}`
        : "Thank you for your valuable feedback. Your response has been recorded.",
      duration: 5000
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img src={bgImage} alt="bg" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/35"></div>
      </div>

      <Header />

      {/* Add some top padding so content sits below header - responsive padding */}
      <main className="flex-1 relative z-10 container mx-auto px-3 sm:px-4 md:px-6 pt-32 sm:pt-36 md:pt-40 lg:pt-44 pb-16 sm:pb-20 md:pb-24">
        {/* Grid: center content spans 2 columns on large screens, right column is 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
          {/* ---------- CENTER SURVEY CARD (spans 2 cols on large) ---------- */}
          <div className="lg:col-span-2 flex justify-center">
            <div
              className="relative w-full max-w-xl rounded-lg md:rounded-xl bg-white/85 backdrop-blur-sm shadow-2xl p-3 sm:p-4 md:p-6 text-center"
            >
              {/* circular logo overlapping top - responsive sizing */}
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-white rounded-full p-1 shadow">
                  <img
                    src={logo}
                    alt="dmw"
                    className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain"
                  />
                </div>
              </div>

              {/* spacer for the overlapping logo */}
              <div className="pt-7 sm:pt-8 md:pt-10">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-2 sm:mb-2.5 md:mb-3 px-2">
                  DMW Client Satisfaction Survey
                </h2>

                <div className="mt-3 sm:mt-4 md:mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                  <button 
                    onClick={() => handleSurveyClick("walk-in")}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-lg shadow hover:bg-blue-600 transition w-full sm:w-36 max-w-xs"
                  >
                    Walk-in Client
                  </button>
                  <button 
                    onClick={() => handleSurveyClick("online")}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-lg shadow hover:bg-blue-600 transition w-full sm:w-36 max-w-xs"
                  >
                    Online Client
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- RIGHT-SIDE CARDS ---------- */}
          <aside className="lg:col-span-1 w-full">
            <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-2.5 justify-items-stretch content-stretch">
              {/* Citizen's Charter */}
              <a
                href="/files/Citizens-Charter.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="bg-white rounded-md sm:rounded-lg shadow p-2 sm:p-3 flex flex-col justify-between h-full min-h-[100px] sm:min-h-[110px] transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                  <img src={logo} alt="logo" className="w-10 h-8 sm:w-11 sm:h-9 md:w-12 md:h-10 mx-auto" />
                  <span className="font-bold text-xs sm:text-sm md:text-base text-blue-900 text-center mt-1.5">
                    DMW RO-X <br /> Citizen's Charter
                  </span>
                </div>
              </a>

              {/* Official Facebook */}
              <a
                href="https://www.facebook.com/DWMROX"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <div className="bg-blue-500 rounded-md sm:rounded-lg shadow p-2 sm:p-3 flex justify-between items-center gap-1.5 sm:gap-2 md:gap-3 h-full min-h-[100px] sm:min-h-[110px] transform transition duration-300 hover:scale-105 hover:shadow-xl hover:bg-sky-600">
                  <div className="flex flex-col text-white">
                    <span className="font-bold text-sm sm:text-base md:text-lg leading-tight">
                      OFFICIAL
                    </span>
                    <span className="font-bold text-sm sm:text-base md:text-lg leading-tight">
                      FACEBOOK
                    </span>
                    <span className="font-bold text-sm sm:text-base md:text-lg leading-tight">
                      PAGE
                    </span>
                  </div>
                  <img
                    src="/facebook-like.svg"
                    alt="Facebook"
                    className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0"
                  />
                </div>
              </a>

              {/* Email */}
              <div className="bg-blue-700 text-white rounded-md sm:rounded-lg shadow p-2 sm:p-3 flex items-start gap-1.5 sm:gap-2 md:gap-3 w-full h-full min-h-[100px] sm:min-h-[110px] transform transition duration-300 hover:scale-105 hover:shadow-xl">
                <div className="bg-white/20 rounded p-1 sm:p-1.5 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M3 8l7.5 5L18 8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex flex-col justify-start min-w-0">
                  <p className="font-bold text-sm sm:text-base md:text-lg">Email us</p>
                  <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 md:mt-4 break-all">cdo@dmw.gov.ph</p>
                </div>
              </div>

              {/* ✅ Register Here with Modal Trigger */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white rounded-md sm:rounded-lg shadow p-2 sm:p-3 flex items-start gap-1.5 sm:gap-2 md:gap-3 w-full h-full min-h-[100px] sm:min-h-[110px] transform transition duration-300 hover:scale-105 hover:shadow-xl text-left"
              >
                <div className="flex items-center justify-center flex-shrink-0">
                  <img src={smallLogo} alt="logo" className="h-6 sm:h-7 md:h-8 mt-0.5" />
                </div>
                <div className="flex flex-col justify-start">
                  <p className="font-bold text-sm sm:text-base">Register Here</p>
                </div>
              </button>

              {/* For more info */}
              <a
                href="https://dmw.gov.ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <div className="bg-white rounded-md sm:rounded-lg shadow p-2 sm:p-3 flex items-start gap-1.5 sm:gap-2 md:gap-3 h-full min-h-[100px] sm:min-h-[110px] transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                  <div className="bg-blue-100 rounded p-1 sm:p-1.5 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-start min-w-0">
                    <p className="text-blue-700 font-bold text-sm sm:text-base md:text-lg">
                      For more Info
                    </p>
                    <p className="text-[10px] sm:text-xs mt-0.5 italic text-sky-500 break-words">
                      Visit our Site <br /> dmw.gov.ph
                    </p>
                  </div>
                </div>
              </a>

              {/* Hotlines */}
              <div className="bg-white rounded-md sm:rounded-lg shadow p-2 sm:p-3 w-full h-full min-h-[100px] sm:min-h-[110px] transform transition duration-300 hover:scale-105 hover:shadow-xl border-2 border-orange-500">
                <p className="text-orange-600 font-bold text-xs sm:text-sm mb-1.5 underline decoration-orange-600 decoration-2">
                  DMW HOTLINES
                </p>
                <ul className="text-[10px] sm:text-xs space-y-0.5">
                  <li className="break-all">📞 (088)880 6414</li>
                  <li className="break-all">📞 09569418162 - MWPD</li>
                  <li className="break-all">📞 09171928836 - MWPTD</li>
                  <li className="break-all">📞 09171354195 - WRSD</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      {/* ✅ Mount Modals */}
      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleFormSuccess}
      />
      <SurveyModal
        isModalOpen={isSurveyModalOpen}
        setIsModalOpen={setIsSurveyModalOpen}
        clientType={surveyClientType}
        onSuccess={handleSurveySuccess}
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
