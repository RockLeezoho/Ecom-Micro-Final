import React, { useState } from 'react';
import { registerCustomer} from '../../services/registerService';
import { t } from '../../utils/translate';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, ChevronLeft, User, ShieldCheck } from 'lucide-react';

interface RegisterViewProps {
  onRegister: (session: any) => void;
  onNavigate: (view: any) => void;
}

const REGISTRATION_ERROR_MESSAGES: Record<number, string> = {
  400: 'registration_error_400',
  401: 'registration_error_401',
  403: 'registration_error_403',
  409: 'registration_error_409',
  500: 'registration_error_500',
};

function extractFieldErrors(source: any): Record<string, string[]> {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {};
  }

  return Object.entries(source).reduce<Record<string, string[]>>((accumulator, [key, value]) => {
    if (Array.isArray(value)) {
      accumulator[key] = value.map((item) => String(item));
    } else if (typeof value === 'string') {
      accumulator[key] = [value];
    }
    return accumulator;
  }, {});
}

function getRegistrationErrorMessage(error: any) {
  const status = Number(error?.status || error?.code || 0);
  const body = error?.body;

  if (status && REGISTRATION_ERROR_MESSAGES[status]) {
    return t(REGISTRATION_ERROR_MESSAGES[status]);
  }

  if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
    return body.message;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return t('registration_failed');
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegister, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !email || !password || !phone) {
      setError(t('please_fill_required'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }
    setLoading(true);
    try {
      const session = await registerCustomer({
        username,
        email,
        password,
        phone_number: phone,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        gender
      });
      setFieldErrors({});
      onRegister(session);
    } catch (err: any) {
      const status = Number(err?.status || err?.code || 0);
      const body = err?.body;
      const backendFieldErrors = extractFieldErrors(body && typeof body === 'object' ? body : null);

      setFieldErrors(backendFieldErrors);

      setError(getRegistrationErrorMessage({ ...err, status }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-border-theme rounded-lg p-8 w-full max-w-xl shadow-sm"
      >
        <div className="text-center mb-8">
          <img src="/logo_becshop.png" alt="BECShop Logo" className="w-15 h-15 mx-auto mb-4" />
                  <h1 className="text-xl font-bold text-text-main">{t('app_title')}</h1>
                  <p className="text-[10px] text-[#718096] uppercase tracking-widest font-black mt-1">
                    {t('register_title')}
                  </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-[#A0AEC0]" size={16} />
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder={t('username_placeholder')}
                    required
                  />
                </div>
                {fieldErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.username.join(', ')}</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-[#A0AEC0]" size={16} />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder={t('ten@gmail.com')}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email.join(', ')}</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
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
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.password.join(', ')}</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">
                  Nhập lại mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-[#A0AEC0]" size={16} />
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={t('password_placeholder')}
                    className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-4 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder={'Số điện thoại'}
                    required
                  />
                </div>
                {fieldErrors.phone_number && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.phone_number.join(', ')}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">{t('last_name_label')}</label>
                <input 
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-4 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Họ đệm"
                />
              </div>
              {fieldErrors.first_name && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.first_name.join(', ')}</p>
              )}
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">{t('first_name_label')}</label>
                <input 
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-4 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Tên"
                />
              </div>
              {fieldErrors.last_name && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.last_name.join(', ')}</p>
              )}
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">{t('date_of_birth_label')}</label>
                <input 
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-4 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="YYYY-MM-DD"
                />
              </div>
              {fieldErrors.date_of_birth && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.date_of_birth.join(', ')}</p>
              )}
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1 ml-1">{t('gender_label')}</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-border-theme rounded-md py-2 pl-4 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">{t('gender_not_selected')}</option>
                  <option value="male">{t('gender_male')}</option>
                  <option value="female">{t('gender_female')}</option>
                  <option value="other">{t('gender_other')}</option>
                </select>
              </div>
              {fieldErrors.gender && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.gender.join(', ')}</p>
              )}
            </div>
          </div>
          {error && <div className="text-red-500 text-xs text-center mb-2">{error}</div>}
          <button 
            type="submit"
            className="w-full bg-primary text-white py-2.5 rounded-md font-bold text-[13px] uppercase tracking-widest hover:bg-opacity-90 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : <>Tạo tài khoản <UserPlus size={16} /></>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-theme text-center">
          <p className="text-xs text-[#718096]">
            Đã có tài khoản? <button onClick={() => onNavigate({ type: 'LOGIN' })} className="text-primary font-bold">Đăng nhập ngay</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterView;
