import React, { useState, useEffect } from 'react';
import { Trash2, Edit3, Globe, Sparkles, Loader2 } from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';

interface LinkItem {
    id: string;
    title: string;
    url: string;
    logo_url: string;
    is_active: boolean;
    sort_order: number;
    translations: Record<string, string>;
}

interface BannerItem {
    id: string;
    image_url: string;
    sort_order: number;
}

interface VisitLog {
    link_id: string;
    ip_address: string;
    country: string;
    created_at: string;
}

interface LinktreeAdminProps {
    adminId: string;
}

const SUPPORTED_LOCALES = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'th', name: 'Thai' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'zh-TW', name: '繁体中文' }
];

const LinktreeAdmin: React.FC<LinktreeAdminProps> = ({ adminId }) => {
    const [activeTab, setActiveTab] = useState<'links' | 'banners' | 'stats'>('links');
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [banners, setBanners] = useState<BannerItem[]>([]);
    const [stats, setStats] = useState<VisitLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBannerModal, setShowBannerModal] = useState(false);
    const [editingLink, setEditingLink] = useState<Partial<LinkItem> | null>(null);
    const [newBanner, setNewBanner] = useState({ image_url: '', sort_order: 0 });
    const [translating, setTranslating] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadLinks(),
                loadBanners(),
                loadStats()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadLinks = async () => {
        try {
            const res = await fetch(getApiUrl('/api/linktree'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getAdminLinks', isAdmin: true })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`服务器错误 (${res.status}): ${text.slice(0, 100)}`);
            }
            const data = await res.json();
            if (data.success) setLinks(data.links);
        } catch (err: any) {
            console.error('[Load Links Failed]', err);
            alert('获取链接列表失败，请确认数据库表已创建: ' + err.message);
        }
    };

    const loadBanners = async () => {
        try {
            const res = await fetch(getApiUrl('/api/linktree'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getAdminBanners', isAdmin: true })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.success) setBanners(data.banners);
        } catch (err: any) {
            console.error('[Load Banners Failed]', err);
        }
    };

    const loadStats = async () => {
        try {
            const res = await fetch(getApiUrl('/api/linktree'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getStats', isAdmin: true })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`服务器错误 (${res.status}): ${text.slice(0, 100)}`);
            }
            const data = await res.json();
            if (data.success) setStats(data.visits);
        } catch (err: any) {
            console.error('[Load Stats Failed]', err);
            alert('获取访问统计失败: ' + err.message);
        }
    };

    const handleSaveLink = async () => {
        if (!editingLink?.title || !editingLink?.url) {
            alert('标题和 URL 不能为空');
            return;
        }

        setSaving(true);
        try {
            const isNew = !editingLink.id;
            const res = await fetch(getApiUrl('/api/linktree'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: isNew ? 'addLink' : 'updateLink', 
                    isAdmin: true, 
                    linkId: editingLink.id,
                    ...editingLink 
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`服务器返回错误 ${res.status}: ${errorText}`);
            }

            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                loadLinks();
                setEditingLink(null);
            } else {
                throw new Error(data.error || '保存失败，原因未知');
            }
        } catch (err: any) {
            console.error('[Save Link Failed]', err);
            alert('保存链接失败: ' + (err.message || '网络或服务器错误'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLink = async (linkId: string) => {
        if (!confirm('确定删除此链接及其统计数据吗？')) return;
        try {
            const res = await fetch(getApiUrl('/api/linktree'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteLink', isAdmin: true, linkId })
            });
            const data = await res.json();
            if (data.success) {
                loadLinks();
            } else {
                throw new Error(data.error || '删除失败');
            }
        } catch (err: any) {
            console.error('[Delete Link Failed]', err);
            alert('删除链接失败: ' + (err.message || '网络错误'));
        }
    };

    const handleAutoTranslate = async () => {
        if (!editingLink?.title) {
            alert('请先输入主标题');
            return;
        }
        setTranslating(true);
        try {
            const res = await fetch(getApiUrl('/api/linktree'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'translateTitles', isAdmin: true, title: editingLink.title })
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error('[Translation API Error Status]', res.status, errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    alert(`翻译失败 (${res.status}): ${errorJson.error || errorJson.message || '未知错误'}`);
                } catch (e) {
                    alert(`翻译失败: 服务器返回了错误状态码 ${res.status}`);
                }
                return;
            }

            const data = await res.json();
            if (data.success) {
                setEditingLink({
                    ...editingLink,
                    translations: {
                        ...(editingLink.translations || {}),
                        ...data.translations
                    }
                });
            } else {
                alert('自动翻译失败: ' + (data.error || '原因未知'));
            }
        } catch (err: any) {
            console.error('[Translation Request Failed]', err);
            alert('请求翻译接口失败: ' + (err.message || '网络或解析错误'));
        } finally {
            setTranslating(false);
        }
    };

    const handleAddBanner = async () => {
        if (!newBanner.image_url) {
            alert('需先上传或输入图片链接');
            return;
        }
        
        setSaving(true);
        try {
            const res = await fetch(getApiUrl('/api/linktree'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addBanner', isAdmin: true, ...newBanner })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`服务器返回错误 ${res.status}: ${errorText.slice(0, 100)}`);
            }

            const data = await res.json();
            if (data.success) {
                setShowBannerModal(false);
                loadBanners();
                setNewBanner({ image_url: '', sort_order: 0 });
            } else {
                throw new Error(data.error || '上传轮播图失败');
            }
        } catch (err: any) {
            console.error('[Add Banner Failed]', err);
            alert('上传轮播图失败: ' + (err.message || '可能是图片太大导致 Payload Too Large (建议 < 2MB)'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBanner = async (bannerId: string) => {
        if (!confirm('确定删除此轮播图吗？')) return;
        try {
            const res = await fetch(getApiUrl('/api/linktree'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteBanner', isAdmin: true, bannerId })
            });
            const data = await res.json();
            if (data.success) {
                loadBanners();
            } else {
                throw new Error(data.error || '删除失败');
            }
        } catch (err: any) {
            console.error('[Delete Banner Failed]', err);
            alert('删除轮播图失败: ' + (err.message || '网络错误'));
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'link' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                alert('图片文件太大，请选择 2MB 以下的图片');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (type === 'link') setEditingLink({ ...editingLink, logo_url: reader.result as string });
                else setNewBanner({ ...newBanner, image_url: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    }

    const openAddModal = () => {
        setEditingLink({ title: '', url: '', logo_url: '', is_active: true, sort_order: 0, translations: {} });
        setShowModal(true);
    };

    const openEditModal = (link: LinkItem) => {
        setEditingLink({ ...link });
        setShowModal(true);
    };

    if (loading) return <div className="p-8 text-center text-gray-400">加载数据中...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Linktree 导航中心</h2>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('links')} className={`px-4 py-1.5 rounded-lg text-sm transition-all ${activeTab === 'links' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-500'}`}>链接</button>
                    <button onClick={() => setActiveTab('banners')} className={`px-4 py-1.5 rounded-lg text-sm transition-all ${activeTab === 'banners' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-500'}`}>轮播图</button>
                    <button onClick={() => setActiveTab('stats')} className={`px-4 py-1.5 rounded-lg text-sm transition-all ${activeTab === 'stats' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-500'}`}>访客</button>
                </div>
            </div>

            {activeTab === 'links' && (
                <div className="space-y-4">
                    <button onClick={openAddModal} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all font-medium">
                        + 添加新导航链接
                    </button>

                    <div className="grid gap-4">
                        {links.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">暂无配置的链接</div>
                        ) : (
                            links.map((link) => (
                                <div key={link.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between group min-h-[5rem]">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                            {link.logo_url ? <img src={link.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">LOGO</div>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-700 truncate">{link.title}</div>
                                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[300px]">{link.url}</div>
                                            {link.translations && Object.keys(link.translations).length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    <Globe size={10} className="text-blue-400" />
                                                    <span className="text-[9px] text-blue-400 font-bold uppercase">含 {Object.keys(link.translations).length} 种语言</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${link.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {link.is_active ? '已启用' : '已禁用'}
                                        </div>
                                        <button onClick={() => openEditModal(link)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"><Edit3 size={18} /></button>
                                        <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'banners' && (
                <div className="space-y-4">
                    <button onClick={() => setShowBannerModal(true)} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all font-medium">
                        + 添加新轮播图 (16:9)
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {banners.length === 0 ? (
                            <div className="md:col-span-2 py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">暂无轮播图</div>
                        ) : (
                            banners.map((banner) => (
                                <div key={banner.id} className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 shadow-sm group bg-gray-100">
                                    <img src={banner.image_url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => handleDeleteBanner(banner.id)} className="p-2 bg-white text-rose-500 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                            <Trash2 size={24} />
                                        </button>
                                    </div>
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-bold backdrop-blur-md shadow-sm">
                                        排序: {banner.sort_order}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400 text-[10px] font-bold uppercase tracking-widest bg-gray-50">
                                    <th className="px-6 py-4">点击目标</th>
                                    <th className="px-6 py-4">访客 IP</th>
                                    <th className="px-6 py-4 text-center">国家/地区</th>
                                    <th className="px-6 py-4 text-right">时间</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-gray-400 text-sm">暂无访问数据</td>
                                    </tr>
                                ) : (
                                    stats.slice(0, 100).map((stat, idx) => {
                                        const matchedLink = links.find(l => l.id === stat.link_id);
                                        return (
                                            <tr key={`${stat.link_id}-${stat.created_at}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700 text-sm">{matchedLink ? matchedLink.title : <span className="text-gray-300">未知链接 (ID: {stat.link_id?.slice(0,8)})</span>}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{matchedLink?.url}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{stat.ip_address}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-center gap-1">
                                                        {stat.country && stat.country !== 'unknown' && stat.country !== 'LOCAL' ? (
                                                            <img 
                                                                src={`https://flagcdn.com/w40/${stat.country.toLowerCase()}.png`} 
                                                                className="w-5 shadow-sm rounded-sm" 
                                                                alt={stat.country} 
                                                            />
                                                        ) : (
                                                            <span className="text-sm">🌍</span>
                                                        )}
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.country}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-[10px] text-slate-400 font-medium">
                                                    {new Date(stat.created_at).toLocaleString('zh-CN', { 
                                                        month: 'numeric', 
                                                        day: 'numeric', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Link Modal */}
            {showModal && editingLink && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-black text-slate-800">{editingLink.id ? '编辑链接' : '添加新链接'}</h3>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors text-2xl">×</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">主标题 (默认/中文)</label>
                                            <button 
                                                onClick={handleAutoTranslate} 
                                                disabled={translating || !editingLink.title}
                                                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 hover:text-blue-600 disabled:opacity-50 transition-all px-2 py-1 bg-blue-50 rounded-lg"
                                            >
                                                {translating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                一键预生成全语种
                                            </button>
                                        </div>
                                        <input 
                                            value={editingLink.title} 
                                            onChange={e => setEditingLink({ ...editingLink, title: e.target.value })} 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm font-bold" 
                                            placeholder="例如：我的官方主页" 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">图标 LOGO</label>
                                        <div className="flex gap-4">
                                            <label className="w-24 h-24 shrink-0 cursor-pointer group relative">
                                                <div className="w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center overflow-hidden group-hover:border-blue-300 transition-colors">
                                                    {editingLink.logo_url ? <img src={editingLink.logo_url} className="w-full h-full object-cover" /> : <div className="text-slate-300 text-[10px] font-bold">点击上传</div>}
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'link')} />
                                            </label>
                                            <div className="flex-1">
                                                <textarea 
                                                    value={editingLink.logo_url} 
                                                    onChange={e => setEditingLink({ ...editingLink, logo_url: e.target.value })} 
                                                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[10px] text-slate-400 outline-none focus:border-blue-300 resize-none font-mono" 
                                                    placeholder="或在此粘贴图片 URL" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">跳转目标 URL</label>
                                        <input 
                                            value={editingLink.url} 
                                            onChange={e => setEditingLink({ ...editingLink, url: e.target.value })} 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-700 outline-none focus:border-blue-400 text-sm font-mono" 
                                            placeholder="https://..." 
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">排序优先级</label>
                                            <input 
                                                type="number" 
                                                value={editingLink.sort_order} 
                                                onChange={e => setEditingLink({ ...editingLink, sort_order: parseInt(e.target.value) || 0 })} 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-700 outline-none focus:border-blue-400 text-sm font-bold" 
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-end">
                                            <button 
                                                onClick={() => setEditingLink({ ...editingLink, is_active: !editingLink.is_active })} 
                                                className={`w-full h-[3.5rem] rounded-2xl font-black text-xs transition-all ${editingLink.is_active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-200 text-slate-500'}`}
                                            >
                                                {editingLink.is_active ? '✅ 已开启显示' : '❌ 已隐藏'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Globe size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">多语言版本预览与微调</span>
                                    </div>
                                    
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {SUPPORTED_LOCALES.map((locale) => (
                                            <div key={locale.code}>
                                                <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">{locale.name} ({locale.code})</label>
                                                <input 
                                                    value={editingLink.translations?.[locale.code] || ''} 
                                                    onChange={e => {
                                                        const newTrans = { ...(editingLink.translations || {}) };
                                                        newTrans[locale.code] = e.target.value;
                                                        setEditingLink({ ...editingLink, translations: newTrans });
                                                    }}
                                                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs text-slate-600 outline-none focus:border-blue-300" 
                                                    placeholder={`未生成 ${locale.name} 版本`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-50 flex gap-4 shrink-0">
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleSaveLink} 
                                disabled={saving}
                                className="flex-[2] py-4 rounded-2xl font-black bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:grayscale-[0.5]"
                            >
                                {saving ? <Loader2 size={20} className="animate-spin" /> : null}
                                {saving ? '正在保存...' : (editingLink.id ? '确认修改' : '确认并保存')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner Modal */}
            {showBannerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-gray-800">添加轮播图 (16:9)</h3>
                            <button onClick={() => setShowBannerModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">上传轮播图片</label>
                                <label className="block w-full cursor-pointer">
                                    <div className="w-full aspect-[16/9] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden">
                                        {newBanner.image_url ? (
                                            <img src={newBanner.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <div className="text-3xl mb-2">📸</div>
                                                <div className="text-gray-400 text-xs font-bold">点击上传本地图片</div>
                                                <div className="text-gray-300 text-[10px] mt-1">推荐比例 1600 x 900</div>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">或图片 URL</label>
                                <input value={newBanner.image_url} onChange={e => setNewBanner({ ...newBanner, image_url: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-700 outline-none focus:border-blue-400" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">显示顺序</label>
                                <input type="number" value={newBanner.sort_order} onChange={e => setNewBanner({ ...newBanner, sort_order: parseInt(e.target.value) || 0 })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-700 outline-none focus:border-blue-400" />
                            </div>
                            <button 
                                onClick={handleAddBanner} 
                                disabled={saving}
                                className="w-full bg-blue-600 text-white h-16 rounded-[1.5rem] font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:grayscale-[0.5]"
                            >
                                {saving ? <Loader2 size={20} className="animate-spin" /> : null}
                                {saving ? '正在处理...' : '确认并上传'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LinktreeAdmin;
