import { useState, useMemo } from 'react';

const PER_PAGE = 5;

export default function PracticePaperPage({ paper, onBack }) {
  const [activePage, setActivePage] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [toast, setToast] = useState(null);

  const isBlank = paper?.type === 'blank';

  const pages = useMemo(() => {
    if (!paper) return [];
    if (isBlank) {
      return (paper.images || []).map((img, i) => ({ type: 'image', data: img, index: i }));
    }
    const qs = paper.questions;
    const questionPages = [];
    for (let i = 0; i < qs.length; i += PER_PAGE) {
      questionPages.push(qs.slice(i, i + PER_PAGE));
    }
    return [...questionPages.map((chunk, idx) => ({ type: 'questions', data: chunk, startNum: idx * PER_PAGE + 1 })),
      { type: 'answers', data: qs }];
  }, [paper]);

  const totalPages = pages.length;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSwipe = (dir) => {
    if (dir === 'left' && activePage < totalPages - 1) setActivePage(p => p + 1);
    if (dir === 'right' && activePage > 0) setActivePage(p => p - 1);
  };

  if (!paper || pages.length === 0) return null;

  const current = pages[activePage];

  return (
    <div className="pp-page">
      {toast && <div className="cs-toast">{toast}</div>}

      <div className="pp-header">
        <button className="pp-back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="pp-header-title">{paper.title}</div>
        <div className="pp-header-actions">
          <button className="pp-header-icon" onClick={() => showToast('标签功能开发中')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </button>
          <button className="pp-header-icon" onClick={() => showToast('更多功能开发中')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>
      </div>

      <div className="pp-doc-area"
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return;
          const diff = e.changedTouches[0].clientX - touchStart;
          if (diff > 50) handleSwipe('right');
          else if (diff < -50) handleSwipe('left');
          setTouchStart(null);
        }}
      >
        <div className="pp-doc-page-wrap">
          {current.type === 'image' ? (
            <div className="pp-doc-page pp-doc-page-img">
              <img src={current.data} alt={`第${current.index + 1}页`} className="pp-blank-img" />
            </div>
          ) : current.type === 'questions' ? (
            <div className="pp-doc-page">
              {activePage === 0 && (
                <>
                  <div className="pp-page-title">{paper.title}</div>
                  <div className="pp-page-subtitle">{paper.subject} · 共{paper.questions.length}题 · {paper.date}</div>
                </>
              )}
              {activePage > 0 && current.type === 'questions' && (
                <div className="pp-page-subtitle" style={{textAlign:'right',marginBottom:12}}>续第{activePage}页</div>
              )}
              <div className="pp-page-divider" />
              {current.data.map((q, i) => (
                <div key={i} className="pp-doc-question">
                  <p className="pp-doc-q-text"><span className="pp-doc-q-num">{current.startNum + i}.</span>{q.question || q.content}</p>
                  {q.options && q.options.length > 0 && (
                    <div className="pp-doc-q-options">
                      {q.options.map((opt, j) => (
                        <p key={j} className="pp-doc-q-opt">{opt}</p>
                      ))}
                    </div>
                  )}
                  {!q.options && (
                    <div className="pp-doc-q-blank">
                      <span>答：</span>
                      <span className="pp-doc-q-line" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="pp-doc-page">
              <div className="pp-page-title">{paper.title} · 答案</div>
              <div className="pp-page-divider" />
              {current.data.map((q, i) => (
                <div key={i} className="pp-doc-answer">
                  <p className="pp-doc-a-text">
                    <span className="pp-doc-a-num">{i + 1}.</span>
                    <span className="pp-doc-a-val">{q.options ? q.answer : q.answer}</span>
                  </p>
                  {q.explanation && <p className="pp-doc-a-explain">{q.explanation}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pp-page-indicator">
          {pages.map((_, i) => (
            <div key={i} className={`pp-dot ${i === activePage ? 'active' : ''}`} onClick={() => setActivePage(i)} />
          ))}
        </div>
        <div className="pp-page-label">
          {isBlank ? `空白卷` : current.type === 'questions' ? `题目 ${activePage + 1}/${totalPages - 1}` : '答案卷'} · 第{activePage + 1}页/共{totalPages}页
        </div>
      </div>

      <div className="pp-toolbar">
        <button className="pp-tool-item" onClick={() => showToast('添加功能开发中')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="17.5" y1="14" x2="17.5" y2="21"/><line x1="14" y1="17.5" x2="21" y2="17.5"/></svg>
          <span>添加</span>
        </button>
        <button className="pp-tool-item" onClick={() => showToast('编辑功能开发中')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>编辑</span>
        </button>
        <button className="pp-tool-item" onClick={() => showToast('分享功能开发中')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          <span>分享</span>
        </button>
        <button className="pp-tool-item" onClick={() => showToast('转Word功能开发中')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>转 Word</span>
        </button>
        <button className="pp-tool-item" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          <span>试卷助手</span>
        </button>
      </div>
    </div>
  );
}
