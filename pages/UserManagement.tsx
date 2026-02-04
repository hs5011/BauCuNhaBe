
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, VotingArea } from '../types';
import { Plus, Search, Edit2, Trash2, X, Shield, Mail, Phone, User as UserIcon, Lock, BadgeCheck, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUsers, getVotingAreas, saveUsers } from '../services/supabaseApi';

const defaultUsers: User[] = [
  {
    id: '1',
    fullName: 'Nguyễn Văn Admin',
    position: 'Chủ tịch Ủy ban',
    email: 'admin@election.gov.vn',
    phone: '0901234567',
    username: 'admin',
    password: '123',
    role: UserRole.ADMIN
  }
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [votingAreas, setVotingAreas] = useState<VotingArea[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [savedUsers, savedAreas] = await Promise.all([getUsers(), getVotingAreas()]);
        if (!cancelled) {
          setUsers(savedUsers.length > 0 ? savedUsers : defaultUsers);
          if (savedUsers.length === 0) await saveUsers(defaultUsers);
          setVotingAreas(savedAreas || []);
        }
      } catch (_) {
        if (!cancelled) setUsers(defaultUsers);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const usernameRaw = String(formData.get('username') || '').trim();
    const usernameKey = usernameRaw.toLowerCase();
    const isDuplicateUsername = users.some(u => {
      const uKey = String(u.username || '').trim().toLowerCase();
      if (!uKey) return false;
      if (editingUser && u.id === editingUser.id) return false; // bỏ qua chính nó khi edit
      return uKey === usernameKey;
    });
    if (isDuplicateUsername) {
      alert('Username đã tồn tại. Vui lòng chọn username khác.');
      return;
    }
    const newUser: User = {
      id: editingUser?.id || Date.now().toString(),
      fullName: formData.get('fullName') as string,
      position: formData.get('position') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      username: usernameRaw,
      password: (formData.get('password') as string) || editingUser?.password || '123456',
      role: formData.get('role') as UserRole,
      votingArea: (formData.get('votingArea') as string) || undefined
    };
    const updatedList = editingUser
      ? users.map(u => u.id === editingUser.id ? newUser : u)
      : [...users, newUser];
    setUsers(updatedList);
    try {
      await saveUsers(updatedList);
    } catch (err) {
      alert('Không thể lưu lên Google Sheet. ' + (err instanceof Error ? err.message : 'Thử lại.'));
      return;
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.username === 'admin') {
      alert('Không thể xóa tài khoản Quản trị viên hệ thống.');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userToDelete?.fullName}"?`)) return;
    const updatedList = users.filter(u => u.id !== id);
    setUsers(updatedList);
    try {
      await saveUsers(updatedList);
    } catch (err) {
      alert('Không thể lưu lên Google Sheet. ' + (err instanceof Error ? err.message : 'Thử lại.'));
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginated data
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

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
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Quản lý cán bộ</h1>
          <p className="text-slate-500 font-medium">Danh sách tài khoản vận hành hệ thống ({users.length})</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-100"
        >
          <Plus size={20} />
          <span>Thêm cán bộ mới</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc username..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-red-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {paginatedUsers.length > 0 ? (
            <>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Họ tên & Chức vụ</th>
                    <th className="px-6 py-4">Khu vực phân công</th>
                    <th className="px-6 py-4">Liên hệ</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{user.fullName}</p>
                        <p className="text-xs text-slate-400 font-medium">{user.position} | <span className="font-mono text-blue-600">{user.username}</span></p>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === UserRole.ADMIN ? (
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Toàn quyền</span>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                            <MapPin size={14} className="text-red-500" />
                            {user.votingArea || 'Chưa phân công'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 flex items-center gap-1"><Mail size={12}/> {user.email}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={12}/> {user.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          user.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          <Shield size={10} />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination UI */}
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
            <div className="p-12 text-center text-slate-400">Không tìm thấy cán bộ phù hợp.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingUser ? 'Cập nhật tài khoản' : 'Thêm cán bộ mới'}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Phân công khu vực bỏ phiếu cụ thể</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><UserIcon size={12}/> Họ và tên</label>
                  <input required name="fullName" defaultValue={editingUser?.fullName} placeholder="VD: Nguyễn Văn A" className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-red-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><BadgeCheck size={12}/> Chức vụ</label>
                  <input required name="position" defaultValue={editingUser?.position} placeholder="VD: Cán bộ tổ bầu cử" className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-red-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Mail size={12}/> Email công vụ</label>
                  <input required type="email" name="email" defaultValue={editingUser?.email} placeholder="example@election.gov.vn" className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-red-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Phone size={12}/> Số điện thoại</label>
                  <input required name="phone" defaultValue={editingUser?.phone} placeholder="09xxxxxxxx" className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-red-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><UserIcon size={12}/> Tên đăng nhập</label>
                  <input required name="username" defaultValue={editingUser?.username} placeholder="username" className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-red-500 transition-all font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Lock size={12}/> Mật khẩu</label>
                  <input type="password" name="password" placeholder={editingUser ? 'Để trống nếu không đổi' : '••••••••'} className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none focus:border-red-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Shield size={12}/> Vai trò hệ thống</label>
                  <select name="role" defaultValue={editingUser?.role || UserRole.STAFF} className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-white outline-none focus:border-red-500 transition-all font-bold">
                    <option value={UserRole.STAFF}>Cán bộ (Staff)</option>
                    <option value={UserRole.ADMIN}>Quản trị viên (Admin)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><MapPin size={12}/> Khu vực bỏ phiếu</label>
                  <select name="votingArea" defaultValue={editingUser?.votingArea || ''} className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl bg-white outline-none focus:border-red-500 transition-all font-bold">
                    <option value="">-- Không phân khu vực --</option>
                    {votingAreas.map(area => (
                      <option key={area.id} value={area.name}>{area.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Hủy bỏ</button>
                <button type="submit" className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-xl shadow-xl shadow-red-200 transition-all active:scale-[0.98]">
                  {editingUser ? 'CẬP NHẬT THÔNG TIN' : 'TẠO TÀI KHOẢN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
