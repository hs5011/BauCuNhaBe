
import React, { useState, useEffect } from 'react';
import { Calendar, Save, AlertCircle, Timer, Database } from 'lucide-react';
import { getElectionEndTime, saveElectionEndTime } from '../services/supabaseApi';

const ElectionSettings: React.FC = () => {
  const [endTime, setEndTime] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    getElectionEndTime().then(saved => {
      if (saved) setEndTime(saved);
      else {
        const now = new Date();
        now.setHours(19, 0, 0, 0);
        setEndTime(now.toISOString().slice(0, 16));
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveElectionEndTime(endTime);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert('Không thể lưu lên Supabase. ' + (err instanceof Error ? err.message : 'Kiểm tra cấu hình Supabase.'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cấu hình thời gian</h1>
        <p className="text-slate-500 font-medium">Thiết lập thời điểm kết thúc nhận phiếu bầu</p>
      </div>

      {/* Kết nối Supabase */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
          <div className="bg-white/15 p-3 rounded-xl">
            <Database size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Kết nối Supabase</h3>
            <p className="opacity-90 text-sm">
              Cấu hình qua biến môi trường <code className="bg-white/10 px-1 rounded">VITE_SUPABASE_URL</code> và <code className="bg-white/10 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>
        <div className="p-6 text-sm text-slate-700 space-y-2">
          <p>
            Tạo project Supabase, chạy SQL tạo bảng, rồi tạo file <code className="bg-slate-100 px-1 rounded">.env</code> theo <code className="bg-slate-100 px-1 rounded">.env.example</code>.
          </p>
          <p className="text-slate-500">
            Sau khi cấu hình xong, refresh trang để app kết nối Supabase.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-red-600 p-8 text-white flex items-center gap-6">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
            <Timer size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Thời gian kết thúc</h3>
            <p className="opacity-80 text-sm">Hệ thống sẽ tự động khóa hoặc hiển thị trạng thái kết thúc khi đến giờ này.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
              <Calendar size={14} /> Ngày và giờ kết thúc
            </label>
            <input 
              type="datetime-local" 
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-bold text-slate-800 focus:border-red-500 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-800">
            <AlertCircle className="shrink-0" size={20} />
            <p className="text-sm font-medium">
              Lưu ý: Thời gian này sẽ được dùng để tính toán đồng hồ đếm ngược trên màn hình Dashboard của toàn bộ cán bộ.
            </p>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Save size={20} />
            {isSaved ? 'ĐÃ LƯU THÀNH CÔNG' : 'CẬP NHẬT CẤU HÌNH'}
          </button>
        </form>
      </div>

      {isSaved && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-emerald-500 text-white p-4 rounded-2xl text-center font-bold shadow-lg shadow-emerald-200">
          Hệ thống đã cập nhật thời gian kết thúc mới!
        </div>
      )}
    </div>
  );
};

export default ElectionSettings;
