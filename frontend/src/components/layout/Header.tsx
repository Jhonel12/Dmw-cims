import React from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  return (
    <header className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-strong w-full overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative px-4 py-4 lg:px-6 lg:py-6">
        {/* Mobile Layout */}
        <div className="lg:hidden w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="relative">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20 shadow-lg">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center">
                    <span className="text-blue-900 font-black text-xs tracking-tight">DMW</span>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent truncate">
                  Department of Migrant Workers
                </h1>
                <p className="text-blue-200 text-xs font-medium truncate">Region 10 - Northern Mindanao</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs font-semibold text-white">System Online</p>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between">
            {/* Logo and Title Section */}
            <div className="flex items-center space-x-6">
              {/* Modern Logo */}
              <div className="relative">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <span className="text-blue-900 font-black text-xl tracking-tight">DMW</span>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              
              {/* Title Section */}
              <div className="space-y-1">
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Department of Migrant Workers
                </h1>
                <div className="flex items-center space-x-3">
                  <p className="text-blue-200 text-xs font-medium">Region 10 - Northern Mindanao</p>
                  <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
                  <p className="text-blue-300 text-xs">Est. 2021</p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="text-right space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs font-semibold text-white">System Online</p>
              </div>
              <p className="text-blue-200 text-xs font-medium">OFW Tracking System</p>
              <p className="text-blue-300 text-xs">Administrative Portal v2.0</p>
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    </header>
  );
};

export default Header;

