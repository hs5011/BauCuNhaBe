
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Save, AlertCircle, Timer, Link2, ExternalLink } from 'lucide-react';
import { getElectionEndTime, saveElectionEndTime, getSheetAppUrl, setSheetAppUrl, getUseCorsProxy, setUseCorsProxy, getSheetProxyUrl, setSheetProxyUrl } from '../services/sheetApi';

const ElectionSettings: React.FC = () => {
  const [endTime, setEndTime] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetUrlSaved, setSheetUrlSaved] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyUrlSaved, setProxyUrlSaved] = useState(false);
  const [useCorsProxy, setUseCorsProxyState] = useState(false);

  useEffect(() => {
    getElectionEndTime().then(saved => {
      if (saved) setEndTime(saved);
      else {
        const now = new Date();
        now.setHours(19, 0, 0, 0);
        setEndTime(now.toISOString().slice(0, 16));
      }
    });
    setSheetUrl(getSheetAppUrl() || '');
    setProxyUrl(getSheetProxyUrl() || '');
    setUseCorsProxyState(getUseCorsProxy());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveElectionEndTime(endTime);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert('Không thể lưu lên Google Sheet. ' + (err instanceof Error ? err.message : 'Kiểm tra URL Web App.'));
    }
  };

  const handleSaveSheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setSheetAppUrl(sheetUrl.trim());
    setSheetUrlSaved(true);
    setTimeout(() => setSheetUrlSaved(false), 3000);
  };

  const handleSaveProxyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setSheetProxyUrl(proxyUrl.trim());
    setProxyUrlSaved(true);
    setTimeout(() => setProxyUrlSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cấu hình thời gian</h1>
        <p className="text-slate-500 font-medium">Thiết lập thời điểm kết thúc nhận phiếu bầu</p>
      </div>

      {/* Kết nối Google Sheet */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Link2 size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Kết nối Google Sheet</h3>
            <p className="opacity-90 text-sm">Dán URL Web App từ Google Apps Script để lưu toàn bộ dữ liệu lên 1 file Google Sheet.</p>
          </div>
        </div>
        <form onSubmit={handleSaveSheetUrl} className="p-6 space-y-4">
          <input
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/xxxxx/exec"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500">Hướng dẫn: Mở file <code className="bg-slate-100 px-1 rounded">docs/GoogleAppsScript_Code.js</code> trong project, làm theo bước tạo Sheet và Deploy → copy URL Web app dán vào ô trên.</p>
          {sheetUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const u = sheetUrl.trim();
                  if (u) window.open(u + (u.includes('?') ? '&' : '?') + 'all=1', '_blank');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all text-sm"
              >
                <ExternalLink size={16} />
                Kiểm tra kết nối (mở tab mới)
              </button>
              <span className="text-xs text-slate-500">Nếu tab mới hiện JSON (users, voters...) = Web App đúng. Nếu 403 hoặc trang đăng nhập = đổi Quyền truy cập thành &quot;Bất kỳ ai&quot;.</span>
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useCorsProxy}
              onChange={(e) => {
                const v = e.target.checked;
                setUseCorsProxyState(v);
                setUseCorsProxy(v);
              }}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Dùng proxy CORS (bật khi bị lỗi CORS)</span>
          </label>
          <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100 space-y-1">
            <p className="font-bold">Lưu ý về Proxy CORS:</p>
            <ul className="list-disc ml-4 space-y-0.5">
              <li>Bật proxy khi bị lỗi CORS (localhost hoặc GitHub Pages).</li>
              <li>Nếu POST (lưu dữ liệu) bị 403 dù đã đặt &quot;Bất kỳ ai&quot;, thử <strong>tắt proxy</strong> rồi thử lại — app sẽ tự thử POST trực tiếp.</li>
              <li>GET (đọc) có thể dùng proxy, nhưng POST có thể cần gọi trực tiếp.</li>
            </ul>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
            {sheetUrlSaved ? 'Đã lưu URL' : 'Lưu URL'}
          </button>
        </form>
      </div>

      {/* Proxy riêng (khuyến nghị) */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white">
          <h3 className="text-lg font-bold">Proxy riêng (khuyến nghị)</h3>
          <p className="opacity-90 text-sm">Giải quyết triệt để lỗi 403/408 của proxy công cộng và lỗi CORS.</p>
        </div>
        <form onSubmit={handleSaveProxyUrl} className="p-6 space-y-4">
          <input
            type="url"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder="VD: http://localhost:8787 hoặc https://<app-render>.onrender.com"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-slate-600"
          />
          <p className="text-xs text-slate-600">
            Trong repo đã có proxy: <code className="bg-slate-100 px-1 rounded">proxy/server.mjs</code>. Chạy local: <code className="bg-slate-100 px-1 rounded">node proxy/server.mjs</code> (mặc định cổng 8787).
            Sau đó dán URL proxy vào ô này. Khi có proxy riêng, app sẽ ưu tiên dùng proxy và không cần proxy công cộng.
          </p>
          <button type="submit" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all">
            {proxyUrlSaved ? 'Đã lưu Proxy' : 'Lưu Proxy'}
          </button>
        </form>
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
