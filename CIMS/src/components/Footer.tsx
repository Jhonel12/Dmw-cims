// src/components/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="fixed left-0 right-0 bottom-0 z-20 bg-black/40 text-white text-center py-3">
      <div className="container mx-auto px-6">
        <small>
          © {new Date().getFullYear()} Department of Migrant Workers — Regional
          Office X
        </small>
      </div>
    </footer>
  );
};

export default Footer;
