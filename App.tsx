import React, { useState, useMemo, useEffect } from 'react';
import { TVShowSeason, ShowStatus, ViewType } from './types';
import { getRatingColor, STATUS_COLORS, getNetworkColorClass } from './constants';
import ShowModal from './components/ShowModal';
import Stats from './components/Stats';
import { 
  Plus, Search, LayoutGrid, BarChart3, ChevronDown, ChevronUp, 
  ExternalLink, Youtube, Info, Trash2, Edit2, Calendar, Tv, Ticket, Globe,
  Download, Upload, Archive, ArrowUpDown, ChevronRight, MessageSquare, Layers
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

      // If no local storage, attempt to fetch from shows.json
      try {
        const response = await fetch('./shows.json');
        if (response.ok) {
          const data = await response.json();
          setShows(data);
        } else {
          setShows(DEFAULT_SHOWS);
        }
      } catch (err) {
        console.warn("No shows.json found, using defaults.");
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
        case 'rating-desc':
          return b.userRating - a.userRating;
        case 'rating-asc':
          return a.userRating - b.userRating;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'season-desc':
          return b.seasonNumber - a.seasonNumber;
        case 'season-asc':
          return a.seasonNumber - b.seasonNumber;
        case 'date-desc':
          const dateA = a.startDate || '';
          const dateB = b.startDate || '';
          return dateB.localeCompare(dateA);
        case 'created-desc':
        default:
          return b.createdAt - a.createdAt;
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
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this season? This action cannot be undone.')) {
      setShows(prev => prev.filter(s => s.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  const handleEdit = (show: TVShowSeason, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingShow(show);
    setIsModalOpen(true);
  };

  const handleColumnSort = (field: 'rating' | 'title' | 'season') => {
    if (field === 'rating') {
      setSortType(sortType === 'rating-desc' ? 'rating-asc' : 'rating-desc');
    } else if (field === 'title') {
      setSortType(sortType === 'title-asc' ? 'title-desc' : 'title-asc');
    } else if (field === 'season') {
      setSortType(sortType === 'season-desc' ? 'season-asc' : 'season-desc');
    }
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
    return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />;
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
            if (confirm(`Import ${content.length} entries? This will merge with your current list.`)) {
              setShows(prev => [...content, ...prev.filter(p => !content.find(c => c.id === p.id))]);
            }
          }
        } catch (err) {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Tv className="w-12 h-12 text-indigo-500 animate-pulse" />
          <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Opening Vault...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none mb-1">CineTrack</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Season Archive</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:max-w-5xl">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search series, network, or status..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-inner font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative group/sort">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 shadow-xl focus-within:ring-2 focus-within:ring-indigo-600 transition-all">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <select 
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  className="bg-slate-900 border-none outline-none text-xs font-bold text-slate-200 cursor-pointer appearance-none pr-4"
                >
                  <option value="created-desc">Recently Added</option>
                  <option value="rating-desc">Highest Rated</option>
                  <option value="rating-asc">Lowest Rated</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="season-desc">Season Number (High)</option>
                  <option value="season-asc">Season Number (Low)</option>
                  <option value="date-desc">Release Date</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 pointer-events-none text-slate-500" />
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl">
              <button onClick={() => setView('grid')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Grid</span>
              </button>
              <button onClick={() => setView('stats')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'stats' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Stats</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl">
               <button onClick={exportData} className="p-2 text-slate-400 hover:text-white transition-colors" title="Export as shows.json">
                 <Download className="w-4 h-4" />
               </button>
               <label className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer" title="Import JSON">
                 <Upload className="w-4 h-4" />
                 <input type="file" className="hidden" accept=".json" onChange={importData} />
               </label>
            </div>

            <button 
              onClick={() => { setEditingShow(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Season
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto mb-12 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setSelectedYear('All')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedYear === 'All' ? 'bg-white text-slate-950 border-white shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>All Time</button>
        {availableYears.map(year => (
          <button key={year} onClick={() => setSelectedYear(year)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedYear === year ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>{year}</button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest px-4 border-l border-slate-800">
           <Archive className="w-3.5 h-3.5" />
           {selectedYear === 'All' ? 'Full Archive' : `${selectedYear} View`}
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto">
        {view === 'grid' ? (
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className={`px-5 py-3 text-xs font-black uppercase tracking-widest w-[28%] cursor-pointer select-none group transition-colors ${sortType.includes('title') ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => handleColumnSort('title')}>
                        <div className="flex items-center gap-2">Title & Genres {renderSortIcon('title')}</div>
                      </th>
                      <th className={`px-5 py-3 text-xs font-black uppercase tracking-widest w-[6%] text-center cursor-pointer select-none group transition-colors ${sortType.includes('season') ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => handleColumnSort('season')}>
                        <div className="flex items-center justify-center gap-2">Season {renderSortIcon('season')}</div>
                      </th>
                      <th className={`px-5 py-3 text-xs font-black uppercase tracking-widest w-[15%] cursor-pointer select-none group transition-colors ${sortType.includes('rating') ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => handleColumnSort('rating')}>
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
                    {filteredShows.map(show => {
                      const validRatings = [
                        show.aggregateRatings.imdb && show.urls.imdb && { label: 'IMDb', value: show.aggregateRatings.imdb, url: show.urls.imdb, color: 'text-yellow-500' },
                        show.aggregateRatings.rottenTomatoes && show.urls.rottenTomatoes && { label: 'RT', value: show.aggregateRatings.rottenTomatoes + '%', url: show.urls.rottenTomatoes, color: 'text-red-500' },
                        show.aggregateRatings.metacritic && show.urls.metacritic && { label: 'Meta', value: show.aggregateRatings.metacritic, url: show.urls.metacritic, color: 'text-green-500' },
                        show.aggregateRatings.myanimelist && show.urls.myanimelist && { label: 'MAL', value: show.aggregateRatings.myanimelist, url: show.urls.myanimelist, color: 'text-blue-400' },
                      ].filter(Boolean) as { label: string; value: string | number; url: string; color: string }[];

                      return (
                        <React.Fragment key={show.id}>
                          <tr onClick={() => setExpandedId(expandedId === show.id ? null : show.id)} className={`hover:bg-slate-800/40 transition-colors cursor-pointer group/row ${expandedId === show.id ? 'bg-indigo-500/10' : ''}`}>
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-4">
                                {expandedId === show.id ? <ChevronUp className="w-6 h-6 text-indigo-400 shrink-0" /> : <ChevronDown className="w-6 h-6 text-slate-600 group-hover/row:text-slate-400 shrink-0" />}
                                <div className="min-w-0">
                                  <div className="font-bold text-white text-xl truncate leading-tight mb-1 tracking-tight">{show.title}</div>
                                  <div className="flex flex-wrap gap-1.5">{show.genres.slice(0, 3).map(g => (<span key={g} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold whitespace-nowrap">{g}</span>))}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-center"><span className="bg-slate-800 px-3 py-1.5 rounded-full text-sm font-black text-slate-200">{show.seasonNumber}</span></td>
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0" style={{ backgroundColor: getRatingColor(show.userRating) + '20', color: getRatingColor(show.userRating), border: `1px solid ${getRatingColor(show.userRating)}40` }}>{show.userRating.toFixed(1)}</div>
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full transition-all duration-700" style={{ width: `${(show.userRating / 5) * 100}%`, backgroundColor: getRatingColor(show.userRating) }} /></div>
                              </div>
                            </td>
                            <td className="px-5 py-2.5">
                               <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-lg font-black tracking-tight">
                                  {validRatings.map((rating, idx) => (<a key={idx} href={normalizeUrl(rating.url)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="hover:underline truncate"><span className="text-slate-500">{rating.label}: </span><span className={rating.color}>{rating.value}</span></a>))}
                               </div>
                            </td>
                            <td className="px-5 py-2.5 truncate"><span className={`font-black text-xl transition-colors ${getNetworkColorClass(show.network)}`}>{show.network}</span></td>
                            <td className="px-5 py-2.5"><span className={`px-2 py-1 rounded text-[11px] font-black border uppercase tracking-widest block text-center ${STATUS_COLORS[show.status]}`}>{show.status}</span></td>
                            <td className="px-5 py-2.5 text-center">
                              <div className="flex items-center justify-center">{show.urls.trailer ? (<a href={normalizeUrl(show.urls.trailer)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-red-600 hover:text-red-500 transition-colors inline-block"><Youtube className="w-7 h-7" /></a>) : <span className="text-slate-800">—</span>}</div>
                            </td>
                            <td className="px-5 py-2.5 text-right">
                              <div className="flex flex-col items-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button onClick={(e) => handleEdit(show, e)} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded-lg shadow-sm" title="Edit Season"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={(e) => handleDelete(show.id, e)} className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-slate-800 hover:bg-red-950/30 rounded-lg shadow-sm" title="Delete Entry"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                          {expandedId === show.id && (
                            <tr className="bg-slate-950 shadow-inner">
                              <td colSpan={8} className="p-0 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-200">
                                 <div className="p-6">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-6">
                                      <div className="space-y-3">
                                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Info className="w-3.5 h-3.5 text-indigo-400" /> Season Synopsis</h4>
                                         <p className="text-slate-300 text-sm leading-relaxed line-clamp-4 italic">{show.synopsis || "No synopsis available."}</p>
                                      </div>
                                      <div className="space-y-3">
                                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Personal Thoughts</h4>
                                         <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">{show.review || "No personal review written yet."}</p>
                                      </div>
                                   </div>
                                   <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-slate-900">
                                      <div className="flex items-center gap-5">
                                         <div className="flex flex-col"><span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Network</span><span className={`text-xs font-bold ${getNetworkColorClass(show.network)}`}>{show.network}</span></div>
                                         <div className="flex flex-col"><span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Status</span><div className="flex items-center gap-1.5 mt-0.5"><div className={`w-1.5 h-1.5 rounded-full ${show.isOngoing ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} /><span className="text-xs font-bold text-slate-300">{show.isOngoing ? 'Ongoing' : 'Ended'}</span></div></div>
                                         <div className="flex flex-col"><span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Schedule</span><span className="text-xs font-bold text-slate-300">{show.startDate || 'TBA'} {show.endDate ? `— ${show.endDate}` : ''}</span></div>
                                         <div className="flex flex-col"><span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Genres</span><span className="text-xs font-bold text-slate-300">{show.genres.slice(0, 4).join(', ')}</span></div>
                                      </div>
                                      <div className="ml-auto flex items-center gap-2">
                                         {show.urls.imdb && (<a href={normalizeUrl(show.urls.imdb)} target="_blank" rel="noreferrer" className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-yellow-500/50 transition-all text-slate-400 hover:text-yellow-500" title="IMDb"><Globe className="w-3.5 h-3.5" /></a>)}
                                         {show.urls.rottenTomatoes && (<a href={normalizeUrl(show.urls.rottenTomatoes)} target="_blank" rel="noreferrer" className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-red-500/50 transition-all text-slate-400 hover:text-red-500" title="Rotten Tomatoes"><Ticket className="w-3.5 h-3.5" /></a>)}
                                         {show.urls.trailer && (<a href={normalizeUrl(show.urls.trailer)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 border border-red-600/20 rounded-lg text-red-500 hover:bg-red-600/20 transition-all text-[10px] font-black uppercase tracking-widest"><Youtube className="w-3.5 h-3.5" /> Watch Trailer</a>)}
                                      </div>
                                   </div>
                                 </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {filteredShows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-32 text-center text-slate-600">
                           <Archive className="w-16 h-16 mx-auto mb-8 opacity-10" />
                           <p className="text-2xl font-black text-slate-500 tracking-tight">Nothing in the {selectedYear === 'All' ? 'archive' : selectedYear} vault</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <Stats shows={filteredShows} isFiltered={selectedYear !== 'All'} selectedYear={selectedYear} />
        )}
      </div>

      <ShowModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveShow} initialShow={editingShow} />
    </div>
  );
};

export default App;