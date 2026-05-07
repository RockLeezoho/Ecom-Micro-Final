import React from 'react';
import { Clock3, Mail, MapPin, MessageCircle, PhoneCall, Send } from 'lucide-react';
import { t } from '../../utils/translate';

const ContactView: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white border border-border-theme rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-3">
          <MessageCircle size={14} />
          {t('contact_title_badge')}
        </div>
        <h1 className="text-2xl font-black text-[#2D3748] tracking-tight mb-2">
          {t('contact_title')}
        </h1>
        <p className="text-sm text-[#718096]">
          {t('contact_description')}
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-border-theme rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <PhoneCall size={16} />
            {t('contact_hotline')}
          </div>
          <p className="text-sm text-[#2D3748] font-black">1900 1234</p>
          <p className="text-xs text-[#718096] mt-1">{t('contact_hotline_hours')}</p>
        </div>

        <div className="bg-white border border-border-theme rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <Mail size={16} />
            {t('contact_email')}
          </div>
          <p className="text-sm text-[#2D3748] font-black">support@becshop.vn</p>
          <p className="text-xs text-[#718096] mt-1">{t('contact_email_response')}</p>
        </div>

        <div className="bg-white border border-border-theme rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <MapPin size={16} />
            {t('contact_office')}
          </div>
          <p className="text-sm text-[#2D3748] font-black">Hà Nội, Việt Nam</p>
          <p className="text-xs text-[#718096] mt-1">{t('contact_office_info')}</p>
        </div>
      </section>

      <section className="bg-white border border-border-theme rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-black text-[#2D3748] mb-4 uppercase tracking-wider">{t('contact_form_title')}</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={t('contact_form_name')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <input
            type="email"
            placeholder={t('contact_form_email')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <input
            type="text"
            placeholder={t('contact_form_phone')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <input
            type="text"
            placeholder={t('contact_form_subject')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <textarea
            placeholder={t('contact_form_message')}
            className="md:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[120px] focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          />
          <div className="md:col-span-2 flex items-center justify-between">
            <div className="text-xs text-[#718096] inline-flex items-center gap-1">
              <Clock3 size={12} />
              {t('contact_form_processing_time')}
            </div>
            <button type="button" className="btn-dense bg-primary text-white text-xs font-bold px-4 py-2 inline-flex items-center gap-1">
              <Send size={14} />
              {t('contact_form_submit')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ContactView;
