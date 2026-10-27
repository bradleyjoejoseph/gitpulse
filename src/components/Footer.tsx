import React from 'react';
import { Globe } from 'lucide-react';
import { GithubIcon } from './icons/GithubIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-white/5 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left info */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                GitPulse
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8b949e] flex items-center justify-center md:justify-start gap-1">
              By{' '}
              <a
                href="https://github.com/bradleyjoejoseph"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--text-primary)] hover:text-[#2997ff] hover:underline"
              >
                Bradley Joseph
              </a>
            </p>
          </div>

          {/* Center tech stack pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono text-[#8b949e]">
            <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5">
              React 19
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5">
              TypeScript
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5">
              Tailwind 4
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5">
              GitHub API
            </span>
          </div>

          {/* Right Links */}
          <div className="flex items-center gap-4 text-xs text-[#8b949e]">
            <a
              href="https://bradleyjoejoseph.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Portfolio</span>
            </a>
            <a
              href="https://github.com/bradleyjoejoseph/gitpulse"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Repository</span>
            </a>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center text-[11px] text-[#6e7681]">
          <p>
            <strong>GitPulse</strong> — Developer Analytics, Versus Arena & Leaderboards.
          </p>
        </div>
      </div>
    </footer>
  );
};
