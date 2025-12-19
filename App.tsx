
import React, { useState, useMemo, useEffect } from 'react';
import { TVShowSeason, ShowStatus, ViewType } from './types';
import { getRatingColor, STATUS_COLORS, getNetworkColorClass } from './constants';
import ShowModal from './components/ShowModal';
import Stats from './components/Stats';
import { 
  Plus, Search, LayoutGrid, BarChart3, ChevronDown, ChevronUp, 
  ExternalLink, Youtube, Info, Trash2, Edit2, Calendar, Tv, Ticket
} from 'lucide-react';

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
    review: "Incredible tension and character growth. The cinematography in the kitchen scenes remains unmatched. Carmy's journey is both heartbreaking and inspiring.",
    synopsis: "Carmy, Sydney, and Richie work to transform their grimy sandwich shop into a next-level dining destination.",
    isOngoing: true,
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
    review: "The perfect ending to a near-perfect show. The writing is sharp, cruel, and hilarious. A masterclass in ensemble acting.",
    synopsis: "The sale of media conglomerate Waystar Royco to tech visionary Lukas Matsson moves ever closer, shaking up the Roy family.",
    isOngoing: false,
    createdAt: Date.now() - 2000
  }
];

const App: React.FC = () => {
  const [shows, setShows] = useState<TVShowSeason[]>(() => {
    const saved = localStorage.getItem('cinetrack_shows');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 ? parsed : DEFAULT_SHOWS;
  });
  const [view, setView] = useState<ViewType>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<TVShowSeason | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('cinetrack_shows', JSON.stringify(shows));
  }, [shows]);

  const normalizeUrl = (url?: string): string => {
    if (!url) return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const filteredShows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return shows.filter(s => 
      s.title.toLowerCase().includes(q) ||
      s.network.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q) ||
      s.genres.some(g => g.toLowerCase().includes(q))
    ).sort((a, b) => b.createdAt - a.createdAt);
  }, [shows, searchQuery]);

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
    if (confirm('Delete this entry?')) {
      setShows(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleEdit = (show: TVShowSeason, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShow(show);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header Container */}
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 mb-12">
        {/* Brand/Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none mb-1">CineTrack</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Season Archive</p>
          </div>
        </div>

        {/* Action Controls - Search & Buttons in one row */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:max-w-4xl">
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
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-xl">
              <button 
                onClick={() => setView('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Grid</span>
              </button>
              <button 
                onClick={() => setView('stats')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${view === 'stats' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Stats</span>
              </button>
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

      <div className="max-w-[1800px] mx-auto">
        {view === 'grid' ? (
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[28%]">Title & Genres</th>
                      <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[6%] text-center">Season</th>
                      <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[15%]">User Rating</th>
                      <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[18%]">Aggregates</th>
                      <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[12%]">Network</th>
                      <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[13%]">Status</th>
                      <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[4%] text-center">Trailer</th>
                      <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest w-[4%]"></th>
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
                          <tr 
                            onClick={() => setExpandedId(expandedId === show.id ? null : show.id)}
                            className={`hover:bg-slate-800/40 transition-colors cursor-pointer group/row ${expandedId === show.id ? 'bg-indigo-500/10' : ''}`}
                          >
                            <td className="p-5">
                              <div className="flex items-center gap-4">
                                {expandedId === show.id ? <ChevronUp className="w-6 h-6 text-indigo-400 shrink-0" /> : <ChevronDown className="w-6 h-6 text-slate-600 group-hover/row:text-slate-400 shrink-0" />}
                                <div className="min-w-0">
                                  <div className="font-bold text-white text-xl truncate leading-tight mb-1 tracking-tight">{show.title}</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {show.genres.slice(0, 3).map(g => (
                                      <span key={g} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold whitespace-nowrap">{g}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <span className="bg-slate-800 px-3 py-1.5 rounded-full text-sm font-black text-slate-200">{show.seasonNumber}</span>
                            </td>
                            <td className="p-5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0" style={{ backgroundColor: getRatingColor(show.userRating) + '20', color: getRatingColor(show.userRating), border: `1px solid ${getRatingColor(show.userRating)}40` }}>
                                  {show.userRating.toFixed(1)}
                                </div>
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full transition-all duration-700" style={{ width: `${(show.userRating / 5) * 100}%`, backgroundColor: getRatingColor(show.userRating) }} />
                                </div>
                              </div>
                            </td>
                            <td className="p-5">
                               {/* Grid layout ensuring 2 per row - 3 links results in 2+1 */}
                               <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-lg font-black tracking-tight">
                                  {validRatings.map((rating, idx) => (
                                    <a 
                                      key={idx}
                                      href={normalizeUrl(rating.url)} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      onClick={e => e.stopPropagation()} 
                                      className={`${rating.color} hover:underline truncate`}
                                    >
                                      {rating.label}: {rating.value}
                                    </a>
                                  ))}
                               </div>
                            </td>
                            <td className="p-5 truncate">
                              <span className={`font-black text-xl transition-colors ${getNetworkColorClass(show.network)}`}>
                                {show.network}
                              </span>
                            </td>
                            <td className="p-5">
                              <span className={`px-3 py-1.5 rounded text-lg font-black border uppercase tracking-wider block text-center ${STATUS_COLORS[show.status]}`}>
                                {show.status}
                              </span>
                            </td>
                            <td className="p-5 text-center">
                              <div className="flex items-center justify-center">
                                {show.urls.trailer ? (
                                  <a href={normalizeUrl(show.urls.trailer)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-red-600 hover:text-red-500 transition-colors inline-block">
                                    <Youtube className="w-7 h-7" />
                                  </a>
                                ) : <span className="text-slate-800">—</span>}
                              </div>
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => handleEdit(show, e)} 
                                  className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded-lg shadow-sm"
                                  title="Edit Season"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={(e) => handleDelete(show.id, e)} 
                                  className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-slate-800 hover:bg-red-950/30 rounded-lg shadow-sm"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedId === show.id && (
                            <tr className="bg-slate-900/50">
                              <td colSpan={8} className="p-0 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                                 <div className="p-10">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                                      <div className="space-y-8">
                                         <div>
                                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                               <Info className="w-4 h-4 text-indigo-400" /> Synopsis
                                            </h4>
                                            <p className="text-slate-300 text-lg leading-relaxed italic">{show.synopsis || "No synopsis available."}</p>
                                         </div>
                                         <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
                                                <div className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Airing Status</div>
                                                <div className="font-bold flex items-center gap-3 text-slate-100 text-base">
                                                    <div className={`w-3 h-3 rounded-full ${show.isOngoing ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
                                                    {show.isOngoing ? 'Ongoing' : 'Ended'}
                                                </div>
                                            </div>
                                            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
                                                <div className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Genres</div>
                                                <div className="text-sm text-slate-300 font-bold leading-relaxed">{show.genres.join(' • ')}</div>
                                            </div>
                                         </div>
                                         <div className="flex flex-wrap gap-4">
                                            {show.urls.imdb && (
                                                <a href={normalizeUrl(show.urls.imdb)} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold hover:border-yellow-500 transition-all shadow-xl">
                                                    <ExternalLink className="w-4 h-4 text-yellow-400" /> IMDb
                                                </a>
                                            )}
                                            {show.urls.rottenTomatoes && (
                                                <a href={normalizeUrl(show.urls.rottenTomatoes)} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold hover:border-red-500 transition-all shadow-xl">
                                                    <Ticket className="w-4 h-4 text-red-400" /> RT
                                                </a>
                                            )}
                                            {show.urls.metacritic && (
                                                <a href={normalizeUrl(show.urls.metacritic)} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold hover:border-green-500 transition-all shadow-xl">
                                                    <ExternalLink className="w-4 h-4 text-green-400" /> Metacritic
                                                </a>
                                            )}
                                            {show.urls.myanimelist && (
                                                <a href={normalizeUrl(show.urls.myanimelist)} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold hover:border-blue-500 transition-all shadow-xl">
                                                    <ExternalLink className="w-4 h-4 text-blue-400" /> MAL
                                                </a>
                                            )}
                                         </div>
                                      </div>
                                      <div className="space-y-8">
                                         <div>
                                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Personal Review</h4>
                                            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 text-slate-300 text-lg relative overflow-hidden min-h-[160px] shadow-2xl leading-relaxed">
                                               <div className="absolute top-0 right-0 p-6 pointer-events-none">
                                                  <span className="text-8xl font-black text-slate-800/30 leading-none select-none">"</span>
                                               </div>
                                               <div className="relative z-10">{show.review || "No personal review written yet."}</div>
                                            </div>
                                         </div>
                                         <div className="grid grid-cols-2 gap-6">
                                           {(show.startDate || show.endDate) && (
                                              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
                                                  <div className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-widest flex items-center gap-2">
                                                     <Calendar className="w-4 h-4 text-indigo-400" /> Schedule
                                                  </div>
                                                  <div className="text-base font-bold text-slate-100">
                                                     {show.startDate || '?'} — {show.isOngoing ? 'Present' : (show.endDate || '?')}
                                                  </div>
                                              </div>
                                           )}
                                           <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
                                              <div className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-widest">Network</div>
                                              <p className={`font-black text-2xl tracking-tight ${getNetworkColorClass(show.network)}`}>{show.network}</p>
                                           </div>
                                         </div>
                                      </div>
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
          </div>
        ) : (
          <div className="max-w-[1800px] mx-auto">
            <Stats shows={shows} />
          </div>
        )}
      </div>

      <ShowModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveShow}
        initialShow={editingShow}
      />
    </div>
  );
};

export default App;
