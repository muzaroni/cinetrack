
import React, { useMemo } from 'react';
import { TVShowSeason, ShowStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Trophy, Target, Zap, Flame, Skull, Award, Tv, Clock, TrendingUp } from 'lucide-react';

interface StatsProps {
  shows: TVShowSeason[];
}

const Stats: React.FC<StatsProps> = ({ shows }) => {
  const currentYear = new Date().getFullYear();

  // Monthly Velocity Data
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const results = months.map(m => ({ month: m, started: 0, ended: 0 }));

    shows.forEach(show => {
      if (show.startDate) {
        const start = new Date(show.startDate);
        if (start.getFullYear() === currentYear) {
          results[start.getMonth()].started++;
        }
      }
      if (show.endDate) {
        const end = new Date(show.endDate);
        if (end.getFullYear() === currentYear) {
          results[end.getMonth()].ended++;
        }
      }
    });
    return results;
  }, [shows, currentYear]);

  const totalHours = useMemo(() => {
    return shows.reduce((acc, s) => {
      // We count hours for completed or watching shows
      if (s.status === ShowStatus.COMPLETED || s.status === ShowStatus.WATCHING) {
        const episodes = s.episodeCount || 0;
        const length = s.avgEpisodeLength || 0;
        return acc + (episodes * length);
      }
      return acc;
    }, 0) / 60;
  }, [shows]);

  const statusData = useMemo(() => {
    const counts = shows.reduce((acc, show) => {
      acc[show.status] = (acc[show.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.values(ShowStatus).map(status => ({
      name: status,
      value: counts[status] || 0
    }));
  }, [shows]);

  const ratingDistribution = useMemo(() => {
    const bins = [0, 0, 0, 0, 0];
    shows.forEach(show => {
      const rating = Number(show.userRating) || 0;
      const idx = Math.min(Math.floor(rating - 1), 4);
      if (idx >= 0) bins[idx]++;
    });
    return [
      { name: '1 ★', count: bins[0] },
      { name: '2 ★', count: bins[1] },
      { name: '3 ★', count: bins[2] },
      { name: '4 ★', count: bins[3] },
      { name: '5 ★', count: bins[4] },
    ];
  }, [shows]);

  const funInsights = useMemo(() => {
    if (shows.length === 0) return null;

    const avgRating = shows.reduce((acc, s) => acc + s.userRating, 0) / shows.length;
    
    let persona = { title: "The Casual Viewer", desc: "Just getting started with the collection.", icon: <Tv /> };
    if (avgRating >= 4.5) persona = { title: "The Easy Pleaser", desc: "You find the gold in everything you watch!", icon: <Award className="text-yellow-400" /> };
    else if (avgRating >= 3.8) persona = { title: "The Connoisseur", desc: "You have refined taste but know quality when you see it.", icon: <Award className="text-indigo-400" /> };
    else if (avgRating <= 2.5) persona = { title: "The Harsh Critic", desc: "Extremely hard to impress. Most shows don't make the cut.", icon: <Skull className="text-red-500" /> };
    else persona = { title: "The Goldilocks", desc: "Not too high, not too low. You're perfectly balanced.", icon: <Target className="text-green-400" /> };

    const allGenres = shows.flatMap(s => s.genres);
    const genreCounts = allGenres.reduce((acc, g) => {
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const completed = shows.filter(s => s.status === ShowStatus.COMPLETED).length;
    const dropped = shows.filter(s => s.status === ShowStatus.DROPPED).length;
    const efficiency = Math.round((completed / (completed + dropped || 1)) * 100);

    return { persona, topGenres, efficiency, avgRating };
  }, [shows]);

  const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Lifetime Time</div>
            <h4 className="text-xl font-black text-white leading-tight">{Math.round(totalHours)} Hours</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">~{Math.round(totalHours / 24)} full days</p>
          </div>
        </div>

        {funInsights && (
          <>
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                {React.cloneElement(funInsights.persona.icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Your Persona</div>
                <h4 className="text-xl font-black text-white leading-tight">{funInsights.persona.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{funInsights.persona.desc}</p>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-start gap-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Genre Leader</div>
                <h4 className="text-xl font-black text-white leading-tight">
                  {funInsights.topGenres[0]?.[0] || 'None'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">Dominating your screen.</p>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl">
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Binge Level</div>
                <h4 className="text-xl font-black text-white leading-tight">
                  {totalHours > 500 ? 'Extreme' : totalHours > 100 ? 'Regular' : 'Low'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Watch activity ranking.</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> 
            Monthly Velocity ({currentYear})
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
                <Bar name="Started" dataKey="started" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar name="Completed" dataKey="ended" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
           <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
             <h3 className="text-lg font-bold mb-6 text-slate-300">Ratings Distribution</h3>
             <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: '#1e293b' }}
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
           </div>
           
           <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
             <h3 className="text-lg font-bold mb-6 text-slate-300">Viewing Status</h3>
             <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
             </div>
           </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Trophy className="w-32 h-32 text-indigo-500" />
         </div>
         <h3 className="text-lg font-bold mb-8 text-slate-300 relative z-10">Viewing Habits Summary</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
            <div className="space-y-1">
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Seasons</div>
              <div className="text-4xl font-black text-white">{shows.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Avg Rating</div>
              <div className="text-4xl font-black text-indigo-400">
                {(shows.reduce((acc, s) => acc + s.userRating, 0) / (shows.length || 1)).toFixed(1)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Efficiency</div>
              <div className="text-4xl font-black text-green-500">
                {funInsights?.efficiency || 0}%
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Avg Ep Len</div>
              <div className="text-4xl font-black text-purple-400">
                {Math.round(shows.reduce((acc, s) => acc + (s.avgEpisodeLength || 0), 0) / (shows.length || 1))}m
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Stats;
