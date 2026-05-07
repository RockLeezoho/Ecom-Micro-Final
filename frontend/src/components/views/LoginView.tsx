import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginAdmin, loginStaff, loginUser } from '../../services/authService';
import { t } from '../../utils/translate';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn } from 'lucide-react';

const LoginView: React.FC<{ onLogin: (session: any) => void; onNavigate: (view: { type: string }) => void; roleType?: 'customer' | 'staff' | 'admin' }> = ({ onLogin, onNavigate, roleType = 'customer' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session =
        roleType === 'customer'
          ? await loginUser(username, password, 'customer')
          : roleType === 'admin'
            ? await loginAdmin(username, password)
            : await loginStaff(username, password);
      onLogin(session);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-border-theme rounded-lg p-8 w-full max-w-sm shadow-sm"
      >
        <div className="text-center mb-8">
          <img src="/logo_becshop.png" alt="BECShop Logo" className="w-15 h-15 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-main">{t('app_title')}</h1>
          <p className="text-[10px] text-[#718096] uppercase tracking-widest font-black mt-1">
            {roleType === 'customer' ? t('login_title_customer') : roleType === 'admin' ? t('login_title_admin') : t('login_title_staff')}
          </p>
        </div>
          
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">{t('username_label') || t('username_placeholder')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-[#A0AEC0]" size={16} />
              <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder={t('username_placeholder')}
                  required
                />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">{t('password_label')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-[#A0AEC0]" size={16} />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('password_placeholder')}
                className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
            </div>
          </div>
          {error && <div className="text-red-500 text-xs text-center mb-2">{error}</div>}
          <button 
            type="submit"
            className="w-full bg-primary text-white py-2.5 rounded-md font-bold text-[13px] uppercase tracking-widest hover:bg-opacity-90 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? t('logging_in') : <>{t('login_button')} <LogIn size={16} /></>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-theme space-y-4">
            {roleType === 'customer' ? (
              <div className="space-y-3 text-center text-xs text-[#718096]">
                <p>
                  {t('no_account_prompt')} <button onClick={() => onNavigate({ type: 'REGISTER' })} className="text-primary font-bold">{t('create_account')}</button>
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Link to="/portal/staff/login" className="text-primary font-bold hover:underline">
                    {t('staff_login')}
                  </Link>
                  <Link to="/portal/admin/login" className="text-primary font-bold hover:underline">
                    {t('admin_login')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center text-xs text-[#718096]">
                <p>{t('need_access_contact_admin')}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {roleType === 'staff' ? (
                    <Link to="/portal/admin/login" className="text-primary font-bold hover:underline">
                      Quản trị viên đăng nhập
                    </Link>
                  ) : (
                    <Link to="/portal/staff/login" className="text-primary font-bold hover:underline">
                      Nhân viên đăng nhập
                    </Link>
                  )}
                </div>
              </div>
            )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginView;
