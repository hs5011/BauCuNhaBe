
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { LogIn, Lock, User as UserIcon, Vote, ShieldAlert } from 'lucide-react';
import { getUsers } from '../services/sheetApi';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const storedUsers = await getUsers();
      const adminUser: User = {
        id: '1',
        fullName: 'Quản trị viên',
        position: 'Hệ thống',
        email: 'admin@election.gov.vn',
        phone: '0900000000',
        username: 'admin',
        password: '123',
        role: UserRole.ADMIN
      };
      const users = storedUsers.length > 0 ? storedUsers : [adminUser];
      const foundUser = users.find(u => u.username === username && u.password === password);

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng!');
      }
    } catch (err) {
      setError('Không thể kết nối dữ liệu. Kiểm tra kết nối Google Sheet hoặc thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 md:p-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-red-600 rounded-2xl shadow-xl shadow-red-200">
              <Vote className="text-white" size={40} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">CỔNG THÔNG TIN BẦU CỬ</h1>
              <p className="text-slate-500 font-medium uppercase text-xs tracking-wider">Hệ thống quản lý cử tri & bỏ phiếu</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Tên đăng nhập</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-red-500 focus:bg-white outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-red-500 focus:bg-white outline-none transition-all font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-bold border border-red-100 animate-pulse">
                <ShieldAlert size={18} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-xl shadow-xl shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn size={22} /> ĐĂNG NHẬP HỆ THỐNG</>}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Thông tin đăng nhập mặc định</p>
            <div className="flex justify-center gap-4 text-xs font-mono">
              <span className="bg-slate-100 px-2 py-1 rounded">User: admin</span>
              <span className="bg-slate-100 px-2 py-1 rounded">Pass: 123</span>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-500 text-[10px] mt-8 font-medium leading-relaxed px-4">
          © 2026 SonDH - VietInfo
        </p>
      </div>
    </div>
  );
};

export default Login;
