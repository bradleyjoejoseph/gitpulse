import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Zap,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  getStoredToken,
  setStoredToken,
  validateAndSaveToken,
  fetchRateLimitStatus,
  hasCustomToken,
} from '../services/githubApi';
import type { RateLimitInfo } from '../types/github';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenUpdated?: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  onTokenUpdated,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [hasCopiedNote, setHasCopiedNote] = useState(false);

  // Load existing token and rate limit on mount / open
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredToken();
      setActiveToken(stored);
      setTokenInput('');
      setFeedback({ type: null, message: '' });
      fetchRateLimitStatus().then((rl) => setRateLimit(rl));
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a GitHub Personal Access Token.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: '' });

    const result = await validateAndSaveToken(tokenInput.trim());
    setIsSubmitting(false);

    if (result.success) {
      setActiveToken(tokenInput.trim());
      setTokenInput('');
      if (result.rateLimit) setRateLimit(result.rateLimit);
      setFeedback({
        type: 'success',
        message: `Successfully connected! Authenticated as @${result.username || 'user'}. Your limit is boosted to ${result.rateLimit?.limit.toLocaleString() || '5,000'} req/hr.`,
      });
      if (onTokenUpdated) onTokenUpdated();
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Failed to validate token with GitHub.',
      });
    }
  };

  const handleRemove = () => {
    setStoredToken(null);
    setActiveToken(null);
    onClose();
    if (onTokenUpdated) onTokenUpdated();
  };

  const handleRefreshQuota = async () => {
    const rl = await fetchRateLimitStatus();
    setRateLimit(rl);
  };

  const formatResetTime = (timestamp?: number) => {
    if (!timestamp) return 'shortly';
    const d = new Date(timestamp * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const copyNoteText = () => {
    navigator.clipboard.writeText('GitPulse Access Token');
    setHasCopiedNote(true);
    setTimeout(() => setHasCopiedNote(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-7 shadow-2xl z-10 my-auto text-[var(--text-primary)] transition-all max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-md shadow-amber-500/15">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 id="token-modal-title" className="text-lg sm:text-xl font-bold tracking-tight">
              GitHub API Token
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Boost your rate limit from <strong>60</strong> to <strong>5,000 requests per hour</strong>.
            </p>
          </div>
        </div>

        {/* Active Rate Limit Status Card */}
        <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {activeToken ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400/80" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {hasCustomToken()
                      ? 'Custom Personal Token Connected'
                      : activeToken
                      ? 'Built-In App Token Connected'
                      : 'Unauthenticated (Public IP Mode)'}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                      activeToken
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {activeToken ? '5,000 / hr' : '60 / hr'}
                  </span>
                </div>
                {rateLimit && (
                  <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                    Remaining:{' '}
                    <strong className="text-[var(--text-primary)]">
                      {rateLimit.remaining.toLocaleString()}
                    </strong>{' '}
                    / {rateLimit.limit.toLocaleString()} calls • Resets at{' '}
                    {formatResetTime(rateLimit.reset)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleRefreshQuota}
                className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center text-xs"
                title="Refresh rate limit count"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              {hasCustomToken() && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-all cursor-pointer min-h-[32px]"
                  title="Remove custom stored token and revert to built-in token"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revert to Default</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="gh-token-input"
              className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5"
            >
              Paste Your Personal Access Token (Classic)
            </label>
            <div className="relative">
              <input
                id="gh-token-input"
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={activeToken ? '••••••••••••••••••••••••••••••••••••' : 'ghp_... or github_pat_...'}
                className="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] text-xs font-mono text-[var(--text-primary)] transition-all min-h-[42px]"
                autoComplete="off"
                spellCheck="false"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
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

          {/* Feedback banner */}
          {feedback.message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Stored strictly in local browser storage</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !tokenInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2997ff] hover:bg-[#1a85ea] disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer min-h-[38px] active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Save & Boost</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Step-by-Step Tutorial Card */}
        <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#2997ff]" />
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                How to Generate a Free Token (1 Minute)
              </h3>
            </div>
            <a
              href="https://github.com/settings/tokens/new?description=GitPulse%20Access%20Token&scopes=public_repo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[#2997ff]/10 text-[#2997ff] border border-[var(--border-subtle)] hover:border-[#2997ff]/30 text-xs font-medium transition-all cursor-pointer min-h-[28px]"
            >
              <span>Create Token on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
            {/* Step 1 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="w-5 h-5 rounded-full bg-[#2997ff]/15 text-[#2997ff] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                1
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[var(--text-primary)] font-medium">
                  Open the GitHub Token Creation Page
                </p>
                <p className="text-[11px] mt-0.5">
                  Click the button above or navigate to GitHub <strong>Settings → Developer settings → Personal access tokens → Tokens (classic)</strong>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="w-5 h-5 rounded-full bg-[#2997ff]/15 text-[#2997ff] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                2
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[var(--text-primary)] font-medium">
                  Set Note & Expiration
                </p>
                <p className="text-[11px] mt-0.5">
                  Set the Note to <code className="font-mono text-[#2997ff] bg-[var(--bg-card)] px-1 py-0.5 rounded">GitPulse Access Token</code> and select your preferred expiration (e.g. 90 days or No expiration).
                </p>
                <button
                  type="button"
                  onClick={copyNoteText}
                  className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-[#2997ff] hover:underline cursor-pointer"
                >
                  {hasCopiedNote ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{hasCopiedNote ? 'Copied note to clipboard!' : 'Copy recommended note name'}</span>
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="w-5 h-5 rounded-full bg-[#2997ff]/15 text-[#2997ff] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                3
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[var(--text-primary)] font-medium">
                  Scopes: No Permissions Needed!
                </p>
                <p className="text-[11px] mt-0.5">
                  For reading public developer stats, <strong className="text-[var(--text-primary)]">no checkboxes need to be ticked</strong>. Leaving all scopes blank is 100% safe and grants the full 5,000 req/hr allowance.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="w-5 h-5 rounded-full bg-[#2997ff]/15 text-[#2997ff] font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                4
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[var(--text-primary)] font-medium">
                  Generate & Paste
                </p>
                <p className="text-[11px] mt-0.5">
                  Scroll to the bottom, click the green <strong>Generate token</strong> button, copy your token (starts with <code className="font-mono text-emerald-400">ghp_...</code>), and paste it into the field above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
