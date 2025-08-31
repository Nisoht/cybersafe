import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t bg-white py-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} CyberSafe. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-cybersafe-600 text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-cybersafe-600 text-sm">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-cybersafe-600 text-sm">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;