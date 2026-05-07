import React, { useEffect, useState, useRef } from 'react';
import { Save, User as UserIcon, Phone, Calendar, Users2, Upload, X, Camera, Trash2 } from 'lucide-react';
import { t } from '../../utils/translate';
import type { User } from '../../types';
import { fetchCustomerProfile, updateCustomerProfile } from '../../services/customerService';

interface CustomerProfileViewProps {
  currentUser: User | null;
  onUserUpdated?: (user: User) => void;
}

const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({ currentUser, onUserUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const currentAvatarUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '' as string,
    gender: '' as string,
    avatar_url: '' as string,
    height: '' as string,
    weight: '' as string,
    foot_length: '' as string,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await fetchCustomerProfile();
        setForm({
          first_name: profile.firstName || '',
          last_name: profile.lastName || '',
          phone_number: profile.phoneNumber || '',
          date_of_birth: (profile.dateOfBirth as any) || '',
          gender: (profile.gender as any) || '',
          avatar_url: (profile.avatarUrl as any) || '',
          height: profile.height != null ? String(profile.height) : '',
          weight: profile.weight != null ? String(profile.weight) : '',
          foot_length: profile.footLength != null ? String(profile.footLength) : '',
        });
        currentAvatarUrlRef.current = (profile.avatarUrl as any) || null;
        setAvatarPreview((profile.avatarUrl as any) || null);
      } catch (err: any) {
        setError(err.message || t('cannot_load_profile'));
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.role === 'customer') load();
  }, [currentUser]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(t('file_not_image'));
        return;
      }
      const maxSize = 15 * 1024 * 1024; // 15MB
      if (file.size > maxSize) {
        setError(t('image_too_large', { max: 15, actual: (file.size / 1024 / 1024).toFixed(2) }));
        return;
      }
      setAvatarFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedFile = () => {
    setAvatarFile(null);
    setAvatarPreview(currentAvatarUrlRef.current);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const selectedAvatarPreview = avatarPreview;
      const updated = await updateCustomerProfile(
        {
          first_name: form.first_name || undefined,
          last_name: form.last_name || undefined,
          phone_number: form.phone_number || undefined,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          height: form.height ? Number(form.height) : null,
          weight: form.weight ? Number(form.weight) : null,
          foot_length: form.foot_length ? Number(form.foot_length) : null,
        },
        avatarFile || undefined
      );

      const nextAvatarUrl = updated.avatarUrl || selectedAvatarPreview || form.avatar_url || null;
      const nextUser = { ...updated, avatarUrl: nextAvatarUrl };

      currentAvatarUrlRef.current = nextAvatarUrl;
      setForm((prev) => ({ ...prev, avatar_url: nextAvatarUrl || '' }));
      setAvatarPreview(nextAvatarUrl);
      
      setAvatarFile(null);
      setSuccess(true);
      onUserUpdated?.(nextUser);
    } catch (err: any) {
      setError(err.message || t('cannot_update_profile'));
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || currentUser.role !== 'customer') {
    return <div className="p-8 text-center text-gray-400">{t('please_login_customer')}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t('account_info')}</h1>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <UserIcon size={22} />
        </div>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
      {success && <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-600">{t('profile_updated_success')}</div>}

      {loading ? (
        <div className="py-20 text-center text-gray-400">{t('loading_profile')}</div>
      ) : (
        <form onSubmit={submit} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-primary/5 space-y-8">
          
          {/* PHẦN HIỂN THỊ AVATAR */}
          <div className="flex flex-col items-center sm:flex-row gap-8 pb-4 border-b border-gray-50">
            <div className="relative group">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 rounded-3xl overflow-hidden cursor-pointer ring-4 ring-gray-50 ring-offset-2 transition-all hover:ring-primary/20"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <UserIcon size={48} className="text-gray-300" />
                  </div>
                )}
                
                {/* Overlay khi hover */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-[10px] text-white font-bold uppercase">{t('change_photo')}</span>
                </div>
              </div>
              
              {/* Badge Icon Camera nhỏ */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white hover:scale-110 transition-transform"
              >
                <Camera size={16} />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <h3 className="text-lg font-bold text-gray-900">{form.first_name} {form.last_name}</h3>
              <p className="text-sm text-gray-500">{t('avatar_instruction')}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Upload size={14} /> {t('upload_new')}
                </button>
                
                {avatarFile && (
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} /> {t('cancel_upload')}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 pt-1 italic">{t('size_limit_caption', { max: 15 })}</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* CÁC TRƯỜNG NHẬP LIỆU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('last_name_placeholder')}</label>
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 font-bold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all"
                placeholder={t('last_name_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('first_name_placeholder')}</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 font-bold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all"
                placeholder={t('first_name_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Phone size={14} className="text-primary" /> {t('phone_number_label')}</label>
              <input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 font-bold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar size={14} className="text-primary" /> {t('date_of_birth_label')}</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 font-bold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Users2 size={14} className="text-primary" /> {t('gender_label')}</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 font-bold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all appearance-none shadow-sm shadow-black/5"
              >
                <option value="">{t('gender_not_selected')}</option>
                <option value="male">{t('gender_male')}</option>
                <option value="female">{t('gender_female')}</option>
                <option value="other">{t('gender_other')}</option>
              </select>
            </div>
          </div>

          {/* CHỈ SỐ CƠ THỂ */}
          <div className="pt-6 border-t border-gray-50">
            <div className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <span className="bg-primary/10 px-3 py-1 rounded-full">{t('measurements_section')}</span>
              <div className="flex-1 h-[1px] bg-gray-100"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('height_placeholder')} (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 font-bold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('weight_placeholder')} (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 font-bold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('foot_length_placeholder')} (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.foot_length}
                  onChange={(e) => setForm({ ...form, foot_length: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 font-bold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-3 ${saving ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-[1.02] hover:shadow-primary/40 active:scale-95'}`}
          >
            {saving ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? t('saving') : t('save_changes')}
          </button>
        </form>
      )}
    </div>
  );
};

export default CustomerProfileView;