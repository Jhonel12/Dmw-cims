import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import bgImage from "../assets/dmw2.jpg";
import logo from "../assets/dmwlogo2.svg";
import smallLogo from "../assets/registration.png";
import bagongLogo from "../assets/bagong.png";

type ClientInfoModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function ClientInfoModal({
  isModalOpen,
  setIsModalOpen,
}: ClientInfoModalProps) {
  // ✅ Typed Form Data
  interface FormData {
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    dob: string;
    age: string;
    civil: string;
    sex: string;
    tel: string;
    email: string;
    houseNo: string;
    street: string;
    barangay: string;
    city: string;
    province: string;
    region: string;
    zip: string;
    emergencyName: string;
    emergencyTel: string;
    emergencyRelation: string;
    social: string[];
    socialOther: string;
    hasNationalId: string;
    nationalIdNo: string;
  }

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    dob: "",
    age: "",
    civil: "",
    sex: "",
    tel: "",
    email: "",
    houseNo: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    region: "",
    zip: "",
    emergencyName: "",
    emergencyTel: "",
    emergencyRelation: "",
    social: [],
    socialOther: "",
    hasNationalId: "",
    nationalIdNo: "",
  });

  // ✅ Track touched fields (for validation)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ✅ Utility: Input validation class
  const getInputClass = (field: string) => {
    if (!touched[field]) return "border-gray-300";
    return formData[field as keyof FormData]
      ? "border-green-500 focus:ring-green-500"
      : "border-red-500 focus:ring-red-500";
  };

  // ✅ Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => {
        if (name === "socialOther") {
          return { ...prev, socialOther: value };
        }
        const social = prev.social.includes(value)
          ? prev.social.filter((s) => s !== value)
          : [...prev.social, value];
        return { ...prev, social };
      });
    } else {
      setFormData({ ...formData, [name]: value });

      // ✅ Auto-calc age from DOB
      if (name === "dob") {
        const birthDate = new Date(value);
        if (!isNaN(birthDate.getTime())) {
          const age = new Date().getFullYear() - birthDate.getFullYear();
          setFormData((prev) => ({ ...prev, age: String(age) }));
        }
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white w-11/12 md:w-4/5 lg:w-3/4 rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between rounded-t-2xl z-10 relative">
              {/* Left Logo */}
              <img
                src={logo}
                alt="Left Logo"
                className="h-14 w-auto object-contain"
              />

              {/* Title (centered) */}
              <h2 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-blue-900">
                Client Information Form
              </h2>

              <div className="flex items-center gap-2">
                {/* Right Logo */}
                <img
                  src={bagongLogo}
                  alt="Right Logo"
                  className="h-14 w-auto object-contain"
                />

                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-600 hover:text-black text-2xl"
                >
                  ✖
                </button>
              </div>
            </div>
            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-6 space-y-6 flex-1 flex flex-col"
            >
              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {["firstName", "middleName", "lastName", "suffix"].map(
                  (field, i) => (
                    <div key={field} className="relative">
                      <input
                        type="text"
                        name={field}
                        value={formData[field as keyof FormData]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`peer w-full border rounded-lg px-3 pt-5 pb-2 focus:outline-none focus:ring-2 ${getInputClass(
                          field as keyof FormData
                        )}`}
                        placeholder=" "
                      />
                      <label
                        className="absolute left-3 top-2 text-gray-500 text-sm transition-all
                           peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                           peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600"
                      >
                        {
                          ["First Name", "Middle Name", "Last Name", "Suffix"][
                            i
                          ]
                        }
                      </label>
                    </div>
                  )
                )}
              </div>

              {/* DOB + Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`peer w-full border rounded-lg px-3 pt-5 pb-2 ${getInputClass(
                      "dob"
                    )}`}
                    placeholder=" "
                  />
                  <label className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600">
                    Date of Birth
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    readOnly
                    className={`peer w-full border rounded-lg px-3 pt-5 pb-2 ${getInputClass(
                      "age"
                    )}`}
                    placeholder=" "
                  />
                  <label className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600">
                    Age
                  </label>
                </div>
              </div>

              {/* Civil Status & Sex */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-3 rounded">
                  <label className="block font-semibold text-sm mb-2">
                    Civil Status
                  </label>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {["Single", "Married", "Legally Separated", "Widowed"].map(
                      (status) => (
                        <label key={status}>
                          <input
                            type="radio"
                            name="civil"
                            value={status}
                            checked={formData.civil === status}
                            onChange={handleChange}
                          />{" "}
                          {status}
                        </label>
                      )
                    )}
                  </div>
                </div>
                <div className="border p-3 rounded">
                  <label className="block font-semibold text-sm mb-2">
                    Sex
                  </label>
                  <div className="flex gap-6 text-sm">
                    {["Male", "Female"].map((sex) => (
                      <label key={sex}>
                        <input
                          type="radio"
                          name="sex"
                          value={sex}
                          checked={formData.sex === sex}
                          onChange={handleChange}
                        />{" "}
                        {sex}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Classification */}
              <div className="border p-3 rounded">
                <label className="block font-semibold text-sm mb-2">
                  Social Classification
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {[
                    "4Ps",
                    "Senior Citizen",
                    "PWD",
                    "Solo Parent",
                    "Indigenous",
                    "Others",
                  ].map((social) => (
                    <label key={social}>
                      <input
                        type="checkbox"
                        name="social"
                        value={social}
                        checked={formData.social.includes(social)}
                        onChange={handleChange}
                      />{" "}
                      {social}
                    </label>
                  ))}
                </div>
                {formData.social.includes("Others") && (
                  <div className="relative mt-2">
                    <input
                      type="text"
                      name="socialOther"
                      value={formData.socialOther}
                      onChange={handleChange}
                      className="peer w-full border rounded-lg px-3 pt-5 pb-2"
                      placeholder=" "
                    />
                    <label className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600">
                      Please specify
                    </label>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["tel", "email"].map((field, i) => (
                  <div key={field} className="relative">
                    <input
                      type={field === "email" ? "email" : "tel"}
                      name={field}
                      value={formData[field as keyof FormData]}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`peer w-full border rounded-lg px-3 pt-5 pb-2 ${getInputClass(
                        field as keyof FormData
                      )}`}
                      placeholder=" "
                    />
                    <label className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600">
                      {["Telephone / Mobile", "Email"][i]}
                    </label>
                  </div>
                ))}
              </div>

              {/* Address Section */}
              <div className="mt-6">
                <p className="mb-2 text-gray-700 font-medium">Home Address</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["houseNo", "street", "barangay", "city"].map((field, i) => (
                    <div key={field} className="relative">
                      <input
                        type="text"
                        name={field}
                        value={formData[field as keyof FormData]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`peer w-full border rounded-lg px-3 pt-5 pb-2 ${getInputClass(
                          field as keyof FormData
                        )}`}
                        placeholder=" "
                      />
                      <label className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600">
                        {["House No.", "Street", "Barangay", "City"][i]}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {["province", "region", "zip"].map((field, i) => (
                    <div key={field} className="relative">
                      <input
                        type="text"
                        name={field}
                        value={formData[field as keyof FormData]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`peer w-full border rounded-lg px-3 pt-5 pb-2 ${getInputClass(
                          field as keyof FormData
                        )}`}
                        placeholder=" "
                      />
                      <label className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600">
                        {["Province", "Region", "Zip Code"][i]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="mt-6">
                <p className="mb-2 text-gray-700 font-medium">
                  Emergency Contact
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["emergencyName", "emergencyTel", "emergencyRelation"].map(
                    (field, i) => (
                      <div key={field} className="relative">
                        <input
                          type="text"
                          name={field}
                          value={formData[field as keyof FormData]}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`peer w-full border rounded-lg px-3 pt-5 pb-2 ${getInputClass(
                            field as keyof FormData
                          )}`}
                          placeholder=" "
                        />
                        <label className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600">
                          {
                            [
                              "Name",
                              "Telephone/Mobile No.",
                              "Nature of Relation",
                            ][i]
                          }
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* National ID */}
              <div className="border p-3 rounded">
                <label className="block font-semibold text-sm mb-2">
                  Do you have a National ID?
                </label>
                <div className="flex gap-6 text-sm">
                  {["Yes", "No"].map((option) => (
                    <label key={option}>
                      <input
                        type="radio"
                        name="hasNationalId"
                        value={option}
                        checked={formData.hasNationalId === option}
                        onChange={handleChange}
                      />{" "}
                      {option}
                    </label>
                  ))}
                </div>
                {formData.hasNationalId === "Yes" && (
                  <div className="relative mt-3">
                    <input
                      type="text"
                      name="nationalIdNo"
                      value={formData.nationalIdNo}
                      onChange={handleChange}
                      className="peer w-full border rounded-lg px-3 pt-5 pb-2"
                      placeholder=" "
                    />
                    <label className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600">
                      National ID No.
                    </label>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end gap-3 rounded-b-2xl z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                >
                  Submit
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ✅ Default export Home
export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img src={bgImage} alt="bg" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/35"></div>
      </div>

      <Header />

      {/* Add some top padding so content sits below header */}
      <main className="flex-1 relative z-10 container mx-auto px-6 pt-40">
        {/* Grid: center content spans 2 columns on large screens, right column is 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ---------- CENTER SURVEY CARD (spans 2 cols on large) ---------- */}
          <div className="lg:col-span-2 flex justify-center">
            <div
              className="relative w-full max-w-2xl rounded-2xl bg-white/85 backdrop-blur-sm shadow-2xl p-8 text-center"
              style={{ minHeight: 300 }}
            >
              {/* circular logo overlapping top */}
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-white rounded-full p-1 shadow">
                  <img
                    src={logo}
                    alt="dmw"
                    className="h-20 w-20 object-contain"
                  />
                </div>
              </div>

              {/* spacer for the overlapping logo */}
              <div className="pt-14">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
                  DMW Client Satisfaction Survey
                </h2>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg shadow hover:bg-blue-600 transition w-44">
                    Walk-in Client
                  </button>
                  <button className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg shadow hover:bg-blue-600 transition w-44">
                    Online Client
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- RIGHT-SIDE CARDS ---------- */}
          <aside className="lg:col-span-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-items-stretch content-stretch">
              {/* Citizen's Charter */}
              <a
                href="/files/Citizens-Charter.pdf" // <-- replace with your actual PDF path
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between h-full transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                  <img src={logo} alt="logo" className="w-16 h-14 mx-auto" />
                  <span className="font-bold text-lg text-blue-900 text-center mt-2">
                    DMW RO-X <br /> Citizen’s Charter
                  </span>
                </div>
              </a>

              {/* Official Facebook */}
              <a
                href="https://www.facebook.com/dmw.gov.ph"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full sm:w-auto h-full"
              >
                <div className="bg-blue-500 rounded-xl shadow p-4 flex justify-between items-center gap-4 h-full transform transition duration-300 hover:scale-105 hover:shadow-xl hover:bg-sky-600">
                  <div className="flex flex-col text-white">
                    <span className="font-bold text-xl leading-tight">
                      OFFICIAL
                    </span>
                    <span className="font-bold text-xl leading-tight">
                      FACEBOOK
                    </span>
                    <span className="font-bold text-xl leading-tight">
                      PAGE
                    </span>
                  </div>
                  <img
                    src="/facebook-like.svg"
                    alt="Facebook"
                    className="w-12 h-12 flex-shrink-0"
                  />
                </div>
              </a>

              {/* Email */}
              <div className="bg-blue-700 text-white rounded-xl shadow p-4 flex items-start gap-4 w-full sm:w-auto h-full transform transition duration-300 hover:scale-105 hover:shadow-xl">
                <div className="bg-white/20 rounded p-2 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
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
                <div className="flex flex-col justify-start">
                  <p className="font-bold text-2xl">Email us</p>
                  <p className="text-sm mt-8">cdo@dmw.gov.ph</p>
                </div>
              </div>

              {/* ✅ Register Here with Modal Trigger */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white rounded-xl shadow p-4 flex items-start gap-4 w-full sm:w-auto h-full transform transition duration-300 hover:scale-105 hover:shadow-xl text-left"
              >
                <div className="flex items-center justify-center">
                  <img src={smallLogo} alt="logo" className="h-10 mt-1" />
                </div>
                <div className="flex flex-col justify-start">
                  <p className="font-bold text-lg">Register Here</p>
                </div>
              </button>

              {/* For more info */}
              <a
                href="https://dmw.gov.ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full sm:w-auto"
              >
                <div className="bg-white rounded-xl shadow p-4 flex items-start gap-4 h-full transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                  <div className="bg-blue-100 rounded p-2 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-700"
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
                  <div className="flex flex-col justify-start">
                    <p className="text-blue-700 font-bold text-2xl">
                      For more Info
                    </p>
                    <p className="text-sm mt-1 italic text-sky-500">
                      Visit our Site <br /> dmw.gov.ph
                    </p>
                  </div>
                </div>
              </a>

              {/* Hotlines */}
              <div className="bg-white rounded-xl shadow p-4 w-full sm:w-auto h-full transform transition duration-300 hover:scale-105 hover:shadow-xl border-2 border-orange-500">
                <p className="text-orange-600 font-bold mb-2 underline decoration-orange-600 decoration-2">
                  DMW HOTLINES
                </p>
                <ul className="text-sm space-y-1">
                  <li>📞 (088)880 6414</li>
                  <li>📞 09569418162 - MWPD</li>
                  <li>📞 09171928836 - MWPTD</li>
                  <li>📞 09171354195 - WRSD</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      {/* ✅ Mount Modal */}
      <ClientInfoModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  );
}
