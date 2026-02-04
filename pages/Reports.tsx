
import React, { useState, useEffect, useMemo } from 'react';
import { Voter, User, UserRole, VotingArea } from '../types';
import { 
  FileSpreadsheet, Search, Download, Filter, MapPin, 
  Users, CheckCircle, XCircle, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getVoters, getVotingAreas } from '../services/supabaseApi';

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

const Reports: React.FC = () => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [areas, setAreas] = useState<VotingArea[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'voted' | 'not_voted'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const user = JSON.parse(authData).user;
      setCurrentUser(user);
      if (user.role === UserRole.STAFF && user.votingArea) setSelectedArea(user.votingArea);
    }
    Promise.all([getVoters(), getVotingAreas()]).then(([savedVoters, savedAreas]) => {
      setVoters(normalizeVoters(savedVoters || []));
      setAreas(savedAreas || []);
    }).finally(() => setLoading(false));
  }, []);

  // Lấy danh sách các "Tổ" duy nhất dựa trên khu vực đã chọn
  const availableGroups = useMemo(() => {
    let list = voters;
    if (selectedArea !== 'all') {
      list = voters.filter(v => v.votingArea === selectedArea);
    }
    const groups = Array.from(new Set(list.map(v => v.votingGroup))).sort();
    return groups;
  }, [voters, selectedArea]);

  // Logic lọc dữ liệu
  const filteredData = useMemo(() => {
    return voters.filter(v => {
      const areaMatch = selectedArea === 'all' || v.votingArea === selectedArea;
      const groupMatch = selectedGroup === 'all' || v.votingGroup === selectedGroup;
      const statusMatch = selectedStatus === 'all' || 
                         (selectedStatus === 'voted' && v.hasVoted) || 
                         (selectedStatus === 'not_voted' && !v.hasVoted);
      const searchMatch = !searchTerm || 
                         v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         v.idCard.includes(searchTerm);

      return areaMatch && groupMatch && statusMatch && searchMatch;
    });
  }, [voters, selectedArea, selectedGroup, selectedStatus, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Không có dữ liệu để xuất báo cáo!');
      return;
    }

    // Chuẩn bị dữ liệu cho Excel (đổi tên cột sang tiếng Việt)
    const exportData = filteredData.map((v, index) => ({
      'STT': index + 1,
      'Họ và Tên': v.fullName,
      'Số CCCD': v.idCard,
      'Địa chỉ': v.address,
      'Khu phố': v.neighborhood,
      'Tổ bầu cử': v.votingGroup,
      'Đơn vị bầu cử': v.constituency,
      'Khu vực bỏ phiếu': v.votingArea,
      'Trạng thái': v.hasVoted ? 'Đã bầu' : 'Chưa bầu',
      'Thời điểm bầu': v.votedAt ? new Date(v.votedAt).toLocaleString('vi-VN') : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách cử tri');

    // Tự động điều chỉnh độ rộng cột
    const wscols = [
      { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 35 }, { wch: 15 }, 
      { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 20 }
    ];
    worksheet['!cols'] = wscols;

    const fileName = `Bao_cao_cu_tri_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

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
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <FileText className="text-red-600" size={28} />
            Báo cáo thống kê cử tri
          </h1>
          <p className="text-slate-500 font-medium">Xuất dữ liệu cử tri theo các tiêu chí tùy chỉnh</p>
        </div>
        <button 
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-100"
        >
          <Download size={20} />
          <span>Xuất File Excel</span>
        </button>
      </div>

      {/* Bộ lọc tiêu chí */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MapPin size={12} /> Khu vực bỏ phiếu
          </label>
          <select 
            disabled={!isAdmin}
            value={selectedArea}
            onChange={(e) => { setSelectedArea(e.target.value); setSelectedGroup('all'); }}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-red-100 outline-none disabled:opacity-60"
          >
            {isAdmin && <option value="all">Tất cả khu vực</option>}
            {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Users size={12} /> Tổ bầu cử
          </label>
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-red-100 outline-none"
          >
            <option value="all">Tất cả các Tổ</option>
            {availableGroups.map(g => <option key={g} value={g}>Tổ {g}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={12} /> Tình trạng bầu
          </label>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-red-100 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="voted">Đã bầu cử</option>
            <option value="not_voted">Chưa bầu cử</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Search size={12} /> Tìm kiếm nhanh
          </label>
          <input 
            type="text" 
            placeholder="Tên hoặc CCCD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-red-100 outline-none"
          />
        </div>
      </div>

      {/* Bảng dữ liệu preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase">Xem trước kết quả ({filteredData.length} cử tri)</span>
        </div>
        <div className="overflow-x-auto">
          {paginatedData.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Cử tri</th>
                  <th className="px-6 py-4">Khu vực bỏ phiếu</th>
                  <th className="px-6 py-4">Địa chỉ nhà</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{v.fullName}</p>
                      <p className="text-xs font-mono text-slate-400">{v.idCard}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">Khu vực bỏ phiếu số: {v.votingArea}</p>
                      <p className="text-xs text-slate-400">Tổ bầu cử số: {v.votingGroup} - Đơn vị bầu cử số: {v.constituency}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 max-w-[200px] truncate">{v.address}</p>
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
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-20 text-center text-slate-400">Không tìm thấy dữ liệu khớp với bộ lọc.</div>
          )}
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Trang {currentPage} / {totalPages}</span>
            <div className="flex gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
