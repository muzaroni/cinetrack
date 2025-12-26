
import React, { useState, useMemo, useEffect } from 'react';
import { TVShowSeason, ShowStatus, ViewType } from './types';
import { getRatingColor, STATUS_COLORS, getNetworkColorClass } from './constants';
import ShowModal from './components/ShowModal';
import Stats from './components/Stats';
import { 
  Plus, Search, LayoutGrid, BarChart3, ChevronDown, ChevronUp, 
  Youtube, Info, Trash2, Edit2, Tv, Globe,
  Download, Upload, Archive, ArrowUpDown, MessageSquare, 
  Settings, Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle, X, Github
} from 'lucide-react';

type SortType = 
  | 'created-desc' 
  | 'rating-desc' | 'rating-asc' 
  | 'title-asc' | 'title-desc' 
  | 'season-desc' | 'season-asc' 
  | 'date-desc';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
}

const DEFAULT_SHOWS: TVShowSeason[] = [
  {
    id: 'default-1',
    title: 'The Bear',
    seasonNumber: 3,
    network: 'FX / Hulu',
    genres: ['Drama', 'Comedy'],
    userRating: 4.8,
    aggregateRatings: { imdb: 8.6, metacritic: 80, rottenTomatoes: 96 },
    urls: { 
      imdb: 'https://www.imdb.com/title/tt14452792/',
      rottenTomatoes: 'https://www.rottentomatoes.com/tv/the_bear/s03',
      trailer: 'https://www.youtube.com/watch?v=UHiwdDLuJ_s'
    },
    status: ShowStatus.WATCHING,
    review: "Incredible tension and character growth. The cinematography in the kitchen scenes remains unmatched.",
    synopsis: "Carmy, Sydney, and Richie work to transform their grimy sandwich shop into a next-level dining destination.",
    isOngoing: true,
    startDate: '2025-01-10',
    createdAt: Date.now() - 1000
  }
];

const App: React.FC = () => {
  const [shows, setShows] = useState<TVShowSeason[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [view, setView] = useState<ViewType>('grid');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [sortType, setSortType] = useState<SortType>('created-desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<TVShowSeason | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // GitHub Sync State
  const [ghConfig, setGhConfig] = useState<GitHubConfig>({
    token: localStorage.getItem('gh_token') || '',
    owner: localStorage.getItem('gh_owner') || '',
    repo: localStorage.getItem('gh_repo') || '',
    path: 'shows.json'
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const initializeData = async () => {
      const saved = localStorage.getItem('cinetrack_shows');
      if (saved) {
        try {
          setShows(JSON.parse(saved));
          setIsDataLoaded(true);
          return;
        } catch (err) {
          console.error("Failed to parse saved shows:", err);
        }
      }

      try {
        const response = await fetch('./shows.json');
        if (response.ok) {
          const data = await response.json();
          setShows(data);
        } else {
          setShows(DEFAULT_SHOWS);
        }
      } catch (err) {
        setShows(DEFAULT_SHOWS);
      }
      setIsDataLoaded(true);
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem('cinetrack_shows', JSON.stringify(shows));
    }
  }, [shows, isDataLoaded]);

  const saveGhConfig = (config: GitHubConfig) => {
    setGhConfig(config);
    localStorage.setItem('gh_token', config.token);
    localStorage.setItem('gh_owner', config.owner);
    localStorage.setItem('gh_repo', config.repo);
  };

  const syncToGitHub = async () => {
    if (!ghConfig.token || !ghConfig.owner || !ghConfig.repo) {
      setIsSettingsOpen(true);
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Fetching repository state...');

    try {
      // 1. Get the current file SHA (needed for update)
      const getFileRes = await fetch(
        `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents/${ghConfig.path}`,
        {
          headers: {
            Authorization: `token ${ghConfig.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );

      let sha = '';
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        sha = fileData.sha;
      }

      setSyncMessage('Pushing updates to GitHub...');

      // 2. Commit the new shows.json content
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(shows, null, 2))));
      const updateRes = await fetch(
        `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents/${ghConfig.path}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${ghConfig.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Update shows.json archive [${new Date().toLocaleString()}]`,
            content: content,
            sha: sha || undefined
          })
        }
      );

      if (updateRes.ok) {
        setSyncStatus('success');
        setSyncMessage('Successfully pushed to GitHub');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        const err = await updateRes.json();
        throw new Error(err.message || 'Failed to update file');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(err.message || 'Sync failed');
    }
  };

  const normalizeUrl = (url?: string): string => {
    if (!url) return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    shows.forEach(s => {
      const date = s.endDate || s.startDate || new Date(s.createdAt).toISOString().split('T')[0];
      const year = date.split('-')[0];
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [shows]);

  const filteredShows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = shows.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(q) ||
        s.network.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        s.genres.some(g => g.toLowerCase().includes(q));
      
      if (!matchesSearch) return false;
      if (selectedYear === 'All') return true;
      const date = s.endDate || s.startDate || new Date(s.createdAt).toISOString().split('T')[0];
      return date.startsWith(selectedYear);
    });

    result.sort((a, b) => {
      switch (sortType) {
        case 'rating-desc': return b.userRating - a.userRating;
        case 'rating-asc': return a.userRating - b.userRating;
        case 'title-asc': return a.title.localeCompare(b.title);
        case 'title-desc': return b.title.localeCompare(a.title);
        case 'season-desc': return b.seasonNumber - a.seasonNumber;
        case 'season-asc': return a.seasonNumber - b.seasonNumber;
        case 'date-desc': return (b.startDate || '').localeCompare(a.startDate || '');
        case 'created-desc':
        default: return b.createdAt - a.createdAt;
      }
    });

    return result;
  }, [shows, searchQuery, selectedYear, sortType]);

  const handleSaveShow = (newShow: TVShowSeason) => {
    if (editingShow) {
      setShows(prev => prev.map(s => s.id === editingShow.id ? newShow : s));
    } else {
      setShows(prev => [newShow, ...prev]);
    }
    setIsModalOpen(false);
    setEditingShow(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this entry permanently?')) {
      setShows(prev => prev.filter(s => s.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  const handleEdit = (show: TVShowSeason, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShow(show);
    setIsModalOpen(true);
  };

  if (!isDataLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Github className="w-5 h-5 text-indigo-400" /> GitHub Sync Settings
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Personal Access Token</label>
                <input type="password" value={ghConfig.token} onChange={e => saveGhConfig({ ...ghConfig, token: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-600" placeholder="ghp_xxxxxxxxxxxx" />
                <p className="text-[9px] text-slate-500 italic">Requires 'contents: write' scope.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Username</label>
                  <input type="text" value={ghConfig.owner} onChange={e => saveGhConfig({ ...ghConfig, owner: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="octocat" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Repo Name</label>
                  <input type="text" value={ghConfig.repo} onChange={e => saveGhConfig({ ...ghConfig, repo: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="tv-archive" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <button onClick={() => setIsSettingsOpen(false)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-xl shadow-indigo-600/20 transition-all">Save Config</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 transition-transform hover:scale-105"><Tv className="w-8 h-8 text-white" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none mb-1">CineTrack</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Standalone Vault</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:max-w-6xl">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
            <input type="text" placeholder="Search archive..." className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Cloud Sync Tooltip/Status */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 gap-1 shadow-xl">
              <button 
                onClick={syncToGitHub} 
                disabled={syncStatus === 'syncing'}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 group relative ${syncStatus === 'error' ? 'text-red-400 bg-red-400/10' : syncStatus === 'success' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white'}`}
                title="Sync to GitHub"
              >
                {syncStatus === 'syncing' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                 syncStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                 syncStatus === 'error' ? <AlertCircle className="w-4 h-4" /> :
                 ghConfig.token ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                
                {syncStatus !== 'idle' && <span className="text-[10px] font-black uppercase tracking-widest pr-1 animate-in fade-in slide-in-from-right-2">{syncMessage}</span>}
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:text-white transition-colors border-l border-slate-800"><Settings className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl">
              <button onClick={() => setView('grid')} className={`p-2.5 rounded-lg transition-all ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setView('stats')} className={`p-2.5 rounded-lg transition-all ${view === 'stats' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}><BarChart3 className="w-4 h-4" /></button>
            </div>
            
            <button onClick={() => { setEditingShow(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-sm whitespace-nowrap"><Plus className="w-4 h-4" /> Add Season</button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto mb-10 flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <button onClick={() => setSelectedYear('All')} className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap border transition-all ${selectedYear === 'All' ? 'bg-white text-slate-950 border-white shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>Full Timeline</button>
        {availableYears.map(year => (
          <button key={year} onClick={() => setSelectedYear(year)} className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap border transition-all ${selectedYear === year ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>{year}</button>
        ))}
      </div>

      <div className="max-w-[1800px] mx-auto">
        {view === 'grid' ? (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-widest w-[28%] text-slate-500">Series Title</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-widest w-[6%] text-center text-slate-500">Ssn</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-widest w-[15%] text-slate-500">Personal Rating</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-widest w-[18%] text-slate-500">Aggregates</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-widest w-[12%] text-slate-500">Platform</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-widest w-[13%] text-slate-500">Status</th>
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-widest w-[8%] text-center text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredShows.map(show => (
                    <React.Fragment key={show.id}>
                      <tr onClick={() => setExpandedId(expandedId === show.id ? null : show.id)} className={`hover:bg-slate-800/30 transition-colors cursor-pointer group/row ${expandedId === show.id ? 'bg-indigo-500/5' : ''}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-4">
                            {expandedId === show.id ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-slate-600 group-hover/row:text-slate-400" />}
                            <div className="min-w-0">
                              <div className="font-bold text-white text-lg truncate leading-tight tracking-tight">{show.title}</div>
                              <div className="flex flex-wrap gap-1.5 mt-1">{show.genres.slice(0, 2).map(g => (<span key={g} className="text-[9px] bg-slate-800/80 px-2 py-0.5 rounded text-slate-400 font-black uppercase tracking-tighter">{g}</span>))}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center"><span className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg text-sm font-black text-slate-200">{show.seasonNumber}</span></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-base shrink-0" style={{ backgroundColor: getRatingColor(show.userRating) + '15', color: getRatingColor(show.userRating), border: `1px solid ${getRatingColor(show.userRating)}30` }}>{show.userRating.toFixed(1)}</div>
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full transition-all duration-1000" style={{ width: `${(show.userRating / 5) * 100}%`, backgroundColor: getRatingColor(show.userRating) }} /></div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                           <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-black">
                              {show.aggregateRatings.imdb && <div className="truncate"><span className="text-slate-600 uppercase">IMDb:</span> <span className="text-yellow-500">{show.aggregateRatings.imdb}</span></div>}
                              {show.aggregateRatings.rottenTomatoes && <div className="truncate"><span className="text-slate-600 uppercase">RT:</span> <span className="text-red-500">{show.aggregateRatings.rottenTomatoes}%</span></div>}
                              {show.aggregateRatings.metacritic && <div className="truncate"><span className="text-slate-600 uppercase">MC:</span> <span className="text-emerald-500">{show.aggregateRatings.metacritic}</span></div>}
                           </div>
                        </td>
                        <td className="px-5 py-3 truncate font-black text-base transition-colors"><span className={getNetworkColorClass(show.network)}>{show.network}</span></td>
                        <td className="px-5 py-3"><span className={`px-2 py-1 rounded text-[10px] font-black border uppercase tracking-widest block text-center shadow-sm ${STATUS_COLORS[show.status]}`}>{show.status}</span></td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <button onClick={(e) => handleEdit(show, e)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => handleDelete(show.id, e)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === show.id && (
                        <tr className="bg-slate-950/80 border-l-2 border-indigo-500 animate-in slide-in-from-top-2 duration-300">
                          <td colSpan={7} className="p-6 border-t border-slate-800">
                             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 space-y-6">
                                   <div>
                                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3"><Info className="w-3.5 h-3.5 text-indigo-400" /> Story Concept</h4>
                                      <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">{show.synopsis || "Plot description not available for this entry."}</p>
                                   </div>
                                   <div>
                                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3"><MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Season Critique</h4>
                                      <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-slate-800 pl-4">{show.review || "No personal review has been logged yet."}</p>
                                   </div>
                                </div>
                                <div className="lg:col-span-4 space-y-6 border-l border-slate-800/50 pl-8">
                                   <div>
                                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Resources</h4>
                                      <div className="flex flex-col gap-2">
                                        {show.urls.trailer && (
                                          <a href={normalizeUrl(show.urls.trailer)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 px-3 py-2 bg-red-600/10 border border-red-600/20 rounded-lg text-red-500 hover:bg-red-600/20 transition-all text-xs font-black uppercase tracking-widest">
                                            <Youtube className="w-4 h-4" /> Watch Trailer
                                          </a>
                                        )}
                                        {show.urls.imdb && (
                                          <a href={normalizeUrl(show.urls.imdb)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 px-3 py-2 bg-yellow-600/10 border border-yellow-600/20 rounded-lg text-yellow-500 hover:bg-yellow-600/20 transition-all text-xs font-black uppercase tracking-widest">
                                            <Globe className="w-4 h-4" /> IMDb Entry
                                          </a>
                                        )}
                                      </div>
                                   </div>
                                   <div className="pt-4 border-t border-slate-800/50 grid grid-cols-2 gap-4">
                                      <div>
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter block mb-0.5">Runtime</span>
                                        <span className="text-xs font-bold text-slate-400">{show.avgEpisodeLength}m / eps</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter block mb-0.5">Episodes</span>
                                        <span className="text-xs font-bold text-slate-400">{show.episodeCount} Total</span>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {filteredShows.length === 0 && (
                    <tr><td colSpan={7} className="p-32 text-center text-slate-600 font-black uppercase tracking-widest opacity-20"><Archive className="w-12 h-12 mx-auto mb-4" /> Archive Empty</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : <Stats shows={filteredShows} selectedYear={selectedYear} />}
      </div>
      <ShowModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveShow} initialShow={editingShow} />
    </div>
  );
};

export default App;
