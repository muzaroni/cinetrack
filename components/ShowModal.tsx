import React, { useState, useEffect } from 'react';
import { TVShowSeason, ShowStatus } from '../types';
import { fetchShowMetadata } from '../services/geminiService';
import { X, Search, Loader2, Sparkles, Youtube, Globe, MonitorPlay, Ticket, Clock, List, ExternalLink, Star, Calendar, Tag, BarChart3, Link as LinkIcon } from 'lucide-react';
import { STATUS_TEXT_COLORS, getRatingColor } from '../constants';

interface ShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (show: TVShowSeason) => void;
  initialShow?: TVShowSeason | null;
}

const ShowModal: React.FC<ShowModalProps> = ({ isOpen, onClose, onSave, initialShow }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<TVShowSeason>>({
    title: '',
    seasonNumber: 1,
    status: ShowStatus.WATCHING,
    userRating: 3.0,
    network: '',
    genres: [],
    review: '',
    synopsis: '',
    aggregateRatings: {},
    urls: {},
    isOngoing: false,
    episodeCount: 1,
    avgEpisodeLength: 30,
    groundingLinks: [],
    ...initialShow
  });

  useEffect(() => {
    if (initialShow) setFormData(initialShow);
    else setFormData({
      title: '',
      seasonNumber: 1,
      status: ShowStatus.WATCHING,
      userRating: 3.0,
      network: '',
      genres: [],
      review: '',
      synopsis: '',
      aggregateRatings: {},
      urls: {},
      isOngoing: false,
      episodeCount: 1,
      avgEpisodeLength: 30,
      groundingLinks: []
    });
  }, [initialShow, isOpen]);

  const handleSearch = async () => {
    if (!formData.title) return;
    setLoading(true);
    const result = await fetchShowMetadata(formData.title, formData.seasonNumber || 1);
    setFormData(prev => ({
      ...prev,
      ...result,
      genres: result.genres || prev.genres,
      aggregateRatings: { ...prev.aggregateRatings, ...result.aggregateRatings },
      urls: { ...prev.urls, ...result.urls },
      groundingLinks: result.groundingLinks || []
    }));
    setLoading(false);
  };

  const handleSave = () => {
    if (!formData.title) return;
    const finalShow: TVShowSeason = {
      id: formData.id || crypto.randomUUID(),
      title: formData.title || '',
      seasonNumber: formData.seasonNumber || 1,
      network: formData.network || 'Unknown',
      genres: formData.genres || [],
      userRating: formData.userRating || 0,
      aggregateRatings: formData.aggregateRatings || {},
      urls: formData.urls || {},
      status: formData.status || ShowStatus.WATCHING,
      review: formData.review || '',
      synopsis: formData.synopsis || '',
      startDate: formData.startDate,
      endDate: formData.endDate,
      isOngoing: !!formData.isOngoing,
      createdAt: formData.createdAt || Date.now(),
      episodeCount: formData.episodeCount || 0,
      avgEpisodeLength: formData.avgEpisodeLength || 0,
      groundingLinks: formData.groundingLinks || []
    };
    onSave(finalShow);
  };

  if (!isOpen) return null;

  const currentRatingColor = getRatingColor(formData.userRating || 3.0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 shadow-2xl">
        <div className="sticky top-0 z-10 bg-slate-900 p-5 flex justify-between items-center border-b border-slate-800/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            {initialShow ? 'Edit Season' : 'Add New Season'}
            {!initialShow && <Sparkles className="w-5 h-5 text-indigo-400" />}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-7">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="md:w-32 text-sm font-semibold text-slate-400 shrink-0">Show Title</label>
              <div className="relative flex flex-1 gap-3">
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white text-base"
                  placeholder="Enter show name..."
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || !formData.title}
                  className="px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-lg min-w-[56px]"
                  title="Search metadata"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label className="md:w-32 text-sm font-semibold text-slate-400 shrink-0">Season #</label>
                <input
                  type="number"
                  value={formData.seasonNumber}
                  onChange={e => setFormData({ ...formData, seasonNumber: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-white text-base font-medium"
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label className="md:w-32 text-sm font-semibold text-slate-400 shrink-0 text-left md:text-right">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as ShowStatus })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none font-black text-base ${STATUS_TEXT_COLORS[formData.status || ShowStatus.WATCHING]}`}
                >
                  {Object.values(ShowStatus).map(s => (
                    <option key={s} value={s} className={`bg-slate-950 ${STATUS_TEXT_COLORS[s]}`}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="shrink-0 lg:w-48 space-y-0.5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                Your Rating
              </h3>
              <p className="text-[10px] text-slate-500 font-medium italic leading-tight">Your personal score for this season.</p>
            </div>

            <div className="flex-1 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 w-full space-y-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.userRating}
                  onChange={e => setFormData({ ...formData, userRating: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer focus:outline-none accent-indigo-500"
                  style={{ background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #22c55e 100%)` }}
                />
                <div className="flex justify-between px-1">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button key={val} onClick={() => setFormData({ ...formData, userRating: val })} className={`text-[11px] font-black transition-colors px-2.5 py-0.5 rounded-md hover:bg-slate-800 ${Math.round(formData.userRating || 0) === val ? 'text-white bg-slate-800' : 'text-slate-600'}`}>{val}</button>
                  ))}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-2 shadow-xl">
                <div className="text-4xl font-black tabular-nums transition-colors duration-300 drop-shadow-xl" style={{ color: currentRatingColor }}>{(formData.userRating || 0).toFixed(1)}</div>
                <div className="text-slate-700 text-2xl font-black">/5.0</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="shrink-0 lg:w-48 space-y-0.5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Aggregate Scores
              </h3>
              <p className="text-[10px] text-slate-500 font-medium italic leading-tight">Global ratings from external databases.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IMDb</span>
                <div className="flex items-center gap-1.5">
                  <input type="number" step="0.1" className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-3xl font-black text-yellow-500 outline-none focus:ring-2 focus:ring-yellow-500/30 text-center shadow-lg" value={formData.aggregateRatings?.imdb || ''} onChange={e => setFormData({ ...formData, aggregateRatings: { ...formData.aggregateRatings, imdb: parseFloat(e.target.value) }})} />
                  <span className="text-slate-700 text-base font-black">/10</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RT</span>
                <div className="flex items-center gap-1.5">
                  <input type="number" className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-3xl font-black text-red-500 outline-none focus:ring-2 focus:ring-red-500/30 text-center shadow-lg" value={formData.aggregateRatings?.rottenTomatoes || ''} onChange={e => setFormData({ ...formData, aggregateRatings: { ...formData.aggregateRatings, rottenTomatoes: parseInt(e.target.value) }})} />
                  <span className="text-slate-700 text-base font-black">%</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta</span>
                <div className="flex items-center gap-1.5">
                  <input type="number" className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-3xl font-black text-green-500 outline-none focus:ring-2 focus:ring-green-500/30 text-center shadow-lg" value={formData.aggregateRatings?.metacritic || ''} onChange={e => setFormData({ ...formData, aggregateRatings: { ...formData.aggregateRatings, metacritic: parseInt(e.target.value) }})} />
                  <span className="text-slate-700 text-base font-black">/100</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MAL</span>
                <div className="flex items-center gap-1.5">
                  <input type="number" step="0.01" className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-3xl font-black text-blue-400 outline-none focus:ring-2 focus:ring-blue-400/30 text-center shadow-lg" value={formData.aggregateRatings?.myanimelist || ''} onChange={e => setFormData({ ...formData, aggregateRatings: { ...formData.aggregateRatings, myanimelist: parseFloat(e.target.value) }})} />
                  <span className="text-slate-700 text-base font-black">/10</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Show Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
                   <MonitorPlay className="w-4 h-4 text-indigo-400 shrink-0" />
                   <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter shrink-0">Network:</span>
                      <input type="text" value={formData.network} onChange={e => setFormData({ ...formData, network: e.target.value })} className="flex-1 bg-transparent text-white text-sm font-medium outline-none min-w-0" />
                   </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
                   <List className="w-4 h-4 text-slate-600 shrink-0" />
                   <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter shrink-0">Episodes:</span>
                      <input type="number" value={formData.episodeCount} onChange={e => setFormData({ ...formData, episodeCount: parseInt(e.target.value) })} className="flex-1 bg-transparent text-white text-sm font-medium outline-none min-w-0" />
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
                 <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                 <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter shrink-0">Duration (min):</span>
                    <input type="number" value={formData.avgEpisodeLength} onChange={e => setFormData({ ...formData, avgEpisodeLength: parseInt(e.target.value) })} className="flex-1 bg-transparent text-white text-sm font-medium outline-none min-w-0" />
                 </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
                 <Tag className="w-4 h-4 text-slate-600 shrink-0" />
                 <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter shrink-0">Genres:</span>
                    <input type="text" value={formData.genres?.join(', ')} onChange={e => setFormData({ ...formData, genres: e.target.value.split(',').map(g => g.trim()) })} className="flex-1 bg-transparent text-white text-sm font-medium outline-none min-w-0" placeholder="Drama, Action" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
                   <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
                   <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter shrink-0">Start:</span>
                      <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="flex-1 bg-transparent text-white text-[11px] font-medium outline-none min-w-0" />
                   </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
                   <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
                   <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter shrink-0">End:</span>
                      <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="flex-1 bg-transparent text-white text-[11px] font-medium outline-none min-w-0" />
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Links & Resources</h3>
              <div className="space-y-1.5">
                 <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                    <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                    <input type="text" placeholder="Trailer URL" className="flex-1 bg-transparent text-[11px] outline-none text-slate-300 font-medium" value={formData.urls?.trailer || ''} onChange={e => setFormData({ ...formData, urls: { ...formData.urls, trailer: e.target.value }})} />
                 </div>
                 <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                    <Globe className="w-4 h-4 text-yellow-500 shrink-0" />
                    <input type="text" placeholder="IMDb URL" className="flex-1 bg-transparent text-[11px] outline-none text-slate-300 font-medium" value={formData.urls?.imdb || ''} onChange={e => setFormData({ ...formData, urls: { ...formData.urls, imdb: e.target.value }})} />
                 </div>
                 <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                    <Ticket className="w-4 h-4 text-red-400 shrink-0" />
                    <input type="text" placeholder="Rotten Tomatoes URL" className="flex-1 bg-transparent text-[11px] outline-none text-slate-300 font-medium" value={formData.urls?.rottenTomatoes || ''} onChange={e => setFormData({ ...formData, urls: { ...formData.urls, rottenTomatoes: e.target.value }})} />
                 </div>
                 <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                    <ExternalLink className="w-4 h-4 text-green-400 shrink-0" />
                    <input type="text" placeholder="Metacritic URL" className="flex-1 bg-transparent text-[11px] outline-none text-slate-300 font-medium" value={formData.urls?.metacritic || ''} onChange={e => setFormData({ ...formData, urls: { ...formData.urls, metacritic: e.target.value }})} />
                 </div>
                 <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                    <MonitorPlay className="w-4 h-4 text-blue-400 shrink-0" />
                    <input type="text" placeholder="MyAnimeList URL" className="flex-1 bg-transparent text-[11px] outline-none text-slate-300 font-medium" value={formData.urls?.myanimelist || ''} onChange={e => setFormData({ ...formData, urls: { ...formData.urls, myanimelist: e.target.value }})} />
                 </div>
              </div>
              
              {formData.groundingLinks && formData.groundingLinks.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3" /> Search Verification Sources
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-2 scrollbar-hide">
                    {formData.groundingLinks.map((link, idx) => (
                      <a key={idx} href={link.uri} target="_blank" rel="noreferrer" className="block text-[10px] text-slate-500 hover:text-indigo-400 truncate font-medium">
                        • {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-1.5">Synopsis</label>
              <textarea value={formData.synopsis} onChange={e => setFormData({ ...formData, synopsis: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none h-24 resize-none text-white text-base leading-relaxed font-medium" placeholder="Brief season synopsis fetched or manually entered..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-1.5">Your Review</label>
              <textarea value={formData.review} onChange={e => setFormData({ ...formData, review: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none h-24 resize-none text-white text-base leading-relaxed font-medium" placeholder="What were your thoughts on this journey?" />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-xl p-6 flex justify-end gap-4 border-t border-slate-800/50">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-400 hover:text-white transition-colors text-base font-bold">Cancel</button>
          <button onClick={handleSave} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-xl shadow-indigo-600/20 text-base">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default ShowModal;