
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Voter } from '../types';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { appendVoters, setAppInitialized } from '../services/sheetApi';

const VoterImport: React.FC = () => {
  const [importedData, setImportedData] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setStatus('idle');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedData: Voter[] = data.map((row: any, index: number) => {
          return {
            id: `imp-${Date.now()}-${index}`,
            fullName: row['Họ tên'] || row['Họ và tên'] || row['Name'] || 'Không rõ',
            idCard: String(row['CCCD'] || row['Số CCCD'] || row['ID'] || '').trim(),
            address: row['Địa chỉ'] || row['Địa chỉ nhà'] || row['Address'] || '-',
            neighborhood: row['Khu phố'] || row['Thôn'] || row['Phường'] || '-',
            constituency: row['Đơn vị bầu cử'] || row['Đơn vị'] || '-',
            votingGroup: row['Tổ bầu cử'] || row['Tổ'] || '-',
            votingArea: row['Khu vực bỏ phiếu'] || row['Khu vực'] || '-',
            hasVoted: false
          };
        });

        if (formattedData.length === 0) {
          alert('Tệp Excel không có dữ liệu hoặc sai định dạng.');
          setIsLoading(false);
          return;
        }

        setImportedData(formattedData);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        alert('Lỗi khi đọc tệp. Vui lòng kiểm tra lại định dạng tệp.');
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      alert('Không thể đọc tệp này.');
      setIsLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleSaveToSystem = async () => {
    if (importedData.length === 0) return;
    setIsLoading(true);
    try {
      // Import Excel lớn: append theo lô để tránh timeout/proxy giới hạn
      await appendVoters(importedData, 300);
      setAppInitialized();
      setStatus('success');
    } catch (err) {
      alert('Không thể lưu lên Google Sheet. ' + (err instanceof Error ? err.message : 'Thử lại.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nhập danh sách cử tri</h1>
          <p className="text-slate-500">Hỗ trợ tệp .xlsx, .xls, .csv</p>
        </div>
        {status === 'success' && (
          <button 
            onClick={() => navigate('/voters')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all animate-bounce"
          >
            Xem danh sách ngay <ArrowRight size={18} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Upload size={20} className="text-red-600" />
              Tải tệp Excel lên
            </h3>
            
            <div className="relative group border-2 border-dashed border-slate-200 rounded-xl p-8 transition-all hover:border-red-400 hover:bg-red-50/50 flex flex-col items-center justify-center text-center">
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <FileSpreadsheet className={`${fileName ? 'text-red-500' : 'text-slate-300'} mb-4`} size={48} />
              <p className="text-sm font-bold text-slate-700">{fileName || 'Nhấp để chọn tệp'}</p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800">
              <p className="font-bold mb-2 flex items-center gap-1"><AlertCircle size={14}/> Lưu ý tiêu đề cột:</p>
              <ul className="list-disc ml-4 space-y-1 opacity-80">
                <li>Họ tên / Họ và tên</li>
                <li>CCCD / Số CCCD</li>
                <li>Địa chỉ / Địa chỉ nhà</li>
                <li>Khu phố / Thôn</li>
                <li>Tổ / Tổ bầu cử</li>
                <li>Đơn vị / Đơn vị bầu cử</li>
              </ul>
            </div>
          </div>

          {status === 'success' && (
            <div className="bg-green-50 p-5 rounded-xl border border-green-200 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="text-green-500" size={32} />
              <div>
                <p className="text-green-800 font-bold">Thành công!</p>
                <p className="text-green-700 text-sm">Đã nhập {importedData.length} cử tri.</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Xem trước dữ liệu ({importedData.length})</h3>
            {importedData.length > 0 && status !== 'success' && (
              <div className="flex gap-2">
                <button onClick={() => { setImportedData([]); setFileName(''); }} className="px-3 py-1 text-slate-500 text-sm">Hủy</button>
                <button onClick={handleSaveToSystem} disabled={isLoading} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md">
                  {isLoading ? 'Đang lưu...' : 'Xác nhận nhập'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center p-12"><div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div><p>Đang đọc tệp...</p></div>
            ) : importedData.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3 font-bold text-slate-500">Họ tên</th>
                    <th className="px-4 py-3 font-bold text-slate-500">CCCD</th>
                    <th className="px-4 py-3 font-bold text-slate-500">Địa chỉ nhà</th>
                    <th className="px-4 py-3 font-bold text-slate-500">Khu phố</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {importedData.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-800">{v.fullName}</td>
                      <td className="px-4 py-3 text-slate-600">{v.idCard}</td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]">{v.address}</td>
                      <td className="px-4 py-3 text-slate-500">{v.neighborhood}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-slate-300">
                <FileSpreadsheet size={64} className="mb-4 opacity-10" />
                <p>Chưa có dữ liệu. Hãy tải tệp Excel lên.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterImport;
