import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalFooter from './LegalFooter';

interface ComplianceInfoProps {
  rewardsEnabled?: boolean;
}

const ComplianceInfo: React.FC<ComplianceInfoProps> = ({ rewardsEnabled = true }) => {
  const { t } = useTranslation();

  return (
    <div className="mt-12 pb-12">
      {/* Pricing & Rules Container */}
      <div className="bg-indigo-50/40 border-indigo-200 border-2 border-dashed rounded-[32px] p-6 pt-10 relative shadow-sm">
        
        {/* Floating Category-style Header */}
        <div className="absolute -top-4 left-6 px-4 py-1.5 rounded-full bg-white border border-indigo-200 shadow-sm z-10 flex items-center gap-2">
           <span className="text-sm">💰</span>
           <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">{t('compliance.pricing_rules')}</span>
        </div>

        {/* Section Title: Credits */}
        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 ml-1">
          • {t('compliance.recharge_credits')}
        </div>
        
        {/* Credits Packs Grid */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          <div className="bg-white border-b-4 border-r-2 border-indigo-100 rounded-2xl p-5 flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all active:scale-95 group cursor-pointer">
            <span className="text-2xl font-black text-slate-800 group-hover:scale-110 transition-transform">12</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">$5 USD</span>
          </div>
          <div className="bg-white border-b-4 border-r-2 border-emerald-100 rounded-2xl p-5 flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all active:scale-95 group cursor-pointer">
            <span className="text-2xl font-black text-emerald-600 group-hover:scale-110 transition-transform">30</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">$10 USD</span>
          </div>
        </div>

        {rewardsEnabled && (
          <>
            {/* Section Title: Rewards */}
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 ml-1">
              • {t('compliance.free_gifts_referrals')}
            </div>
            
            {/* Free Gifts List */}
            <div className="space-y-3 mb-10">
              <div className="bg-white/80 border border-indigo-50 rounded-2xl p-4 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">🎁</div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-slate-700 leading-tight">
                    {t('compliance.monthly_gift')}: <span className="font-medium text-slate-500">{t('compliance.monthly_gift_desc')}</span>
                  </p>
                </div>
              </div>
              <div className="bg-white/80 border border-indigo-50 rounded-2xl p-4 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">📩</div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-slate-700 leading-tight">
                    {t('compliance.friend_reg')}: <span className="font-medium text-slate-500">{t('compliance.friend_reg_desc')}</span>
                  </p>
                </div>
              </div>
              <div className="bg-white/80 border border-indigo-50 rounded-2xl p-4 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">⭐</div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-slate-700 leading-tight">
                    {t('compliance.referral_pts_system')}: <span className="font-medium text-slate-500">{t('compliance.referral_pts_desc')}</span>
                  </p>
                </div>
              </div>
              <div className="bg-white/80 border border-indigo-50 rounded-2xl p-4 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">💰</div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-slate-700 leading-tight">
                    {t('compliance.referral_commission')}: <span className="font-medium text-slate-500">{t('compliance.commission_desc_full')}</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Contact Support */}
        <div className="text-center pt-2">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider">
            {t('compliance.need_help')} <span className="text-indigo-500 ml-1">408457641@QQ.COM</span>
          </p>
        </div>

        {/* Shared Legal Footer */}
        <LegalFooter className="mt-6" />
      </div>
    </div>
  );
};

export default ComplianceInfo;
