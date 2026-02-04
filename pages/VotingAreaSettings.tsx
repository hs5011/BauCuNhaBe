
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Map, AlertCircle } from 'lucide-react';
import { VotingArea } from '../types';

const VotingAreaSettings: React.FC = () => {
  const [areas, setAreas] = useState<VotingArea[]>([]);
  const [newAreaName, setNewAreaName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('voting_areas');
    if (saved) {
      setAreas(JSON.parse(saved));
    } else {
      const defaultAreas = [
        { id: '1', name: 'Khu vực 1' },
        { id: '2', name: 'Khu vực 2' },
        { id: '3', name: 'Khu vực 3' },
        { id: '4', name: 'Khu vực 4' }
      ];
      setAreas(defaultAreas);
      localStorage.setItem('voting_areas', JSON.stringify(defaultAreas));
    }
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;

    const newArea: VotingArea = {
      id: Date.now().toString(),
      name: newAreaName.trim()
    };

    const updated = [...areas, newArea];
    setAreas(updated);
    localStorage.setItem('voting_areas', JSON.stringify(updated));
    setNewAreaName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa khu vực này? Lưu ý: Có thể ảnh hưởng đến các tài khoản đang thuộc khu vực này.')) {
      const updated = areas.filter(a => a.id !== id);
      setAreas(updated);
      localStorage.setItem('voting_areas', JSON.stringify(updated));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight text-center md:text-left">Danh mục Khu vực bỏ phiếu</h1>
        <p className="text-slate-500 font-medium text-center md:text-left">Quản lý các địa điểm/khu vực bỏ phiếu trong hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-red-600" /> Thêm khu vực mới
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                type="text" 
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="VD: Khu vực 5"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-medium"
              />
              <button 
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-100 transition-all"
              >
                Lưu khu vực
              </button>
            </form>
            <div className="mt-6 flex gap-2 text-[10px] text-amber-600 font-bold bg-amber-50 p-3 rounded-lg border border-amber-100">
              <AlertCircle size={14} className="shrink-0" />
              <span>Tên khu vực nên khớp với dữ liệu trong file Excel cử tri.</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
              <Map size={18} className="text-slate-400" />
              <span className="font-bold text-slate-700">Danh sách hiện có ({areas.length})</span>
            </div>
            <div className="divide-y divide-slate-100">
              {areas.length > 0 ? areas.map(area => (
                <div key={area.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold">
                      <MapPin size={16} />
                    </div>
                    <span className="font-bold text-slate-800">{area.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(area.id)}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400">Chưa có khu vực nào được cấu hình.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingAreaSettings;
