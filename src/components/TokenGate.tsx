import React, { useState } from 'react';
import {
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Activity,
  Sun,
  Moon,
  Flame,
} from 'lucide-react';
import { validateAndSaveToken } from '../services/githubApi';
import type { Theme } from '../hooks/useTheme';

interface TokenGateProps {
  onTokenUnlocked: (authenticatedUser?: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const TokenGate: React.FC<TokenGateProps> = ({
  onTokenUnlocked,
  theme,
  onThemeChange,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCopiedNote, setHasCopiedNote] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenInput.trim();
    if (!clean) {
      setErrorMsg('Please paste your GitHub Personal Access Token to continue.');
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);

    const result = await validateAndSaveToken(clean);
    setIsValidating(false);

    if (result.success) {
      onTokenUnlocked(result.username);
    } else {
      setErrorMsg(
        result.error ||
          'GitHub rejected this token. Please make sure you copied the entire token (starts with ghp_ or github_pat_) without extra spaces.'
      );
    }
  };

  const copyNoteText = () => {
    navigator.clipboard.writeText('GitPulse Access Token');
    setHasCopiedNote(true);
    setTimeout(() => setHasCopiedNote(false), 2000);
  };

  const cycleTheme = () => {
    if (theme === 'dark') onThemeChange('midnight');
    else if (theme === 'midnight') onThemeChange('light');
    else onThemeChange('dark');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-6 sm:py-10 transition-colors">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2997ff] to-[#0077ed] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight text-[var(--text-primary)]">
            GitPulse
          </span>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-color)] text-[var(--text-primary)] transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title={`Appearance: ${theme}. Click to switch.`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : theme === 'midnight' ? (
            <Flame className="w-4 h-4 text-purple-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>
      </header>

      {/* Main Center Card */}
      <main className="w-full max-w-xl mx-auto my-auto">
        <div className="apple-card p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-[var(--border-color)]">
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#2997ff]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badge & Title */}
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/20 mb-4">
              <KeyRound className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold uppercase mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Token Required</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Connect Your GitHub Token
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
              To inspect live developer analytics, contribution graphs, and versus battles without being blocked by GitHub's 60 req/hr IP limit, enter a free GitHub Personal Access Token.
            </p>
          </div>

          {/* Token Input Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5 relative">
            <div>
              <label
                htmlFor="gate-token-input"
                className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5"
              >
                Personal Access Token (Classic)
              </label>
              <div className="relative">
                <input
                  id="gate-token-input"
                  type={showToken ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_... or github_pat_..."
                  className="w-full px-4 py-3 pr-20 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] text-xs font-mono text-[var(--text-primary)] transition-all min-h-[46px]"
                  autoComplete="off"
                  spellCheck="false"
                  disabled={isValidating}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl text-xs flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isValidating || !tokenInput.trim()}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-[#2997ff] hover:bg-[#1a85ea] disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer min-h-[46px] active:scale-[0.98]"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Token with GitHub...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Unlock GitPulse (5,000 req/hr)</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Guide */}
          <div className="mt-7 pt-6 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Need a token? Takes under 60 seconds:
              </span>
              <a
                href="https://github.com/settings/tokens/new?description=GitPulse%20Access%20Token"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[#2997ff]/10 text-[#2997ff] border border-[var(--border-subtle)] hover:border-[#2997ff]/30 text-xs font-semibold transition-all cursor-pointer min-h-[30px]"
              >
                <span>Open Token Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <ol className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-[#2997ff]/15 text-[#2997ff] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">
                    Click <strong>Open Token Page</strong> above
                  </p>
                  <p className="text-[11px] mt-0.5">
                    (Or go to GitHub Settings → Developer Settings → Personal access tokens → Tokens classic)
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-[#2997ff]/15 text-[#2997ff] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">
                    Set Note to <code className="font-mono text-[#2997ff]">GitPulse Access Token</code>
                  </p>
                  <button
                    type="button"
                    onClick={copyNoteText}
                    className="mt-1 flex items-center gap-1 text-[10px] font-mono text-[#2997ff] hover:underline cursor-pointer"
                  >
                    {hasCopiedNote ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{hasCopiedNote ? 'Copied to clipboard!' : 'Copy recommended note'}</span>
                  </button>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-[#2997ff]/15 text-[#2997ff] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">
                    Leave all scope checkboxes empty
                  </p>
                  <p className="text-[11px] mt-0.5 text-emerald-400 font-medium">
                    Zero permissions required! Safe for your account.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-[#2997ff]/15 text-[#2997ff] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                  4
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">
                    Click <strong>Generate token</strong> at the bottom & paste it above
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Privacy Note */}
          <div className="mt-5 flex items-center gap-2 text-[11px] text-[var(--text-secondary)] justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Stored strictly on your device in browser localStorage</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[var(--text-secondary)] pt-6">
        <span>GitPulse • Built with GitHub REST & Contributions API</span>
      </footer>
    </div>
  );
};
