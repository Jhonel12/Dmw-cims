// src/components/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="relative w-full z-20 bg-black/40 backdrop-blur-sm text-white text-center py-3 sm:py-4 md:py-5 mt-8 sm:mt-12 md:mt-16">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <p className="text-[10px] xs:text-xs sm:text-sm md:text-base leading-relaxed">
          © {new Date().getFullYear()} Department of Migrant Workers
          <span className="hidden xs:inline"> — </span>
          <br className="xs:hidden" />
          <span className="xs:inline">Regional Office X</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
