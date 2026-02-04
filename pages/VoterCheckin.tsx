
import React, { useState, useEffect } from 'react';
import { Search, UserCheck, ShieldCheck, MapPin, Hash, CheckCircle, AlertTriangle, User as UserIcon, X } from 'lucide-react';
import { Voter, User, UserRole } from '../types';
import { getVoters, saveVoters } from '../services/supabaseApi';

function normalizeVoters(rows: any[]): Voter[] {
  return (rows || []).map(r => ({
    id: String(r.id ?? ''),
    fullName: String(r.fullName ?? ''),
    idCard: String(r.idCard ?? ''),
    address: String(r.address ?? ''),
    neighborhood: String(r.neighborhood ?? ''),
    constituency: String(r.constituency ?? ''),
    votingGroup: String(r.votingGroup ?? ''),
    votingArea: String(r.votingArea ?? ''),
    hasVoted: r.hasVoted === true || r.hasVoted === 'TRUE' || r.hasVoted === '1',
    votedAt: r.votedAt ? String(r.votedAt) : undefined
  }));
}

const VoterCheckin: React.FC = () => {
  const [allVoters, setAllVoters] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Voter[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) setCurrentUser(JSON.parse(authData).user);
    getVoters().then(saved => setAllVoters(normalizeVoters(saved)));
  }, []);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length === 0) {
      setSearchResults([]);
      setHasSearched(false);
      setSelectedVoter(null);
      return;
    }
    setHasSearched(true);
    let results = allVoters.filter(v =>
      (v.idCard && v.idCard.toLowerCase().includes(term)) ||
      (v.fullName && v.fullName.toLowerCase().includes(term)) ||
      (v.address && v.address.toLowerCase().includes(term))
    );
    if (currentUser?.role === UserRole.STAFF && currentUser.votingArea) {
      results = results.filter(v => v.votingArea === currentUser.votingArea);
    }
    setSearchResults(results);
    if (results.length === 1 && (term.length > 3 || results[0].idCard.toLowerCase() === term)) {
      setSelectedVoter(results[0]);
    } else {
      setSelectedVoter(null);
    }
  }, [searchTerm, currentUser, allVoters]);

  const handleMarkAsVoted = async () => {
    if (!selectedVoter) return;
    setIsSaving(true);
    const updatedVoters = allVoters.map(v =>
      v.id === selectedVoter.id ? { ...v, hasVoted: true, votedAt: new Date().toISOString() } : v
    );
    try {
      await saveVoters(updatedVoters);
      setAllVoters(updatedVoters);
      const updatedVoter = { ...selectedVoter, hasVoted: true, votedAt: new Date().toISOString() };
      setSelectedVoter(updatedVoter);
      setSearchResults(prev => prev.map(v => v.id === selectedVoter.id ? updatedVoter : v));
    } catch (err) {
      alert('Không thể lưu lên Google Sheet. ' + (err instanceof Error ? err.message : 'Thử lại.'));
    }
    setIsSaving(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedVoter(null);
    setHasSearched(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-3">
          <UserCheck size={32} className="text-red-600" />
          Xác nhận cử tri đi bầu
        </h1>
        {currentUser?.role === UserRole.STAFF && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-bold border border-red-100">
            <MapPin size={16} />
            Phạm vi quản lý: {currentUser.votingArea || 'Toàn bộ hệ thống'}
          </div>
        )}
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className={`${searchTerm ? 'text-red-600' : 'text-slate-400'} transition-colors`} size={24} />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          placeholder="Nhập Họ tên, Số CCCD hoặc Địa chỉ..." 
          className="block w-full pl-16 pr-20 py-5 text-xl bg-white border-2 border-slate-200 rounded-2xl shadow-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all font-medium"
        />
        {searchTerm && (
          <button 
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Danh sách kết quả khi có nhiều hơn 1 người khớp */}
      {hasSearched && !selectedVoter && searchResults.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kết quả tìm kiếm ({searchResults.length})</h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">CHỌN CỬ TRI ĐỂ XEM CHI TIẾT</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
            {searchResults.map(v => (
              <div 
                key={v.id} 
                onClick={() => setSelectedVoter(v)}
                className="p-4 flex items-center justify-between hover:bg-red-50 transition-colors cursor-pointer group"
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${v.hasVoted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg group-hover:text-red-700 transition-colors">{v.fullName}</p>
                    <p className="text-sm text-slate-400 font-mono">CCCD: {v.idCard} | Tổ: {v.votingGroup} | {v.neighborhood}</p>
                    <p className="text-xs text-slate-500 mt-0.5 italic line-clamp-1">{v.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   {v.hasVoted ? (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-tight">Đã bầu</span>
                   ) : (
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 uppercase tracking-tight">Chưa bầu</span>
                   )}
                   <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                    <Search size={16} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hiển thị chi tiết khi chọn được 1 cử tri */}
      {selectedVoter && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border-2 ${selectedVoter.hasVoted ? 'border-emerald-200' : 'border-red-100'}`}>
            <div className={`px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 ${selectedVoter.hasVoted ? 'bg-emerald-50' : 'bg-red-50/30'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${selectedVoter.hasVoted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  <UserCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Thông tin cử tri</h3>
                  {searchResults.length > 1 && (
                    <button onClick={() => setSelectedVoter(null)} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                      <X size={12} /> Quay lại danh sách
                    </button>
                  )}
                </div>
              </div>
              {selectedVoter.hasVoted ? (
                <div className="flex items-center gap-2 text-emerald-700 font-black bg-white px-5 py-2.5 rounded-2xl border-2 border-emerald-200 shadow-sm uppercase text-sm">
                  <CheckCircle size={20} />
                  ĐÃ BỎ PHIẾU THÀNH CÔNG
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 font-black bg-white px-5 py-2.5 rounded-2xl border-2 border-amber-200 shadow-sm uppercase text-sm">
                  <ShieldCheck size={20} />
                  SẴN SÀNG BỎ PHIẾU
                </div>
              )}
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-6">
                <DetailItem label="Họ và tên" value={selectedVoter.fullName} large />
                <DetailItem label="Số CCCD / Định danh" value={selectedVoter.idCard} icon={<Hash size={18} />} />
                <DetailItem label="Địa chỉ cư trú" value={selectedVoter.address || 'Chưa cập nhật'} />
              </div>
              <div className="space-y-6">
                <DetailItem label="Khu phố / Ấp" value={selectedVoter.neighborhood} icon={<MapPin size={18} />} />
                <DetailItem label="Đơn vị / Tổ bầu cử" value={`Đơn vị ${selectedVoter.constituency} - Tổ ${selectedVoter.votingGroup}`} />
                <DetailItem label="Địa điểm bỏ phiếu" value={selectedVoter.votingArea} icon={<MapPin size={18} />} highlight />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100">
              {!selectedVoter.hasVoted ? (
                <button 
                  onClick={handleMarkAsVoted}
                  disabled={isSaving}
                  className="w-full py-5 bg-red-600 hover:bg-red-700 text-white text-2xl font-black rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
                >
                  {isSaving ? (
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle size={32} className="group-hover:scale-110 transition-transform" />
                      XÁC NHẬN ĐI BẦU
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-100 shadow-inner">
                  <p className="text-emerald-700 font-bold text-lg">Đã ghi nhận vào hệ thống</p>
                  <p className="text-slate-500 font-medium mt-1">
                    Thời gian: {new Date(selectedVoter.votedAt!).toLocaleString('vi-VN')}
                  </p>
                  <button 
                    onClick={clearSearch}
                    className="mt-4 text-sm font-bold text-red-600 hover:underline"
                  >
                    Tiếp tục quét người mới
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Thông báo không tìm thấy */}
      {hasSearched && searchResults.length === 0 && (
        <div className="bg-white p-12 rounded-3xl shadow-xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
            <AlertTriangle size={56} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800">Không tìm thấy kết quả</h3>
            <p className="text-slate-500 max-w-sm font-medium">
              Không có dữ liệu trùng khớp với <span className="text-red-600 font-bold">"{searchTerm}"</span> trong phạm vi quản lý của bạn.
            </p>
          </div>
          <button 
            onClick={clearSearch}
            className="mt-2 px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
          >
            Xóa và nhập lại
          </button>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, icon, large, highlight }: { label: string, value: string, icon?: React.ReactNode, large?: boolean, highlight?: boolean }) => (
  <div className="space-y-1.5">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
      {icon} {label}
    </p>
    <p className={`font-bold ${highlight ? 'text-red-600 bg-red-50 px-3 py-1 rounded-xl inline-block border border-red-100' : 'text-slate-800'} ${large ? 'text-3xl' : 'text-xl'}`}>{value}</p>
  </div>
);

export default VoterCheckin;
