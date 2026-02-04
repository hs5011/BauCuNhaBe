
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  CheckSquare, 
  LogOut,
  Vote,
  List,
  Settings,
  Map,
  FileText
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/voters/checkin', label: 'Xác nhận cử tri', icon: CheckSquare },
    { path: '/voters', label: 'Danh sách cử tri', icon: List },
    { path: '/reports', label: 'Báo cáo thống kê', icon: FileText },
    ...(user?.role === UserRole.ADMIN ? [
      { path: '/voters/import', label: 'Nhập cử tri', icon: FileSpreadsheet },
      { path: '/areas', label: 'Quản lý khu vực', icon: Map },
      { path: '/users', label: 'Quản lý tài khoản', icon: Users },
      { path: '/settings', label: 'Cấu hình thời gian', icon: Settings }
    ] : []),
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
          <Vote className="text-white" size={24} />
        </div>
        <span className="font-bold text-lg tracking-tight uppercase">Bầu cử 2026</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-red-400 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
