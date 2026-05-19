import { useState, useEffect } from 'react';

export default function DocEditPage({ files, onConfirm, onBack }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState('smart-hd');
  const [rotation, setRotation] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [optimizing, setOptimizing] = useState(true);

  const filters = [
    { id: 'original', label: '原图' },
    { id: 'smart-hd', label: '智能高清', hot: true },
    { id: 'remove-shadow', label: '去阴影' },
    { id: 'remove-writing', label: '去除手写' },
    { id: 'brighten', label: '增亮' },
    { id: 'sharpen', label: '增强锐化' },
  ];

  useEffect(() => {
    const urls = files.map(f => typeof f === 'string' ? f : URL.createObjectURL(f));
    setImageUrls(urls);
    return () => urls.forEach(u => { if (typeof files[0] !== 'string') URL.revokeObjectURL(u); });
  }, [files]);

  useEffect(() => {
    setOptimizing(true);
    const t = setTimeout(() => setOptimizing(false), 2000);
    return () => clearTimeout(t);
  }, [activeFilter, currentPage]);

  const getFilterStyle = () => {
    let base = `rotate(${rotation}deg)`;
    switch(activeFilter) {
      case 'smart-hd': return { filter: 'contrast(1.15) brightness(1.05) saturate(1.05)', transform: base };
      case 'remove-shadow': return { filter: 'brightness(1.1) contrast(1.2)', transform: base };
      case 'remove-writing': return { filter: 'brightness(1.15) contrast(1.3) saturate(0.3)', transform: base };
      case 'brighten': return { filter: 'brightness(1.3)', transform: base };
      case 'sharpen': return { filter: 'contrast(1.4) brightness(1.05)', transform: base };
      default: return { transform: base };
    }
  };

  const handleRotate = () => setRotation(r => (r - 90) % 360);

  const handleDelete = () => {
    if (files.length <= 1) return;
    const newPage = currentPage >= files.length - 1 ? currentPage - 1 : currentPage;
    setCurrentPage(Math.max(0, newPage));
  };

  return (
    <div className="dep-page">
      {/* Header */}
      <div className="dep-header">
        <button className="dep-back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="dep-header-center">
          <span className="dep-header-title">扫描全能王 {new Date().toLocaleDateString('zh-CN', {year:'numeric',month:'numeric',day:'numeric'}).replace(/\//g,'-')} {new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}).replace(':','.')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" style={{marginLeft:4}}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
      </div>

      {/* Preview Area */}
      <div className="dep-preview">
        <div className="dep-preview-container">
          {files.length > 1 && (
            <button className="dep-delete-btn" onClick={handleDelete}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          )}
          {imageUrls[currentPage] && (
            <img
              src={imageUrls[currentPage]}
              alt="编辑预览"
              className="dep-preview-img"
              style={getFilterStyle()}
            />
          )}
        </div>
      </div>

      {/* Optimizing hint */}
      {optimizing && (
        <div className="dep-status-bar">
          <svg className="dep-status-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
          <span>「{filters.find(f => f.id === activeFilter)?.label || '智能高清'}」正在优化文档</span>
        </div>
      )}

      {/* Filter Thumbnails */}
      <div className="dep-filter-scroll">
        {filters.map(f => (
          <div key={f.id} className={`dep-filter-item ${activeFilter === f.id ? 'active' : ''}`} onClick={() => setActiveFilter(f.id)}>
            <div className="dep-filter-thumb">
              {imageUrls[currentPage] && (
                <img src={imageUrls[currentPage]} alt="" className="dep-filter-thumb-img" />
              )}
              {f.hot && <span className="dep-filter-hot">HOT</span>}
            </div>
            <span className="dep-filter-label">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom Toolbar */}
      <div className="dep-toolbar">
        <button className="dep-toolbar-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/><path d="M17 2l3 3-3 3" strokeWidth="2"/></svg>
          <span>重拍这张</span>
        </button>
        <button className="dep-toolbar-btn" onClick={handleRotate}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          <span>左转</span>
        </button>
        <button className="dep-toolbar-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><path d="M6.13 1L6 16a2 2 0 002 2h15"/><path d="M1 6.13L16 6a2 2 0 012 2v15"/></svg>
          <span>裁剪</span>
        </button>
        <button className="dep-toolbar-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><path d="M4 7V4a2 2 0 012-2h2"/><path d="M4 17v3a2 2 0 002 2h2"/><path d="M16 2h2a2 2 0 012 2v3"/><path d="M16 22h2a2 2 0 002-2v-3"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="17" y2="13"/><line x1="7" y1="17" x2="13" y2="17"/></svg>
          <span>提取文字</span>
        </button>
        <button className="dep-toolbar-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          <span>电子签</span>
        </button>
        <button className="dep-confirm-btn" onClick={() => onConfirm(files)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>

      {/* Multi-page dots */}
      {files.length > 1 && (
        <div className="dep-page-dots">
          {files.map((_, i) => (
            <div key={i} className={`dep-dot ${i === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
