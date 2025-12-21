import React, { useMemo } from 'react';
import { TVShowSeason, ShowStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Target, Flame, Skull, Award, Tv, Clock, TrendingUp, Calendar } from 'lucide-react';

interface StatsProps {
  shows: TVShowSeason[];
  selectedYear?: string;
}

const Stats: React.FC<StatsProps> = ({ shows, selectedYear }) => {
  const currentYear = selectedYear && selectedYear !== 'All' ? parseInt(selectedYear) : new Date().getFullYear();

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

    const totalUserRating = shows.reduce((acc: number, s: TVShowSeason) => acc + (s.userRating || 0), 0);
    const avgRating = totalUserRating / shows.length;
    
    let persona = { title: "The Casual Viewer", desc: "Just getting started with the collection.", icon: <Tv /> };
    if (avgRating >= 4.5) persona = { title: "The Easy Pleaser", desc: "You find the gold in everything you watch!", icon: <Award className="text-yellow-400" /> };
    else if (avgRating >= 3.8) persona = { title: "The Connoisseur", desc: "You have refined taste but know quality when you see it.", icon: <Award className="text-indigo-400" /> };
    else if (avgRating <= 2.5) persona = { title: "The Harsh Critic", desc: "Extremely hard to impress.", icon: <Skull className="text-red-500" /> };
    else persona = { title: "The Goldilocks", desc: "Not too high, not too low.", icon: <Target className="text-green-400" /> };

    const allGenres = shows.flatMap(s => s.genres);
    const genreCounts = allGenres.reduce((acc, g) => {
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topGenres = (Object.entries(genreCounts) as [string, number][])
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
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Insights Dashboard
            <span className="text-slate-500 text-sm font-medium">/ {selectedYear === 'All' ? 'All-Time Library' : `${selectedYear} Specific`}</span>
         </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Time Invested</div>
            <h4 className="text-xl font-black text-white leading-none mb-1">{Math.round(totalHours)} Hours</h4>
            <p className="text-xs text-slate-400 leading-relaxed">~{Math.round(totalHours / 24)} days active</p>
          </div>
        </div>

        {funInsights && (
          <>
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                {React.cloneElement(funInsights.persona.icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Yearly Persona</div>
                <h4 className="text-xl font-black text-white leading-none mb-1">{funInsights.persona.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{funInsights.persona.desc}</p>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-start gap-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Top Genre</div>
                <h4 className="text-xl font-black text-white leading-none mb-1">
                  {funInsights.topGenres[0]?.[0] || 'N/A'}
                </h4>
                <p className="text-xs text-slate-400">Dominating your screen.</p>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl">
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Season Count</div>
                <h4 className="text-xl font-black text-white leading-none mb-1">{shows.length}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Entries tracked in period.</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> 
            Viewing Velocity ({selectedYear === 'All' ? 'Current Year' : selectedYear})
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
                      {statusData.map((_entry, index) => (
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
    </div>
  );
};

export default Stats;
