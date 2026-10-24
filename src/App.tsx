import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from './hooks/useTheme';
import { Navbar, type ActivePage } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { ProfileHero } from './components/ProfileHero';
import { MetricCards } from './components/MetricCards';
import { LanguageBreakdown } from './components/LanguageBreakdown';
import { RepoAnalytics } from './components/RepoAnalytics';
import { CommitPunchcard } from './components/CommitPunchcard';
import { CommitCalendar } from './components/CommitCalendar';
import { RepoExplorer } from './components/RepoExplorer';
import { LeaderboardPage } from './components/LeaderboardPage';
import { CompareModal } from './components/CompareModal';
import { ExportCardModal } from './components/ExportCardModal';
import { MobileTabBar } from './components/MobileTabBar';
import { Footer } from './components/Footer';
import { TokenModal } from './components/TokenModal';
import { TokenGate } from './components/TokenGate';
import { fetchUserSummary, syncLeaderboardEntries, getStoredToken } from './services/githubApi';
import { INITIAL_LEADERBOARD_PROFILES } from './services/leaderboardData';
import type { UserSummaryData } from './types/github';
import { AlertCircle, KeyRound, RefreshCw } from 'lucide-react';

const LEADERBOARD_STORAGE_KEY = 'gitpulse_leaderboard_roster_v2';

function loadInitialLeaderboard(): UserSummaryData[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return INITIAL_LEADERBOARD_PROFILES;
    const saved = JSON.parse(raw) as UserSummaryData[];
    if (!Array.isArray(saved) || saved.length === 0) return INITIAL_LEADERBOARD_PROFILES;

    // Merge saved profiles with initial roster so default contenders are always present
    const map = new Map<string, UserSummaryData>();
    for (const p of INITIAL_LEADERBOARD_PROFILES) {
      map.set(p.user.login.toLowerCase(), p);
    }
    for (const p of saved) {
      if (p?.user?.login) {
        map.set(p.user.login.toLowerCase(), p);
      }
    }
    return Array.from(map.values());
  } catch {
    return INITIAL_LEADERBOARD_PROFILES;
  }
}

export function App() {
  const { theme, setTheme } = useTheme();

  // Initial username from query string or default to Bradley Joseph
  const getInitialUsername = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('user') || 'bradleyjoejoseph';
  };

  const getInitialPage = (): ActivePage => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'leaderboard' ? 'leaderboard' : 'profile';
  };

  const [activePage, setActivePage] = useState<ActivePage>(getInitialPage);
  const [username, setUsername] = useState(getInitialUsername);
  const [summary, setSummary] = useState<UserSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leaderboard profiles state
  const [leaderboardProfiles, setLeaderboardProfiles] = useState<UserSummaryData[]>(
    loadInitialLeaderboard
  );
  const [isAddingToLeaderboard, setIsAddingToLeaderboard] = useState(false);
  const [leaderboardAddError, setLeaderboardAddError] = useState<string | null>(null);
  const [isSyncingLeaderboard, setIsSyncingLeaderboard] = useState(false);
  const [lastLeaderboardSync, setLastLeaderboardSync] = useState<number | null>(null);
  const leaderboardRef = useRef(leaderboardProfiles);
  leaderboardRef.current = leaderboardProfiles;

  // Persist leaderboard roster changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboardProfiles));
    } catch {
      // Ignore storage quota errors
    }
  }, [leaderboardProfiles]);

  // Modals state
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareOpponent, setCompareOpponent] = useState<string | null>(null);
  const [isExportCardModalOpen, setIsExportCardModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [hasGhToken, setHasGhToken] = useState<boolean>(() => !!getStoredToken());

  const upsertIntoLeaderboard = useCallback((userData: UserSummaryData) => {
    setLeaderboardProfiles((prev) => {
      const existsIdx = prev.findIndex(
        (p) => p.user.login.toLowerCase() === userData.user.login.toLowerCase()
      );
      if (existsIdx >= 0) {
        const updated = [...prev];
        updated[existsIdx] = userData;
        return updated;
      }
      return [userData, ...prev];
    });
  }, []);

  const handleSyncLeaderboard = useCallback(async (bypassCache = false) => {
    setIsSyncingLeaderboard(true);
    try {
      const refreshed = await syncLeaderboardEntries(leaderboardRef.current, bypassCache);
      setLeaderboardProfiles(refreshed);
      setLastLeaderboardSync(Date.now());
    } catch (err) {
      console.warn('Leaderboard background sync warning:', err);
    } finally {
      setIsSyncingLeaderboard(false);
    }
  }, []);

  const loadUserData = useCallback(
    async (targetUser: string, bypassCache = false) => {
      setIsLoading(true);
      setError(null);

      // Update URL search param without full reload
      const url = new URL(window.location.href);
      url.searchParams.set('user', targetUser);
      window.history.replaceState({}, '', url.toString());

      try {
        const data = await fetchUserSummary(targetUser, bypassCache);
        setSummary(data);
        setUsername(targetUser);
        upsertIntoLeaderboard(data);
        setLastLeaderboardSync(Date.now());
      } catch (err: any) {
        console.error('Fetch error:', err);
        const errMsg = err.message || 'Failed to fetch GitPulse developer profile.';
        setError(errMsg);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    },
    [upsertIntoLeaderboard]
  );

  // Initial profile fetch + automatic live leaderboard sync every 5 minutes (only when authenticated)
  useEffect(() => {
    if (hasGhToken) {
      loadUserData(username);
      handleSyncLeaderboard(false);

      const intervalId = window.setInterval(() => {
        handleSyncLeaderboard(false);
      }, 5 * 60 * 1000);

      return () => window.clearInterval(intervalId);
    } else {
      setIsLoading(false);
    }
  }, [hasGhToken, loadUserData, handleSyncLeaderboard, username]);

  const handleChangePage = (page: ActivePage) => {
    setActivePage(page);
    const url = new URL(window.location.href);
    if (page === 'leaderboard') {
      url.searchParams.set('view', 'leaderboard');
    } else {
      url.searchParams.delete('view');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleSearch = (newUsername: string) => {
    if (newUsername.trim()) {
      setActivePage('profile');
      loadUserData(newUsername.trim());
    }
  };

  const handleRefresh = () => {
    if (username) {
      loadUserData(username, true);
    }
  };

  const handleAddLeaderboardProfile = async (userToAdd: string) => {
    setIsAddingToLeaderboard(true);
    setLeaderboardAddError(null);
    try {
      const data = await fetchUserSummary(userToAdd.trim(), true);
      upsertIntoLeaderboard(data);
      setLastLeaderboardSync(Date.now());
    } catch (err: any) {
      setLeaderboardAddError(err.message || `Could not find GitHub user "${userToAdd}".`);
    } finally {
      setIsAddingToLeaderboard(false);
    }
  };

  const handleBattleUser = (opponentLogin: string) => {
    setCompareOpponent(opponentLogin);
    setIsCompareModalOpen(true);
  };

  if (!hasGhToken) {
    return (
      <TokenGate
        onTokenUnlocked={(authenticatedUser) => {
          setHasGhToken(true);
          const initial = authenticatedUser || username || 'bradleyjoejoseph';
          loadUserData(initial);
        }}
        theme={theme}
        onThemeChange={setTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors">
      {/* Top Navigation */}
      <Navbar
        theme={theme}
        onThemeChange={setTheme}
        activePage={activePage}
        onChangePage={handleChangePage}
        onOpenCompareModal={() => {
          setCompareOpponent(null);
          setIsCompareModalOpen(true);
        }}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        hasToken={hasGhToken}
      />

      <main className="flex-1 pb-28 sm:pb-16">
        {activePage === 'leaderboard' ? (
          <LeaderboardPage
            profiles={leaderboardProfiles}
            currentUsername={username}
            onAddProfile={handleAddLeaderboardProfile}
            onSelectProfile={(selectedLogin) => {
              handleChangePage('profile');
              loadUserData(selectedLogin);
            }}
            onBattleUser={handleBattleUser}
            onSyncLeaderboard={() => handleSyncLeaderboard(true)}
            isSyncing={isSyncingLeaderboard}
            lastSyncedAt={lastLeaderboardSync}
            isAddingUser={isAddingToLeaderboard}
            addError={leaderboardAddError}
          />
        ) : (
          <>
            {/* Search Bar */}
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              currentUsername={username}
            />

            {/* Error banner */}
            {error && (
              <div className="max-w-4xl mx-auto px-4 mt-6">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                    <div>
                      <h4 className="font-bold">Request Failed</h4>
                      <p className="text-xs text-red-400/90 mt-0.5">{error}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => setIsTokenModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2997ff] hover:bg-[#1a85ea] text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer min-h-[32px]"
                      title="Update GitHub Personal Access Token"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Manage Token</span>
                    </button>
                    <button
                      onClick={handleRefresh}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all cursor-pointer min-h-[32px]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && !summary && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-5">
                <div className="h-64 rounded-3xl bg-[#161b22]/60 border border-white/5 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="h-28 rounded-2xl bg-[#161b22]/60 border border-white/5 animate-pulse" />
                  <div className="h-28 rounded-2xl bg-[#161b22]/60 border border-white/5 animate-pulse" />
                  <div className="h-28 rounded-2xl bg-[#161b22]/60 border border-white/5 animate-pulse" />
                </div>
              </div>
            )}

            {/* Profile Content */}
            {summary && (
              <>
                {/* Executive Hero */}
                <ProfileHero
                  user={summary.user}
                  summary={summary}
                  totalStars={summary.totalStars}
                  totalForks={summary.totalForks}
                  primaryLanguage={summary.primaryLanguage}
                  sourceReposCount={summary.sourceReposCount}
                  onRefresh={handleRefresh}
                  onOpenCompare={() => {
                    setCompareOpponent(null);
                    setIsCompareModalOpen(true);
                  }}
                  onOpenExportCard={() => setIsExportCardModalOpen(true)}
                  onOpenLeaderboard={() => handleChangePage('leaderboard')}
                />

                {/* KPI Metric Ribbon */}
                <MetricCards summary={summary} />

                {/* GitHub Contribution Calendar Heatmap */}
                <CommitCalendar
                  contributions={summary.contributions}
                  totalContributions={summary.totalContributions}
                  yearlyContributions={summary.yearlyContributions}
                  username={summary.user.login}
                />

                {/* Analytics Grid */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <LanguageBreakdown languageStats={summary.languageStats} />
                    <RepoAnalytics
                      topStarredRepos={summary.topStarredRepos}
                      topForkedRepos={summary.topForkedRepos}
                    />
                  </div>

                  {/* Day of week & 24h cadence */}
                  <CommitPunchcard
                    dayActivity={summary.dayActivity}
                    hourActivity={summary.hourActivity}
                  />
                </div>

                {/* Repositories Explorer */}
                <RepoExplorer repos={summary.repos} />
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Bottom Tab Bar on Mobile */}
      <MobileTabBar
        activePage={activePage}
        onChangePage={handleChangePage}
        onOpenCompareModal={() => {
          setCompareOpponent(null);
          setIsCompareModalOpen(true);
        }}
        theme={theme}
        onThemeChange={setTheme}
      />

      {(summary || leaderboardProfiles[0]) && (
        <CompareModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          currentUser={summary || leaderboardProfiles[0]}
          initialOpponentLogin={compareOpponent}
        />
      )}

      {summary && (
        <ExportCardModal
          isOpen={isExportCardModalOpen}
          onClose={() => setIsExportCardModalOpen(false)}
          summary={summary}
        />
      )}

      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenUpdated={() => {
          setHasGhToken(!!getStoredToken());
          if (username) {
            loadUserData(username, true);
          }
        }}
      />
    </div>
  );
}

export default App;
