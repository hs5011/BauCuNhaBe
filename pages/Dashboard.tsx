
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Voter, User, UserRole } from '../types';
import { Users, UserCheck, Clock, TrendingUp, MapPin, BarChart3 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      setCurrentUser(JSON.parse(authData).user);
    }

    const saved = localStorage.getItem('voters');
    const isInitialized = localStorage.getItem('app_initialized');

    if (saved && saved !== '[]') {
      setVoters(JSON.parse(saved));
    } else if (!isInitialized) {
      const sampleVoters: Voter[] = Array.from({ length: 100 }, (_, i) => ({
        id: `v-${i}`,
        fullName: `Cử tri Mẫu ${i + 1}`,
        idCard: `${100000000000 + i}`,
        address: `${i + 1} Đường số ${Math.ceil((i+1)/10)}, Xã Nhà Bè`,
        neighborhood: `Khu phố ${Math.ceil((i + 1) / 20)}`,
        constituency: `Đơn vị ${Math.ceil((i + 1) / 50)}`,
        votingGroup: `Tổ ${Math.ceil((i + 1) / 10)}`,
        votingArea: `Khu vực ${Math.ceil((i % 4) + 1)}`, 
        hasVoted: Math.random() > 0.4,
        votedAt: new Date().toISOString()
      }));
      setVoters(sampleVoters);
      localStorage.setItem('voters', JSON.stringify(sampleVoters));
      localStorage.setItem('app_initialized', 'true');
    }
    
    const timer = setInterval(() => {
      const savedEndTime = localStorage.getItem('election_end_time');
      if (!savedEndTime) {
        setTimeLeft('Chưa thiết lập');
        return;
      }
      const end = new Date(savedEndTime).getTime();
      const now = new Date().getTime();
      const distance = end - now;
      if (distance < 0) {
        setTimeLeft('Đã kết thúc');
        setIsFinished(true);
        clearInterval(timer);
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours < 10 ? '0'+hours : hours}:${minutes < 10 ? '0'+minutes : minutes}:${seconds < 10 ? '0'+seconds : seconds}`);
        setIsFinished(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const roleFilteredVoters = voters.filter(v => {
    if (!isAdmin && currentUser?.votingArea) {
      return v.votingArea === currentUser.votingArea;
    }
    return true;
  });

  const totalVoters = roleFilteredVoters.length;
  const votedCount = roleFilteredVoters.filter(v => v.hasVoted).length;
  const progress = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

  const neighborhoodData = Object.values(
    roleFilteredVoters.reduce((acc, v) => {
      if (!acc[v.neighborhood]) acc[v.neighborhood] = { name: v.neighborhood, total: 0, voted: 0 };
      acc[v.neighborhood].total++;
      if (v.hasVoted) acc[v.neighborhood].voted++;
      return acc;
    }, {} as Record<string, any>)
  ).map((val: any) => ({
    ...val,
    percentage: val.total > 0 ? Math.round((val.voted / val.total) * 100) : 0
  }));

  const areaComparisonData = isAdmin ? Object.values(
    voters.reduce((acc, v) => {
      if (!acc[v.votingArea]) acc[v.votingArea] = { name: v.votingArea, total: 0, voted: 0, notVoted: 0 };
      acc[v.votingArea].total++;
      if (v.hasVoted) acc[v.votingArea].voted++;
      else acc[v.votingArea].notVoted++;
      return acc;
    }, {} as Record<string, any>)
  ) : [];

  const pieData = [
    { name: 'Đã bầu', value: votedCount, color: '#ef4444' },
    { name: 'Chưa bầu', value: totalVoters - votedCount, color: '#e2e8f0' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Bảng điều khiển thống kê</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 font-medium">
              {isAdmin ? 'Toàn bộ hệ thống bầu cử' : 'Dữ liệu tại khu vực phân công'}
            </p>
            {!isAdmin && currentUser?.votingArea && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100 uppercase">
                <MapPin size={12} /> {currentUser.votingArea}
              </span>
            )}
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cập nhật lần cuối</p>
          <p className="text-lg font-bold text-slate-700">{new Date().toLocaleTimeString('vi-VN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng cử tri" value={totalVoters.toLocaleString()} icon={<Users size={24} />} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="Đã đi bầu" value={votedCount.toLocaleString()} icon={<UserCheck size={24} />} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title="Tỷ lệ bỏ phiếu" value={`${progress}%`} icon={<TrendingUp size={24} />} color="text-red-600" bgColor="bg-red-50" />
        <StatCard title="Thời gian còn lại" value={timeLeft} icon={<Clock size={24} />} color={isFinished ? "text-slate-400" : "text-amber-600"} bgColor={isFinished ? "bg-slate-50" : "bg-amber-50"} isTimer />
      </div>

      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-red-600" />
            So sánh tình hình giữa các Khu vực bỏ phiếu
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
                <Bar dataKey="voted" name="Đã bầu" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="notVoted" name="Chưa bầu" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Tình hình theo Khu phố (%)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={neighborhoodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="percentage" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-800 mb-6 self-start">Tỷ lệ hoàn thành</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-800 leading-none">{progress}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Đã bầu</span>
            </div>
          </div>
          <div className="w-full mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <div className="w-3 h-3 rounded-full bg-red-500"></div> Đã bầu
              </span>
              <span className="font-bold text-slate-800">{votedCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div> Chưa bầu
              </span>
              <span className="font-bold text-slate-800">{totalVoters - votedCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, bgColor, isTimer }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <div className={`${bgColor} ${color} p-3 rounded-xl`}>{icon}</div>
      {isTimer && <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>}
    </div>
    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
    <h4 className={`text-3xl font-black ${isTimer ? 'font-mono' : ''} text-slate-800 mt-1`}>{value}</h4>
  </div>
);

export default Dashboard;
