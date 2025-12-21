import React, { useState, useMemo, useEffect } from 'react';
import { TVShowSeason, ShowStatus, ViewType } from './types';
import { getRatingColor, STATUS_COLORS, getNetworkColorClass } from './constants';
import ShowModal from './components/ShowModal';
import Stats from './components/Stats';
import { 
  Plus, Search, LayoutGrid, BarChart3, ChevronDown, ChevronUp, 
  Youtube, Info, Trash2, Edit2, Tv, Globe,
  Download, Upload, ArrowUpDown, MessageSquare, Link as LinkIcon
} from 'lucide-react';

type SortType = 
  | 'created-desc' 
  | 'rating-desc' | 'rating-asc' 
  | 'title-asc' | 'title-desc' 
  | 'season-desc' | 'season-asc' 
  | 'date-desc';

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
  },
  {
    id: 'default-2',
    title: 'Succession',
    seasonNumber: 4,
    network: 'HBO',
    genres: ['Drama', 'Satire'],
    userRating: 5.0,
    aggregateRatings: { imdb: 8.9, metacritic: 92, rottenTomatoes: 97 },
    urls: { 
      imdb: 'https://www.imdb.com/title/tt7632684/',
      rottenTomatoes: 'https://www.rottentomatoes.com/tv/succession/s04',
      trailer: 'https://www.youtube.com/watch?v=t3DREm9uL8E'
    },
    status: ShowStatus.COMPLETED,
    review: "The perfect ending to a near-perfect show. The writing is sharp, cruel, and hilarious.",
    synopsis: "The sale of media conglomerate Waystar Royco to tech visionary Lukas Matsson moves ever closer.",
    isOngoing: false,
    endDate: '2024-05-28',
    createdAt: Date.now() - 2000
  }
];

const App: React.FC = () => {
  const [shows, setShows] = useState<TVShowSeason[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [view, setView] = useState<ViewType>('grid');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [sortType, setSortType] = useState<SortType>('created-desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<TVShowSeason | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleColumnSort = (field: 'rating' | 'title' | 'season') => {
    if (field === 'rating') setSortType(sortType === 'rating-desc' ? 'rating-asc' : 'rating-desc');
    else if (field === 'title') setSortType(sortType === 'title-asc' ? 'title-desc' : 'title-asc');
    else if (field === 'season') setSortType(sortType === 'season-desc' ? 'season-asc' : 'season-desc');
  };

  const renderSortIcon = (field: 'rating' | 'title' | 'season') => {
    if (field === 'rating') {
      if (sortType === 'rating-desc') return <ChevronDown className="w-3.5 h-3.5" />;
      if (sortType === 'rating-asc') return <ChevronUp className="w-3.5 h-3.5" />;
    } else if (field === 'title') {
      if (sortType === 'title-asc') return <ChevronUp className="w-3.5 h-3.5" />;
      if (sortType === 'title-desc') return <ChevronDown className="w-3.5 h-3.5" />;
    } else if (field === 'season') {
      if (sortType === 'season-desc') return <ChevronDown className="w-3.5 h-3.5" />;
      if (sortType === 'season-asc') return <ChevronUp className="w-3.5 h-3.5" />;
    }
    return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shows, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `shows.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          if (Array.isArray(content)) {
            if (confirm(`Import ${content.length} entries?`)) {
              setShows(prev => [...content, ...prev.filter(p => !content.find(c => c.id === p.id))]);
            }
          }
        } catch (err) {
          alert('Invalid JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isDataLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20"><Tv className="w-8 h-8 text-white" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none mb-1">CineTrack</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Season Archive</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:max-w-5xl">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
            <input type="text" placeholder="Search series, network, or status..." className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative group/sort">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 shadow-xl focus-within:ring-2 focus-within:ring-indigo-600">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <select value={sortType} onChange={(e) => setSortType(e.target.value as SortType)} className="bg-slate-900 border-none outline-none text-xs font-bold text-slate-200 cursor-pointer appearance-none pr-4">
                  <option value="created-desc">Recently Added</option>
                  <option value="rating-desc">Highest Rated</option>
                  <option value="rating-asc">Lowest Rated</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="season-desc">Season (High)</option>
                  <option value="season-asc">Season (Low)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl">
              <button onClick={() => setView('grid')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
              <button onClick={() => setView('stats')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'stats' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}><BarChart3 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl">
               <button onClick={exportData} className="p-2 text-slate-400 hover:text-white transition-colors" title="Export JSON"><Download className="w-4 h-4" /></button>
               <label className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer" title="Import JSON"><Upload className="w-4 h-4" /><input type="file" className="hidden" accept=".json" onChange={importData} /></label>
            </div>
            <button onClick={() => { setEditingShow(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-sm whitespace-nowrap"><Plus className="w-4 h-4" /> Add Season</button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto mb-12 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setSelectedYear('All')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border ${selectedYear === 'All' ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>All Time</button>
        {availableYears.map(year => (
          <button key={year} onClick={() => setSelectedYear(year)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border ${selectedYear === year ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>{year}</button>
        ))}
      </div>

      <div className="max-w-[1800px] mx-auto">
        {view === 'grid' ? (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-widest w-[28%] cursor-pointer group" onClick={() => handleColumnSort('title')}><div className="flex items-center gap-2">Title & Genres {renderSortIcon('title')}</div></th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-widest w-[6%] text-center cursor-pointer" onClick={() => handleColumnSort('season')}><div className="flex items-center justify-center gap-2">Ssn {renderSortIcon('season')}</div></th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-widest w-[15%] cursor-pointer" onClick={() => handleColumnSort('rating')}><div className="flex items-center gap-2">Rating {renderSortIcon('rating')}</div></th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[18%]">Aggregates</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[12%]">Network</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[13%]">Status</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[4%] text-center">Trailer</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredShows.map(show => (
                    <React.Fragment key={show.id}>
                      <tr onClick={() => setExpandedId(expandedId === show.id ? null : show.id)} className={`hover:bg-slate-800/40 transition-colors cursor-pointer group/row ${expandedId === show.id ? 'bg-indigo-500/10' : ''}`}>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-4">
                            {expandedId === show.id ? <ChevronUp className="w-6 h-6 text-indigo-400 shrink-0" /> : <ChevronDown className="w-6 h-6 text-slate-600 group-hover/row:text-slate-400 shrink-0" />}
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xl truncate leading-tight tracking-tight">{show.title}</div>
                              <div className="flex flex-wrap gap-1.5 mt-1">{show.genres.slice(0, 2).map(g => (<span key={g} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold whitespace-nowrap">{g}</span>))}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-center"><span className="bg-slate-800 px-3 py-1.5 rounded-full text-sm font-black text-slate-200">{show.seasonNumber}</span></td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0" style={{ backgroundColor: getRatingColor(show.userRating) + '20', color: getRatingColor(show.userRating), border: `1px solid ${getRatingColor(show.userRating)}40` }}>{show.userRating.toFixed(1)}</div>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full" style={{ width: `${(show.userRating / 5) * 100}%`, backgroundColor: getRatingColor(show.userRating) }} /></div>
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                           <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm font-black">
                              {show.aggregateRatings.imdb && <div className="truncate"><span className="text-slate-500">IMDb: </span><span className="text-yellow-500">{show.aggregateRatings.imdb}</span></div>}
                              {show.aggregateRatings.rottenTomatoes && <div className="truncate"><span className="text-slate-500">RT: </span><span className="text-red-500">{show.aggregateRatings.rottenTomatoes}%</span></div>}
                           </div>
                        </td>
                        <td className="px-5 py-2.5 truncate font-black text-lg transition-colors"><span className={getNetworkColorClass(show.network)}>{show.network}</span></td>
                        <td className="px-5 py-2.5"><span className={`px-2 py-1 rounded text-[10px] font-black border uppercase tracking-widest block text-center ${STATUS_COLORS[show.status]}`}>{show.status}</span></td>
                        <td className="px-5 py-2.5 text-center">
                          {show.urls.trailer ? (<a href={normalizeUrl(show.urls.trailer)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-red-600 hover:text-red-500"><Youtube className="w-7 h-7 mx-auto" /></a>) : <span className="text-slate-800">—</span>}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex flex-col items-end gap-2 opacity-0 group-hover/row:opacity-100">
                            <button onClick={(e) => handleEdit(show, e)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => handleDelete(show.id, e)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === show.id && (
                        <tr className="bg-slate-950/50">
                          <td colSpan={8} className="p-6 border-t border-slate-800">
                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                   <div>
                                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Info className="w-3.5 h-3.5 text-indigo-400" /> Synopsis</h4>
                                      <p className="text-slate-300 text-sm leading-relaxed">{show.synopsis || "No synopsis available."}</p>
                                   </div>
                                   <div>
                                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> My Review</h4>
                                      <p className="text-slate-300 text-sm leading-relaxed italic">{show.review || "No review yet."}</p>
                                   </div>
                                </div>
                                <div className="space-y-6">
                                   {show.groundingLinks && show.groundingLinks.length > 0 && (
                                     <div>
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3"><LinkIcon className="w-3.5 h-3.5 text-blue-400" /> Verified Sources</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                           {show.groundingLinks.map((link, idx) => (
                                              <a key={idx} href={link.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-indigo-500 transition-all group/link">
                                                 <Globe className="w-4 h-4 text-slate-600 group-hover/link:text-indigo-400 shrink-0" />
                                                 <span className="text-xs font-bold text-slate-400 group-hover/link:text-slate-200 truncate">{link.title}</span>
                                              </a>
                                           ))}
                                        </div>
                                     </div>
                                   )}
                                   <div className="flex flex-wrap gap-2">
                                      {show.urls.imdb && <a href={normalizeUrl(show.urls.imdb)} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-yellow-600/10 border border-yellow-600/20 text-yellow-500 rounded text-[10px] font-black uppercase tracking-tighter">IMDb</a>}
                                      {show.urls.rottenTomatoes && <a href={normalizeUrl(show.urls.rottenTomatoes)} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-red-600/10 border border-red-600/20 text-red-500 rounded text-[10px] font-black uppercase tracking-tighter">Rotten Tomatoes</a>}
                                   </div>
                                </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
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