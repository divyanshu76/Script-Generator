import React from 'react';
import { Github, Instagram } from 'lucide-react';

export const Footer = ({ theme }: { theme: 'light' | 'dark' }) => {
  return (
    <footer className={`mt-16 py-8 border-t backdrop-blur-md ${theme === 'dark' ? 'bg-[#141418]/30 border-white/10 text-gray-400' : 'bg-white/30 border-slate-900/10 text-gray-500'}`}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-col items-center md:items-start text-sm">
          <p className="font-semibold">Script Generator</p>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>&copy; 2026</p>
        </div>

        <div className="flex flex-col items-center text-sm">
          <p className="opacity-80">Product by</p>
          <span className={`font-medium tracking-wide ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            DeadCode Labs
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com/truly_divyanshu"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-gray-200 hover:text-gray-900'
            }`}
            title="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href="https://github.com/divyanshu76"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-gray-200 hover:text-gray-900'
            }`}
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};
