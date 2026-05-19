import { useState, useEffect, useRef } from 'react';

export default function DocPreviewPage({ uploadedFiles, onCancel, onConfirm, onScanAdd }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const urls = uploadedFiles.map(f => typeof f === 'string' ? f : URL.createObjectURL(f));
    setImageUrls(urls);
    return () => urls.forEach(u => { if (typeof uploadedFiles[0] !== 'string') URL.revokeObjectURL(u); });
  }, [uploadedFiles]);

  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const targetX = currentPage * container.clientWidth;
      container.scrollTo({ left: targetX, behavior: 'smooth' });
    }
  }, [currentPage]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const page = Math.round(container.scrollLeft / container.clientWidth);
      if (page !== currentPage && page >= 0 && page < uploadedFiles.length) {
        setCurrentPage(page);
      }
    }
  };

  const handlePrev = () => setCurrentPage(p => Math.max(0, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(uploadedFiles.length - 1, p + 1));

  return (
    <div className="dsp-page">
      <div className="dsp-header">
        <button className="dsp-header-btn" onClick={onCancel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="dsp-header-title">试卷预览</div>
        <div className="dsp-header-right" />
      </div>

      <div className="dsp-preview-area">
        <div className="dsp-scroll" ref={scrollRef} onScroll={handleScroll}>
          {imageUrls.map((url, i) => (
            <div key={i} className="dsp-slide">
              <img src={url} alt={`第${i + 1}页`} className="dsp-slide-img" />
            </div>
          ))}
        </div>

        {uploadedFiles.length > 1 && (
          <>
            <button className="dsp-arrow dsp-arrow-left" onClick={handlePrev} disabled={currentPage === 0}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="dsp-arrow dsp-arrow-right" onClick={handleNext} disabled={currentPage === uploadedFiles.length - 1}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 6 15 12 9 18"/></svg>
            </button>
          </>
        )}
      </div>

      <div className="dsp-page-indicator">
        {uploadedFiles.length > 1 && (
          <div className="dsp-dots">
            {uploadedFiles.map((_, i) => (
              <div key={i} className={`dsp-dot ${i === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(i)} />
            ))}
          </div>
        )}
        <span className="dsp-page-num">{currentPage + 1} / {uploadedFiles.length} 页</span>
      </div>

      <div className="dsp-bottom">
        <button className="dsp-scan-btn" onClick={onScanAdd}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
        <button className="dsp-confirm-btn" onClick={() => onConfirm()}>
          开始批改 ({uploadedFiles.length}页)
        </button>
      </div>
    </div>
  );
}
