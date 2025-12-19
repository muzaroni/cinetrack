
import React, { useState, useMemo, useEffect } from 'react';
import { TVShowSeason, ShowStatus, ViewType } from './types';
import { getRatingColor, STATUS_COLORS, getNetworkColorClass } from './constants';
import ShowModal from './components/ShowModal';
import Stats from './components/Stats';
import { 
  Plus, Search, LayoutGrid, BarChart3, ChevronDown, ChevronUp, 
  ExternalLink, Youtube, Info, Trash2, Edit2, Calendar, Tv, Ticket, Globe,
  Download, Upload, Archive, ArrowUpDown, ChevronRight, MessageSquare, Layers,
  Link as LinkIcon, Check, AlertTriangle, Database, HardDrive, Server
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
  const [shows, setShows] = useState<TVShowSeason[]>(() => {
    const saved = localStorage.getItem('cinetrack_shows');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse saved shows:", err);
      }
    }
    return []; 
  });
  
  const [dataSource, setDataSource] = useState<'local' | 'server' | 'default'>('default');
  const [view, setView] = useState<ViewType>('grid');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [sortType, setSortType] = useState<SortType>('created-desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<TVShowSeason | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<TVShowSeason[] | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get('data');
      if (dataParam) {
        try {
          const decoded = decodeURIComponent(atob(dataParam).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const parsedData = JSON.parse(decoded);
          if (Array.isArray(parsedData)) {
            setSharedData(parsedData);
            return;
          }
        } catch (err) {
          console.error("Failed to parse shared data from URL", err);
        }
      }

      const saved = localStorage.getItem('cinetrack_shows');
      if (saved && JSON.parse(saved).length > 0) {
        setShows(JSON.parse(saved));
        setDataSource('local');
        return;
      }

      try {
        // Changed to relative path 'data.json' for GitHub Pages compatibility
        const response = await fetch('data.json');
        if (response.ok) {
          const masterData = await response.json();
          if (Array.isArray(masterData)) {
            setShows(masterData);
            setDataSource('server');
            return;
          }
        }
      } catch (e) {
        console.log("No data.json found on server, using defaults.");
      }

      setShows(DEFAULT_SHOWS);
      setDataSource('default');
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (shows.length > 0) {
      localStorage.setItem('cinetrack_shows', JSON.stringify(shows));
      if (dataSource === 'default') setDataSource('local');
    }
  }, [shows]);

  const normalizeUrl = (url?: string): string => {
    if (!url) return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const handleShare = () => {
    try {
      const stringified = JSON.stringify(shows);
      const encoded = btoa(encodeURIComponent(stringified).replace(/%([0-9A-F]{2})/g,
          function(match, p1) {
              return String.fromCharCode(parseInt(p1, 16));
          }));
      
      const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
      navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to generate share link", err);
    }
  };

  const importSharedData = () => {
    if (sharedData) {
      if (confirm(`Import ${sharedData.length} entries from shared link? Your current list will be merged.`)) {
        setShows(prev => {
          const existingIds = new Set(sharedData.map(s => s.id));
          const filteredPrev = prev.filter(p => !existingIds.has(p.id));
          return [...sharedData, ...filteredPrev];
        });
        setSharedData(null);
        window.history.replaceState({}, document.title, window.location.pathname);
        setDataSource('local');
      }
    }
  };

  const exportData = (fileName: string = 'cinetrack_backup.json') => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shows));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
    if (window.confirm('Delete this season?')) {
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
    if (field === 'rating' && sortType.includes('rating')) return sortType === 'rating-desc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />;
    if (field === 'title' && sortType.includes('title')) return sortType === 'title-asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
    if (field === 'season' && sortType.includes('season')) return sortType === 'season-desc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />;
    return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {sharedData && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-indigo-600 p-3 shadow-2xl flex items-center justify-center gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-sm">Shared archive detected ({sharedData.length} shows).</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={importSharedData} className="bg-white text-indigo-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg">Load Archive</button>
            <button onClick={() => { setSharedData(null); window.history.replaceState({}, document.title, window.location.pathname); }} className="text-white/80 hover:text-white px-3 py-1.5 text-xs font-bold">Ignore</button>
          </div>
        </div>
      )}

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
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400" />
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
              <button onClick={() => setView('grid')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                <LayoutGrid className="w-3.5 h-3.5" /><span className="text-xs font-bold">Grid</span>
              </button>
              <button onClick={() => setView('stats')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'stats' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                <BarChart3 className="w-3.5 h-3.5" /><span className="text-xs font-bold">Stats</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl">
               <button onClick={handleShare} className={`p-2 transition-colors ${copySuccess ? 'text-green-500' : 'text-slate-400 hover:text-white'}`} title="Copy Share Link">
                 {copySuccess ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
               </button>
               <button onClick={() => exportData('data.json')} className="p-2 text-slate-400 hover:text-indigo-400 transition-colors" title="Download Master (data.json)">
                 <Server className="w-4 h-4" />
               </button>
               <button onClick={() => exportData()} className="p-2 text-slate-400 hover:text-white transition-colors" title="Export Backup">
                 <Download className="w-4 h-4" />
               </button>
            </div>

            <button onClick={() => { setEditingShow(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-sm whitespace-nowrap">
              <Plus className="w-4 h-4" /> Add Season
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto mb-12 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setSelectedYear('All')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedYear === 'All' ? 'bg-white text-slate-950 border-white shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>All Time</button>
        {availableYears.map(year => (
          <button key={year} onClick={() => setSelectedYear(year)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedYear === year ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>{year}</button>
        ))}
        
        <div className="ml-auto flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest px-4 border-l border-slate-800 h-10">
           <div className="flex items-center gap-2">
             <Archive className="w-3.5 h-3.5" />
             {selectedYear === 'All' ? 'Archive' : `${selectedYear}`}
           </div>
           <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
             {dataSource === 'local' ? <HardDrive className="w-3 h-3 text-emerald-500" /> : dataSource === 'server' ? <Server className="w-3 h-3 text-indigo-400" /> : <Database className="w-3 h-3 text-slate-600" />}
             <span className={dataSource === 'local' ? 'text-emerald-500' : dataSource === 'server' ? 'text-indigo-400' : 'text-slate-600'}>
               {dataSource === 'local' ? 'Personal Edit' : dataSource === 'server' ? 'Master List' : 'Default'}
             </span>
           </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto">
        {view === 'grid' ? (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    <th className={`px-5 py-3 text-xs font-black uppercase tracking-widest w-[28%] cursor-pointer group ${sortType.includes('title') ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => handleColumnSort('title')}>
                      <div className="flex items-center gap-2">Title & Genres {renderSortIcon('title')}</div>
                    </th>
                    <th className={`px-5 py-3 text-xs font-black uppercase tracking-widest w-[6%] text-center cursor-pointer group ${sortType.includes('season') ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => handleColumnSort('season')}>
                      <div className="flex items-center justify-center gap-2">Season {renderSortIcon('season')}</div>
                    </th>
                    <th className={`px-5 py-3 text-xs font-black uppercase tracking-widest w-[15%] cursor-pointer group ${sortType.includes('rating') ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => handleColumnSort('rating')}>
                      <div className="flex items-center gap-2">User Rating {renderSortIcon('rating')}</div>
                    </th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[18%]">Aggregates</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[12%]">Network</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[13%]">Status</th>
                    <th className="px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest w-[4%] text-center">Trailer</th>
                    <th className="px-5 py-3 w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredShows.map(show => {
                    const validRatings = [
                      show.aggregateRatings.imdb && show.urls.imdb && { label: 'IMDb', value: show.aggregateRatings.imdb, url: show.urls.imdb, color: 'text-yellow-500' },
                      show.aggregateRatings.rottenTomatoes && show.urls.rottenTomatoes && { label: 'RT', value: show.aggregateRatings.rottenTomatoes + '%', url: show.urls.rottenTomatoes, color: 'text-red-500' },
                      show.aggregateRatings.metacritic && show.urls.metacritic && { label: 'Meta', value: show.aggregateRatings.metacritic, url: show.urls.metacritic, color: 'text-green-500' },
                    ].filter(Boolean) as any[];

                    return (
                      <React.Fragment key={show.id}>
                        <tr onClick={() => setExpandedId(expandedId === show.id ? null : show.id)} className={`hover:bg-slate-800/40 cursor-pointer group/row ${expandedId === show.id ? 'bg-indigo-500/10' : ''}`}>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-4 min-w-0">
                              {expandedId === show.id ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                              <div className="min-w-0">
                                <div className="font-bold text-white text-xl truncate leading-tight tracking-tight">{show.title}</div>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {show.genres.slice(0, 3).map(g => <span key={g} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold">{g}</span>)}
                                </div>
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
                          <td className="px-5 py-2.5"><div className="grid grid-cols-2 gap-x-2 gap-y-1 text-lg font-black">{validRatings.map((r, i) => <a key={i} href={normalizeUrl(r.url)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="hover:underline truncate"><span className="text-slate-500">{r.label}: </span><span className={r.color}>{r.value}</span></a>)}</div></td>
                          <td className="px-5 py-2.5 truncate"><span className={`font-black text-xl ${getNetworkColorClass(show.network)}`}>{show.network}</span></td>
                          <td className="px-5 py-2.5"><span className={`px-2 py-1 rounded text-[11px] font-black border uppercase tracking-widest block text-center ${STATUS_COLORS[show.status]}`}>{show.status}</span></td>
                          <td className="px-5 py-2.5 text-center">{show.urls.trailer ? <a href={normalizeUrl(show.urls.trailer)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-red-600 hover:text-red-500"><Youtube className="w-7 h-7 mx-auto" /></a> : '—'}</td>
                          <td className="px-5 py-2.5 text-right"><div className="flex flex-col items-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity"><button onClick={e => handleEdit(show, e)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={e => handleDelete(show.id, e)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td>
                        </tr>
                        {expandedId === show.id && (
                          <tr className="bg-slate-950/50"><td colSpan={8} className="p-6 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                              <div className="space-y-2"><h4 className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><Info className="w-3.5 h-3.5 text-indigo-400" /> Synopsis</h4><p className="text-slate-300 text-sm leading-relaxed italic">{show.synopsis || "No synopsis."}</p></div>
                              <div className="space-y-2"><h4 className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Thoughts</h4><p className="text-slate-300 text-sm">{show.review || "No review yet."}</p></div>
                            </div>
                            <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-slate-900 text-xs font-bold text-slate-400">
                              <div className="flex flex-col"><span className="text-[9px] text-slate-600 uppercase">Network</span><span className={getNetworkColorClass(show.network)}>{show.network}</span></div>
                              <div className="flex flex-col"><span className="text-[9px] text-slate-600 uppercase">Schedule</span><span>{show.startDate || 'TBA'} {show.endDate ? `— ${show.endDate}` : ''}</span></div>
                              <div className="flex flex-col"><span className="text-[9px] text-slate-600 uppercase">Genres</span><span>{show.genres.join(', ')}</span></div>
                              <div className="ml-auto flex gap-2">
                                {show.urls.imdb && <a href={normalizeUrl(show.urls.imdb)} target="_blank" rel="noreferrer" className="p-2 bg-slate-900 rounded-lg hover:text-yellow-500"><Globe className="w-3.5 h-3.5" /></a>}
                                {show.urls.rottenTomatoes && <a href={normalizeUrl(show.urls.rottenTomatoes)} target="_blank" rel="noreferrer" className="p-2 bg-slate-900 rounded-lg hover:text-red-500"><Ticket className="w-3.5 h-3.5" /></a>}
                              </div>
                            </div>
                          </td></tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : <Stats shows={filteredShows} isFiltered={selectedYear !== 'All'} selectedYear={selectedYear} />}
      </div>

      <ShowModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveShow} initialShow={editingShow} />
    </div>
  );
};

export default App;
