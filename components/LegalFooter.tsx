import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LegalFooterProps {
  className?: string;
}

const LegalFooter: React.FC<LegalFooterProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

  const policies = [
    { key: 'terms', title: t('compliance.terms_of_service'), content: t('compliance.terms_content') },
    { key: 'privacy', title: t('compliance.privacy_policy'), content: t('compliance.privacy_content') },
    { key: 'refund', title: t('compliance.refund_policy'), content: t('compliance.refund_content') },
  ];

  return (
    <div className={`mt-8 pb-12 ${className}`}>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4">
        {policies.map(policy => (
          <button 
            key={policy.key}
            onClick={() => setModalContent({ title: policy.title, content: policy.content })} 
            className="hover:text-pink-500 transition-colors"
          >
            {policy.title}
          </button>
        ))}
        <a href="mailto:408457641@qq.com" className="hover:text-pink-500 transition-colors uppercase">{t('compliance.contact_us')}</a>
      </div>
      
      <p className="text-center text-[9px] text-slate-300 uppercase tracking-[0.3em] font-bold italic">
        © {new Date().getFullYear()} MEILI LAB. ALL RIGHTS RESERVED.
      </p>

      {/* Policy Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 overflow-hidden">
          <div className="bg-white rounded-[40px] w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-pink-50">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{modalContent.title}</h3>
              <button
                onClick={() => setModalContent(null)}
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap font-medium">
              {modalContent.content}
            </div>
            <div className="p-6 border-t border-slate-50">
              <button
                onClick={() => setModalContent(null)}
                className="w-full py-3 text-[12px] font-bold bg-pink-500 text-white rounded-xl active:scale-95 transition-transform"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalFooter;
