
import React, { useState, useEffect } from 'react';
import { TVShowSeason, ShowStatus, AggregateRatings, ShowURLs } from '../types';
import { fetchShowMetadata } from '../services/geminiService';
import { X, Search, Loader2, Sparkles, Youtube, Globe, MonitorPlay, Ticket, Clock, List, ExternalLink } from 'lucide-react';
import { STATUS_TEXT_COLORS } from '../constants';

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
      avgEpisodeLength: 30
    });
  }, [initialShow, isOpen]);

  const handleSearch = async () => {
    if (!formData.title) return;
    setLoading(true);
    const metadata = await fetchShowMetadata(formData.title, formData.seasonNumber || 1);
    setFormData(prev => ({
      ...prev,
      ...metadata,
      genres: metadata.genres || prev.genres,
      aggregateRatings: { ...prev.aggregateRatings, ...metadata.aggregateRatings },
      urls: { ...prev.urls, ...metadata.urls }
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
    };
    onSave(finalShow);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 shadow-2xl">
        <div className="sticky top-0 z-10 bg-slate-900 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            {initialShow ? 'Edit Season' : 'Add New Season'}
            {!initialShow && <Sparkles className="w-5 h-5 text-indigo-400" />}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 pt-0 space-y-12">
          {/* Main Search Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Show Title</label>
              <div className="relative flex gap-2">
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white"
                  placeholder="Enter show name..."
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || !formData.title}
                  className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center transition-all shadow-lg min-w-[50px]"
                  title="Search metadata"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Season #</label>
                <input
                  type="number"
                  value={formData.seasonNumber}
                  onChange={e => setFormData({ ...formData, seasonNumber: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as ShowStatus })}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 outline-none font-bold ${STATUS_TEXT_COLORS[formData.status || ShowStatus.WATCHING]}`}
                >
                  {Object.values(ShowStatus).map(s => (
                    <option key={s} value={s} className={STATUS_TEXT_COLORS[s]}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Details & Ratings Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Show Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Network</label>
                  <input
                    type="text"
                    value={formData.network}
                    onChange={e => setFormData({ ...formData, network: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Episodes</label>
                  <div className="relative">
                    <List className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="number"
                      value={formData.episodeCount}
                      onChange={e => setFormData({ ...formData, episodeCount: parseInt(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 outline-none text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Ep Length (m)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="number"
                      value={formData.avgEpisodeLength}
                      onChange={e => setFormData({ ...formData, avgEpisodeLength: parseInt(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 outline-none text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">User Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.userRating}
                    onChange={e => setFormData({ ...formData, userRating: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 outline-none font-bold text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Genres (comma separated)</label>
                <input
                  type="text"
                  value={formData.genres?.join(', ')}
                  onChange={e => setFormData({ ...formData, genres: e.target.value.split(',').map(g => g.trim()) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 outline-none text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 outline-none text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 outline-none text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ratings & Links</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">IMDb</div>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full bg-transparent outline-none font-bold text-lg text-yellow-500"
                    value={formData.aggregateRatings?.imdb || ''}
                    onChange={e => setFormData({ ...formData, aggregateRatings: { ...formData.aggregateRatings, imdb: parseFloat(e.target.value) }})}
                  />
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">RT %</div>
                  <input 
                    type="number" 
                    className="w-full bg-transparent outline-none font-bold text-lg text-red-500"
                    value={formData.aggregateRatings?.rottenTomatoes || ''}
                    onChange={e => setFormData({ ...formData, aggregateRatings: { ...formData.aggregateRatings, rottenTomatoes: parseInt(e.target.value) }})}
                  />
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">Meta</div>
                  <input 
                    type="number" 
                    className="w-full bg-transparent outline-none font-bold text-lg text-green-500"
                    value={formData.aggregateRatings?.metacritic || ''}
                    onChange={e => setFormData({ ...formData, aggregateRatings: { ...formData.aggregateRatings, metacritic: parseInt(e.target.value) }})}
                  />
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 mb-1">MAL</div>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full bg-transparent outline-none font-bold text-lg text-blue-400"
                    value={formData.aggregateRatings?.myanimelist || ''}
                    onChange={e => setFormData({ ...formData, aggregateRatings: { ...formData.aggregateRatings, myanimelist: parseFloat(e.target.value) }})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                 <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Trailer URL" 
                      className="flex-1 bg-transparent text-sm outline-none text-white"
                      value={formData.urls?.trailer || ''}
                      onChange={e => setFormData({ ...formData, urls: { ...formData.urls, trailer: e.target.value }})}
                    />
                 </div>
                 <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <Globe className="w-4 h-4 text-yellow-500 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="IMDb URL" 
                      className="flex-1 bg-transparent text-sm outline-none text-white"
                      value={formData.urls?.imdb || ''}
                      onChange={e => setFormData({ ...formData, urls: { ...formData.urls, imdb: e.target.value }})}
                    />
                 </div>
                 <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <Ticket className="w-4 h-4 text-red-400 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Rotten Tomatoes URL" 
                      className="flex-1 bg-transparent text-sm outline-none text-white"
                      value={formData.urls?.rottenTomatoes || ''}
                      onChange={e => setFormData({ ...formData, urls: { ...formData.urls, rottenTomatoes: e.target.value }})}
                    />
                 </div>
                 <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <ExternalLink className="w-4 h-4 text-green-400 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Metacritic URL" 
                      className="flex-1 bg-transparent text-sm outline-none text-white"
                      value={formData.urls?.metacritic || ''}
                      onChange={e => setFormData({ ...formData, urls: { ...formData.urls, metacritic: e.target.value }})}
                    />
                 </div>
                 <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                    <MonitorPlay className="w-4 h-4 text-blue-400 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="MyAnimeList URL" 
                      className="flex-1 bg-transparent text-sm outline-none text-white"
                      value={formData.urls?.myanimelist || ''}
                      onChange={e => setFormData({ ...formData, urls: { ...formData.urls, myanimelist: e.target.value }})}
                    />
                 </div>
              </div>
            </div>
          </div>

          {/* Synopsis & Review Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Synopsis</label>
              <textarea
                value={formData.synopsis}
                onChange={e => setFormData({ ...formData, synopsis: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 outline-none h-24 resize-none text-white"
                placeholder="Brief synopsis..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Your Review</label>
              <textarea
                value={formData.review}
                onChange={e => setFormData({ ...formData, review: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 outline-none h-24 resize-none text-white"
                placeholder="What did you think of this season?"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-md p-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all"
          >
            Save Show
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowModal;
