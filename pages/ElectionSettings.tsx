
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Save, AlertCircle, Timer } from 'lucide-react';

const ElectionSettings: React.FC = () => {
  const [endTime, setEndTime] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedEndTime = localStorage.getItem('election_end_time');
    if (savedEndTime) {
      setEndTime(savedEndTime);
    } else {
      // Mặc định là cuối ngày hôm nay
      const now = new Date();
      now.setHours(19, 0, 0, 0);
      const defaultTime = now.toISOString().slice(0, 16);
      setEndTime(defaultTime);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('election_end_time', endTime);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cấu hình thời gian</h1>
        <p className="text-slate-500 font-medium">Thiết lập thời điểm kết thúc nhận phiếu bầu</p>
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
