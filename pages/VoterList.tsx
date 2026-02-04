
import React, { useState, useEffect, useMemo } from 'react';
import { Voter, User, UserRole } from '../types';
import { 
  Search, Trash2, CheckCircle, XCircle, UserMinus, Database, MapPin, 
  ChevronLeft, ChevronRight, UserCheck, X, Hash, ShieldCheck, User as UserIcon
} from 'lucide-react';
import { getVoters, saveVoters, setAppInitialized } from '../services/supabaseApi';

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

const VoterList: React.FC = () => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'voted' | 'not_voted'>('all');
  const [voterToConfirm, setVoterToConfirm] = useState<Voter | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) setCurrentUser(JSON.parse(authData).user);
    let cancelled = false;
    getVoters().then(saved => {
      if (!cancelled) setVoters(normalizeVoters(saved));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handleDeleteVoter = async (id: string) => {
    if (!confirm('Xóa cử tri này khỏi hệ thống?')) return;
    const updated = voters.filter(v => v.id !== id);
    setVoters(updated);
    try {
      await saveVoters(updated);
    } catch (err) {
      alert('Không thể lưu lên Google Sheet. ' + (err instanceof Error ? err.message : 'Thử lại.'));
    }
  };

  const handleOpenConfirmModal = (v: Voter) => {
    setVoterToConfirm(v);
  };

  const handleFinalConfirm = async () => {
    if (!voterToConfirm) return;
    setIsConfirming(true);
    const updated = voters.map(v =>
      v.id === voterToConfirm.id ? { ...v, hasVoted: true, votedAt: new Date().toISOString() } : v
    );
    setVoters(updated);
    try {
      await saveVoters(updated);
    } catch (err) {
      alert('Không thể lưu lên Google Sheet. ' + (err instanceof Error ? err.message : 'Thử lại.'));
    }
    setIsConfirming(false);
    setVoterToConfirm(null);
  };

  const handleClearAll = async () => {
    if (!confirm('CẢNH BÁO: Hành động này sẽ xóa VĨNH VIỄN toàn bộ danh sách cử tri hiện có. Bạn có chắc chắn?')) return;
    setVoters([]);
    try {
      await saveVoters([]);
      setAppInitialized();
    } catch (err) {
      alert('Không thể lưu lên Google Sheet. ' + (err instanceof Error ? err.message : 'Thử lại.'));
    }
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const roleBaseVoters = useMemo(() => {
    if (isAdmin) return voters;
    return voters.filter(v => v.votingArea === currentUser?.votingArea);
  }, [voters, isAdmin, currentUser]);

  const filteredVoters = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return roleBaseVoters.filter(v => {
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'voted' && v.hasVoted) || 
                           (filterStatus === 'not_voted' && !v.hasVoted);
      if (!matchesFilter) return false;

      if (!term) return true;
      return (
        v.fullName.toLowerCase().includes(term) || 
        v.idCard.toLowerCase().includes(term) || 
        (v.address && v.address.toLowerCase().includes(term)) ||
        v.neighborhood.toLowerCase().includes(term) || 
        v.votingArea.toLowerCase().includes(term) ||
        v.votingGroup.toLowerCase().includes(term)
      );
    });
  }, [roleBaseVoters, searchTerm, filterStatus]);

  // Paginated data
  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);
  const paginatedVoters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVoters.slice(start, start + itemsPerPage);
  }, [filteredVoters, currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cơ sở dữ liệu cử tri</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-slate-500 font-medium">
              Hiển thị <span className="text-slate-800 font-bold">{filteredVoters.length}</span> / {roleBaseVoters.length} cử tri
            </p>
            {!isAdmin && currentUser?.votingArea && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100 uppercase">
                <MapPin size={12} /> {currentUser.votingArea}
              </span>
            )}
          </div>
        </div>
        {isAdmin && voters.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="flex items-center justify-center gap-2 px-5 py-3 text-red-600 bg-white hover:bg-red-50 border-2 border-red-100 rounded-xl transition-all text-sm font-black shadow-sm"
          >
            <UserMinus size={18} />
            XÓA TOÀN BỘ DANH SÁCH
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên, CCCD, địa chỉ, khu phố..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-red-50 font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl text-sm px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-bold text-slate-700"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="voted">Đã bầu</option>
              <option value="not_voted">Chưa bầu</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {paginatedVoters.length > 0 ? (
            <>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Họ tên & CCCD</th>
                    <th className="px-6 py-4">Địa chỉ nhà</th>
                    <th className="px-6 py-4">Khu phố & Địa điểm</th>
                    <th className="px-6 py-4">Tổ / Đơn vị</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedVoters.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800">{v.fullName}</p>
                          <p className="text-xs font-mono text-slate-400 font-medium">{v.idCard}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 font-medium max-w-[200px] truncate" title={v.address}>
                          {v.address || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-slate-700 font-bold">{v.votingArea}</p>
                          <p className="text-slate-400 text-xs font-medium">{v.neighborhood}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-600 space-y-0.5">
                          <p className="font-bold">Tổ: <span className="text-slate-400 font-medium">{v.votingGroup}</span></p>
                          <p className="font-bold">Đơn vị: <span className="text-slate-400 font-medium">{v.constituency}</span></p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${
                          v.hasVoted 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {v.hasVoted ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {v.hasVoted ? 'Đã bầu' : 'Chưa bầu'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            {!v.hasVoted && (
                              <button 
                                onClick={() => handleOpenConfirmModal(v)}
                                title="Xác nhận cử tri đã đi bầu"
                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                              >
                                <UserCheck size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteVoter(v.id)} 
                              title="Xóa cử tri"
                              className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Trang {currentPage} / {totalPages || 1}
                </span>
                <div className="flex gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none px-1">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`min-w-[36px] h-9 rounded-lg font-bold text-xs transition-all ${
                          currentPage === idx + 1 
                            ? 'bg-red-600 text-white' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-24 text-center">
              <Search className="text-slate-200 mx-auto mb-4" size={48} />
              <h3 className="text-slate-800 font-bold text-lg">Không tìm thấy dữ liệu</h3>
              <p className="text-slate-400 text-sm">Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bộ lọc.</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Confirmation Modal */}
      {voterToConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck size={20} />
                <h3 className="font-black uppercase tracking-tight">Xác nhận thông tin cử tri</h3>
              </div>
              <button onClick={() => setVoterToConfirm(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <UserIcon size={32} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">{voterToConfirm.fullName}</p>
                  <p className="text-sm font-mono text-slate-400 flex items-center gap-1">
                    <Hash size={14} /> CCCD: {voterToConfirm.idCard}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ nhà</p>
                  <p className="font-bold text-slate-700">{voterToConfirm.address || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khu phố</p>
                  <p className="font-bold text-slate-700">{voterToConfirm.neighborhood}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị / Tổ</p>
                  <p className="font-bold text-slate-700">Đơn vị {voterToConfirm.constituency} / Tổ {voterToConfirm.votingGroup}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm bầu cử</p>
                  <p className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded inline-block">{voterToConfirm.votingArea}</p>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3 text-emerald-800">
                <CheckCircle size={20} className="shrink-0" />
                <p className="text-xs font-medium">
                  Bằng cách nhấn xác nhận, bạn xác thực rằng cử tri này đã có mặt và thực hiện quyền bỏ phiếu theo đúng quy định.
                </p>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button 
                onClick={() => setVoterToConfirm(null)}
                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
              >
                Đóng
              </button>
              <button 
                onClick={handleFinalConfirm}
                disabled={isConfirming}
                className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isConfirming ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserCheck size={18} />
                    XÁC NHẬN BẦU CỬ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterList;
