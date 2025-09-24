// src/components/Header.tsx
import React from "react";
import leftLogo from "../assets/logo3.png";
import rightLogo from "../assets/bagong.png";

const Header: React.FC = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-20 bg-white/70 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <img src={leftLogo} alt="left" className="h-14 sm:h-16 lg:h-20" />

        <div className="text-center">
          <p className="text-xs sm:text-sm">Republic of the Philippines</p>

          {/* force break on small screens */}
          <p className="text-lg sm:text-2xl font-extrabold leading-tight -mt-1">
            Department of <br className="sm:hidden" />
            Migrant Workers
          </p>

          <p className="text-xs sm:text-sm text-gray-600 mt-0">
            Regional Office X
          </p>
        </div>

        <img src={rightLogo} alt="right" className="h-14 sm:h-16 lg:h-20" />
      </div>
    </header>
  );
};

export default Header;
