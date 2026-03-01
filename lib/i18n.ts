import { useState } from 'react';

export type Language = 'en' | 'vi' | 'ko' | 'ja' | 'zh';

export const translations: Record<Language, any> = {
    en: {
        home: 'Home',
        login: 'Login',
        me: 'Me',
        admin: 'Admin',
        love_fortune: 'Love Destiny',
        wealth_fortune: 'Wealth Fortune',
        download_app: 'Download App',
        start_analysis: 'Start Analysis',
        check_credits: 'Check Credits',
        insufficient_credits: 'Insufficient credits. Please recharge.',
        referral_reward_system: 'Referral Reward System',
        referral_commission: 'Referral Commission',
        remaining_credits: 'Remaining Credits',
        earn_big: 'Earn Big',
        unsettled_commission: 'Unsettled Commission',
        birth_date: 'Birth Date (Solar)',
        birth_time: 'Birth Time',
        gender: 'Gender',
        male: 'Male',
        female: 'Female',
        upload_photo: 'Upload Frontal Photo (Optional)',
        photo_extra_quota: 'Uploading a photo will use an extra credit.',
        partner_appearance: 'Partner Appearance Generation',
        start_prediction: 'Start Prediction',
        back: 'Back',
        daily_guide: 'Daily Guide',
        save: 'Save',
        on: 'ON',
        off: 'OFF'
    },
    vi: {
        home: 'Trang chủ',
        login: 'Đăng nhập',
        me: 'Của tôi',
        admin: 'Quản trị',
        love_fortune: 'Xem Tình Duyên',
        wealth_fortune: 'Xem Tài Lộc',
        download_app: 'Tải Ứng Dụng',
        start_analysis: 'Bắt đầu phân tích',
        check_credits: 'Kiểm tra tín dụng',
        insufficient_credits: 'Không đủ tín dụng. Vui lòng nạp thêm.',
        referral_reward_system: 'Hệ thống thưởng giới thiệu',
        referral_commission: 'Kiếm hoa hồng giới thiệu',
        birth_date: 'Ngày sinh (Dương lịch)',
        birth_time: 'Giờ sinh',
        gender: 'Giới tính',
        male: 'Nam',
        female: 'Nữ',
        upload_photo: 'Tải ảnh chân dung (Tùy chọn)',
        photo_extra_quota: 'Tải ảnh lên sẽ tốn thêm một lượt sử dụng.',
        partner_appearance: 'Tạo hình dáng người bạn đời lý tưởng',
        start_prediction: 'Bắt đầu dự đoán',
        back: 'Quay lại',
        daily_guide: 'Hướng dẫn hàng ngày',
        save: 'Lưu',
        on: 'BẬT',
        off: 'TẮT'
    },
    ko: {
        home: '홈',
        login: '로그인',
        me: '내 정보',
        admin: '관리자',
        love_fortune: '연애운 보기',
        wealth_fortune: '재물운 보기',
        download_app: '앱 다운로드',
        start_analysis: '분석 시작',
        check_credits: '크레딧 확인',
        insufficient_credits: '크레딧이 부족합니다. 충전해 주세요.',
        referral_reward_system: '추천 보너스 시스템',
        referral_commission: '추천 커미션 벌기',
        birth_date: '생년월일 (양력)',
        birth_time: '태어난 시간',
        gender: '성별',
        male: '남성',
        female: '여성',
        upload_photo: '정면 사진 업로드 (선택 사항)',
        photo_extra_quota: '사진을 업로드하면 추가 크레딧이 차감됩니다.',
        partner_appearance: '이상적인 배우자 외모 생성',
        start_prediction: '예측 시작',
        back: '뒤로',
        daily_guide: '일일 가이드',
        save: '저장',
        on: '켜짐',
        off: '꺼짐'
    },
    ja: {
        home: 'ホーム',
        login: 'ログイン',
        me: 'マイページ',
        admin: '管理者',
        love_fortune: '恋愛運',
        wealth_fortune: '金運',
        download_app: 'アプリをダウンロード',
        start_analysis: '解析開始',
        check_credits: 'クレジット確認',
        insufficient_credits: 'クレジットが不足しています。チャージしてください。',
        referral_reward_system: '紹介報酬システム',
        referral_commission: '紹介コミッションを稼ぐ',
        birth_date: '生年月日 (陽暦)',
        birth_time: '出生時間',
        gender: '性別',
        male: '男性',
        female: '女性',
        upload_photo: '正面写真をアップロード (オプション)',
        photo_extra_quota: '写真をアップロードすると追加のクレジットが消費されます。',
        partner_appearance: '理想のパートナーの容姿生成',
        start_prediction: '予測開始',
        back: '戻る',
        daily_guide: 'デイリーガイド',
        save: '保存',
        on: 'オン',
        off: 'オフ'
    },
    zh: {
        home: '首页',
        login: '登录',
        me: '我的',
        admin: '管理',
        love_fortune: '看姻缘',
        wealth_fortune: '看财富',
        download_app: '下载 APP',
        start_analysis: '开始分析',
        check_credits: '检查余额',
        insufficient_credits: '余额不足，请充值。',
        referral_reward_system: '推荐奖励积分制度',
        referral_commission: '推荐赚佣金',
        birth_date: '出生日期 (公历)',
        birth_time: '出生时辰',
        gender: '性别',
        male: '男',
        female: '女',
        upload_photo: '上传正面照片 (可选)',
        photo_extra_quota: '上传照片将额外扣除一次额度',
        partner_appearance: '生成理想另一半相貌',
        start_prediction: '开始预测',
        back: '返回',
        daily_guide: '每日指南',
        save: '保存',
        on: '开启',
        off: '关闭'
    }
};

export const useTranslation = () => {
    const [lang, setLang] = useState<Language>(() => {
        return (localStorage.getItem('lang') as Language) || 'en';
    });

    const t = (key: string) => {
        return translations[lang]?.[key] || key;
    };

    const changeLanguage = (newLang: Language) => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    return { t, lang, changeLanguage };
};
