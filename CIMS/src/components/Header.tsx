// src/components/Header.tsx
import React from "react";
import leftLogo from "../assets/logo3.png";
import rightLogo from "../assets/bagong.png";

const Header: React.FC = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-white/70 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 lg:py-6 flex items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-16">
        {/* Left Logo - Responsive sizing */}
        <img 
          src={leftLogo} 
          alt="left" 
          className="h-10 min-w-[40px] xs:h-11 sm:h-12 md:h-14 lg:h-16 object-contain flex-shrink-0" 
        />

        {/* Center Text - Responsive typography */}
        <div className="text-center px-3 sm:px-4 md:px-6 lg:px-8">
          <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs leading-tight mb-1">
            Republic of the Philippines
          </p>

          {/* Department name - single line */}
          <h1 className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-extrabold leading-tight my-1 whitespace-nowrap">
            Department of Migrant Workers
          </h1>

          <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-gray-600 leading-tight mt-1">
            Regional Office X
          </p>
        </div>

        {/* Right Logo - Responsive sizing */}
        <img 
          src={rightLogo} 
          alt="right" 
          className="h-10 min-w-[40px] xs:h-11 sm:h-12 md:h-14 lg:h-16 object-contain flex-shrink-0" 
        />
      </div>
    </header>
  );
};

export default Header;
