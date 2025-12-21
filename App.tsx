
import React, { useState, useMemo, useEffect } from 'react';
import { TVShowSeason, ShowStatus, ViewType } from './types';
import { getRatingColor, STATUS_COLORS, getNetworkColorClass } from './constants';
import ShowModal from './components/ShowModal';
import Stats from './components/Stats';
import { subscribeToShows, saveShowToCloud, deleteShowFromCloud, isFirebaseConnected } from './services/firebaseService';
import { 
  Plus, Search, LayoutGrid, BarChart3, ChevronDown, ChevronUp, 
  Youtube, Info, Trash2, Edit2, Globe, Ticket,
  Download, Upload, Archive, ArrowUpDown, MessageSquare, Loader2, Cloud, AlertTriangle, X
} from 'lucide-react';

type SortType = 
  | 'created-desc' 
  | 'rating-desc' | 'rating-asc' 
  | 'title-asc' | 'title-desc' 
  | 'season-desc' | 'season-asc' 
  | 'date-desc';

const App: React.FC = () => {
  const [shows, setShows] = useState<TVShowSeason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewType>(() => (localStorage.getItem('cinetrack_view') as ViewType) || 'grid');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [sortType, setSortType] = useState<SortType>('created-desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<TVShowSeason | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfigWarning, setShowConfigWarning] = useState(!isFirebaseConnected);

  useEffect(() => {
    localStorage.setItem('cinetrack_view', view);
  }, [view]);

  // Subscribe to Firebase Cloud Store
  useEffect(() => {
    if (!isFirebaseConnected) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToShows((cloudShows) => {
      setShows(cloudShows);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
        default: return b.createdAt - a.createdAt;
      }
    });

    return result;
  }, [shows, searchQuery, selectedYear, sortType]);

  const handleSaveShow = async (newShow: TVShowSeason) => {
    if (!isFirebaseConnected) {
      alert("Application is in Offline Mode. Sync is disabled until Firebase variables are configured.");
      return;
    }
    try {
      await saveShowToCloud(newShow);
      setIsModalOpen(false);
      setEditingShow(null);
    } catch (err) {
      alert("Failed to sync with cloud. Check your connection.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFirebaseConnected) {
      alert("Offline Mode: Deletion disabled.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this season? This will be removed from the cloud archive.')) {
      try {
        await deleteShowFromCloud(id);
        if (expandedId === id) setExpandedId(null);
      } catch (err) {
        alert("Failed to delete from cloud.");
      }
    }
  };

  const handleEdit = (show: TVShowSeason, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShow(show);
    setIsModalOpen(true);
  };

  const handleColumnSort = (field: 'rating' | 'title' | 'season') => {
    if (field === 'rating') setSortType(sortType === 'rating-desc' ? 'rating-asc' : 'rating-desc');
    else if (field === 'title') setSortType(sortType === 'title-asc' ? 'title-desc' : 'title-asc');
    else if (field === 'season') setSortType(sortType === 'season-desc' ? 'season-asc' : 'season-desc');
  };

  const renderSortIcon = (field: 'rating' | 'title' | 'season') => {
    if (field === 'rating' && sortType.includes('rating')) return sortType === 'rating-desc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />;
    if (field === 'title' && sortType.includes('title')) return sortType === 'title-asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
    if (field === 'season' && sortType.includes('season')) return sortType === 'season-desc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />;
    return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />;
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shows));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `cinetrack_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <div className="flex items-center gap-2 font-bold uppercase tracking-[0.2em] text-xs">
           <Cloud className="w-4 h-4" /> Connecting to CineTrack Cloud...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {showConfigWarning && (
        <div className="max-w-[1800px] mx-auto mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-amber-500 text-sm">Offline Mode: Missing Firebase Configuration</h3>
              <p className="text-amber-500/60 text-xs">Sync and cloud storage are currently disabled. Add your Firebase environment variables to enable cloud features.</p>
            </div>
          </div>
          <button onClick={() => setShowConfigWarning(false)} className="p-2 text-amber-500/40 hover:text-amber-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Container */}
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
            <Archive className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none mb-1">CineTrack</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest flex items-center gap-1.5">
              {isFirebaseConnected ? (
                <><Cloud className="w-3 h-3 text-emerald-500" /> Firebase Sync Active</>
              ) : (
                <><AlertTriangle className="w-3 h-3 text-amber-500" /> Offline Mode</>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:max-w-5xl">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search series, network, or status..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl">
              <button onClick={() => setView('grid')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
              <button onClick={() => setView('stats')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'stats' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><BarChart3 className="w-3.5 h-3.5" /></button>
            </div>

            <button onClick={exportData} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors" title="Export JSON"><Download className="w-4 h-4" /></button>

            <button 
              onClick={() => { setEditingShow(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Season
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto mb-12 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setSelectedYear('All')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedYear === 'All' ? 'bg-white text-slate-950 border-white shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>All Time</button>
        {availableYears.map(year => (
          <button key={year} onClick={() => setSelectedYear(year)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedYear === year ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>{year}</button>
        ))}
      </div>

      <div className="max-w-[1800px] mx-auto">
        {view === 'grid' ? (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-widest w-[28%] cursor-pointer group text-slate-500" onClick={() => handleColumnSort('title')}>
                      <div className="flex items-center gap-2">Title & Genres {renderSortIcon('title')}</div>
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-widest w-[6%] text-center cursor-pointer group text-slate-500" onClick={() => handleColumnSort('season')}>
                      <div className="flex items-center justify-center gap-2">Ssn {renderSortIcon('season')}</div>
                    </th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-widest w-[15%] cursor-pointer group text-slate-500" onClick={() => handleColumnSort('rating')}>
                      <div className="flex items-center gap-2">User Rating {renderSortIcon('rating')}</div>
                    </th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[18%]">Aggregates</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[12%]">Network</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[13%]">Status</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[4%] text-center">Trailer</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredShows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-500 italic">
                        No seasons found. Click 'Add Season' to get started.
                      </td>
                    </tr>
                  )}
                  {filteredShows.map(show => {
                    const validRatings = [
                      show.aggregateRatings.imdb && show.urls.imdb && { label: 'IMDb', value: show.aggregateRatings.imdb, url: show.urls.imdb, color: 'text-yellow-500' },
                      show.aggregateRatings.rottenTomatoes && show.urls.rottenTomatoes && { label: 'RT', value: show.aggregateRatings.rottenTomatoes + '%', url: show.urls.rottenTomatoes, color: 'text-red-500' },
                      show.aggregateRatings.metacritic && show.urls.metacritic && { label: 'Meta', value: show.aggregateRatings.metacritic, url: show.urls.metacritic, color: 'text-green-500' },
                      show.aggregateRatings.myanimelist && show.urls.myanimelist && { label: 'MAL', value: show.aggregateRatings.myanimelist, url: show.urls.myanimelist, color: 'text-blue-400' },
                    ].filter(Boolean) as any[];

                    return (
                      <React.Fragment key={show.id}>
                        <tr onClick={() => setExpandedId(expandedId === show.id ? null : show.id)} className={`hover:bg-slate-800/40 cursor-pointer group/row transition-all ${expandedId === show.id ? 'bg-indigo-500/10' : ''}`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-4">
                              {expandedId === show.id ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                              <div className="truncate">
                                <div className="font-bold text-white text-lg truncate tracking-tight">{show.title}</div>
                                <div className="flex gap-1 mt-1">
                                  {show.genres.slice(0, 2).map(g => <span key={g} className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">{g}</span>)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center"><span className="text-sm font-black text-slate-200">{show.seasonNumber}</span></td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shrink-0 border" style={{ backgroundColor: getRatingColor(show.userRating) + '10', color: getRatingColor(show.userRating), borderColor: getRatingColor(show.userRating) + '30' }}>{show.userRating.toFixed(1)}</div>
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${(show.userRating / 5) * 100}%`, backgroundColor: getRatingColor(show.userRating) }} /></div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                             <div className="grid grid-cols-2 gap-x-2 text-sm font-black tracking-tight">
                                {validRatings.map((rating, idx) => (
                                  <a key={idx} href={normalizeUrl(rating.url)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="hover:underline truncate">
                                    <span className="text-slate-500">{rating.label}: </span><span className={rating.color}>{rating.value}</span>
                                  </a>
                                ))}
                             </div>
                          </td>
                          <td className="px-5 py-3 truncate"><span className={`font-black text-lg ${getNetworkColorClass(show.network)}`}>{show.network}</span></td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-widest block text-center ${STATUS_COLORS[show.status]}`}>{show.status}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {show.urls.trailer ? <a href={normalizeUrl(show.urls.trailer)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-red-600 hover:text-red-500 inline-block"><Youtube className="w-6 h-6" /></a> : '—'}
                          </td>
                          <td className="px-5 py-3 text-right">
                             <div className="flex gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button onClick={(e) => handleEdit(show, e)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => handleDelete(show.id, e)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                             </div>
                          </td>
                        </tr>
                        {expandedId === show.id && (
                          <tr className="bg-slate-950/50 border-t border-slate-800">
                            <td colSpan={8} className="p-6">
                               <div className="grid grid-cols-2 gap-8">
                                  <div>
                                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Info className="w-3 h-3 text-indigo-400" /> Synopsis</h4>
                                     <p className="text-slate-300 text-sm leading-relaxed italic">{show.synopsis || "No synopsis available."}</p>
                                  </div>
                                  <div>
                                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><MessageSquare className="w-3 h-3 text-emerald-400" /> Review</h4>
                                     <p className="text-slate-300 text-sm leading-relaxed">{show.review || "No personal thoughts archived."}</p>
                                  </div>
                               </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Stats shows={filteredShows} selectedYear={selectedYear} />
        )}
      </div>

      <ShowModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingShow(null); }} onSave={handleSaveShow} initialShow={editingShow} />
    </div>
  );
};

export default App;
