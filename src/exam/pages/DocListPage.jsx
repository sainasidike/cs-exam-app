import { useState, useEffect } from 'react';

export default function DocListPage({ files, onBack, onAddMore, onToolSelect, onExamAssistant }) {
  const [imageUrls, setImageUrls] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const urls = files.map(f => typeof f === 'string' ? f : URL.createObjectURL(f));
    setImageUrls(urls);
    return () => urls.forEach(u => { if (typeof files[0] !== 'string') URL.revokeObjectURL(u); });
  }, [files]);

  const handleSwipe = (dir) => {
    if (dir === 'left' && currentPage < files.length - 1) setCurrentPage(p => p + 1);
    if (dir === 'right' && currentPage > 0) setCurrentPage(p => p - 1);
  };

  const docTitle = `扫描全能王 ${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}`;

  return (
    <div className="dl-page">
      {toast && <div className="cs-toast">{toast}</div>}
      <div className="dl-header">
        <button className="dl-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="dl-header-title">{docTitle}</div>
        <div className="dl-header-actions">
          <button className="dl-header-icon-btn" onClick={() => showToast('标签功能开发中')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </button>
          <button className="dl-header-icon-btn" onClick={() => showToast('功能开发中')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button className="dl-header-icon-btn" onClick={() => showToast('功能开发中')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          </button>
          <button className="dl-header-icon-btn" onClick={() => showToast('功能开发中')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>
      </div>

      <div className="dl-preview"
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return;
          const diff = e.changedTouches[0].clientX - touchStart;
          if (diff > 50) handleSwipe('right');
          else if (diff < -50) handleSwipe('left');
          setTouchStart(null);
        }}
      >
        {imageUrls[currentPage] && (
          <img src={imageUrls[currentPage]} alt={`第${currentPage+1}页`} className="dl-preview-img" />
        )}
        {files.length > 1 && (
          <div className="dl-page-indicator">{currentPage + 1} / {files.length}</div>
        )}
      </div>

      {files.length > 1 && (
        <div className="dl-page-dots">
          {files.map((_, i) => (
            <div key={i} className={`dl-dot ${i === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(i)} />
          ))}
        </div>
      )}

      <div className="dl-bottom-bar">
        <button className="dl-bar-btn" onClick={onAddMore}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>添加</span>
        </button>
        <button className="dl-bar-btn" onClick={() => showToast('编辑功能开发中')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>编辑</span>
        </button>
        <button className="dl-bar-btn" onClick={() => showToast('分享功能开发中')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span>分享</span>
        </button>
        <button className="dl-bar-btn" onClick={() => showToast('转Word功能开发中')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13l2 3 2-3"/><path d="M9 17l2 3 2-3"/></svg>
          <span>转Word</span>
        </button>
        <button className="dl-bar-btn dl-bar-btn-highlight" onClick={onExamAssistant}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          <span>试卷智能助手</span>
        </button>
      </div>
    </div>
  );
}
