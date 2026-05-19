import { useState, useEffect } from 'react';
import { EXAM_DOCUMENTS, CACHED_EXAM_RESULTS } from '../cachedExams.js';
import { getExamLibrary, getWrongQuestions } from '../services/storageService.js';

const SCENE_COUNT = 3;

export default function ExamEntryPage({ onBack, onScan, onSelectDoc, onDemo, onSelectCachedExam, onLibrary, onFeature, onQuickGrade }) {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [libraryCount, setLibraryCount] = useState(0);
  const [subjectCounts, setSubjectCounts] = useState({});
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    const lib = getExamLibrary();
    setLibraryCount(lib.length);
    const sc = {};
    lib.forEach(e => { const s = e.subject || '未分类'; sc[s] = (sc[s] || 0) + 1; });
    setSubjectCounts(sc);
    setWrongCount(getWrongQuestions().length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % SCENE_COUNT);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const subjectKeys = Object.keys(subjectCounts);

  const docHasResult = (docId) => !!CACHED_EXAM_RESULTS[docId];

  const getDocScore = (docId) => {
    const r = CACHED_EXAM_RESULTS[docId];
    if (!r) return null;
    const qs = r.questions || [];
    const correct = qs.filter(q => q.correct).length;
    return qs.length > 0 ? Math.round(correct / qs.length * 100) : null;
  };

  return (
    <div className="ee-page">
      <div className="ee-top">
        <button className="ee-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span>返回工具箱</span>
        </button>
      </div>

      {/* Hero 场景轮播 — 视觉优先 */}
      <div className={`ee-hero-carousel ee-hero-scene-${carouselIdx}`} key={carouselIdx}>

        {/* 场景0: 智能批改 */}
        {carouselIdx === 0 && (
          <div className="ee-scene ee-scene-grade">
            <div className="ee-scene-visual">
              <div className="ee-scene-paper">
                <img src="/exams/7dHyKX2haYaA57aBFW694CAS.jpg" alt="" className="ee-scene-paper-img" />
                <div className="ee-scene-marks">
                  <span className="ee-mark ee-mark-correct" style={{top:'18%',left:'12%'}}>&#10003;</span>
                  <span className="ee-mark ee-mark-wrong" style={{top:'38%',left:'15%'}}>&#10007;</span>
                  <span className="ee-mark ee-mark-correct" style={{top:'55%',left:'10%'}}>&#10003;</span>
                  <span className="ee-mark ee-mark-wrong" style={{top:'72%',left:'18%'}}>&#10007;</span>
                  <span className="ee-mark ee-mark-correct" style={{top:'28%',left:'60%'}}>&#10003;</span>
                </div>
              </div>
              <div className="ee-scene-score-ring">
                <svg viewBox="0 0 80 80" className="ee-ring-svg">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e0e0e0" strokeWidth="5"/>
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#4CAF50" strokeWidth="5"
                    strokeDasharray="160 214" strokeLinecap="round" transform="rotate(-90 40 40)"/>
                </svg>
                <div className="ee-ring-text">
                  <span className="ee-ring-num">85</span>
                  <span className="ee-ring-unit">分</span>
                </div>
              </div>
            </div>
            <div className="ee-scene-stats">
              <span className="ee-stat ee-stat-ok">&#10003; 对7题</span>
              <span className="ee-stat ee-stat-err">&#10007; 错3题</span>
              <span className="ee-stat ee-stat-weak">&#9889; 薄弱: 统计图</span>
            </div>
            <div className="ee-scene-bottom">
              <div className="ee-scene-info">
                <h2 className="ee-scene-title">智能批改</h2>
                <p className="ee-scene-desc">拍一拍，AI 秒出成绩</p>
              </div>
              <button className="ee-scene-cta" onClick={onDemo}>体验 &#9654;</button>
            </div>
          </div>
        )}

        {/* 场景1: 错题 → 练习 */}
        {carouselIdx === 1 && (
          <div className="ee-scene ee-scene-wrong">
            <div className="ee-scene-visual">
              <div className="ee-scene-card ee-card-wrong">
                <div className="ee-card-badge ee-badge-wrong">&#10007;</div>
                <div className="ee-card-body">
                  <span className="ee-card-tag">抽样方法</span>
                  <p className="ee-card-q">为了了解某地区老年人的健康状况，抽样比较合理的是</p>
                  <div className="ee-card-ans">
                    <span className="ee-card-ans-wrong">你: B</span>
                    <span className="ee-card-ans-right">答: D</span>
                  </div>
                </div>
              </div>
              <div className="ee-scene-arrow-wrap">
                <div className="ee-scene-arrow-line"/>
                <span className="ee-scene-arrow-label">AI</span>
              </div>
              <div className="ee-scene-card ee-card-practice">
                <div className="ee-card-badge ee-badge-practice">&#9734;</div>
                <div className="ee-card-body">
                  <span className="ee-card-tag">同类新题</span>
                  <p className="ee-card-q">某校调查1500名学生体质，以下方案合理的是</p>
                  <div className="ee-card-ans">
                    <span className="ee-card-ans-new">A / B / C / D</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ee-scene-topics">
              <span className="ee-topic-pill">抽样方法</span>
              <span className="ee-topic-pill">总体与样本</span>
              <span className="ee-topic-pill">统计图</span>
            </div>
            <div className="ee-scene-bottom">
              <div className="ee-scene-info">
                <h2 className="ee-scene-title">错题 &#8594; 练习</h2>
                <p className="ee-scene-desc">错题自动归集，AI 生成同类新题</p>
              </div>
              <button className="ee-scene-cta ee-cta-warm" onClick={() => onFeature && onFeature('wrongbook')}>查看 &#9654;</button>
            </div>
          </div>
        )}

        {/* 场景2: 去手写对比 */}
        {carouselIdx === 2 && (
          <div className="ee-scene ee-scene-blank">
            <div className="ee-scene-visual ee-scene-compare">
              <div className="ee-compare-stack">
                <div className="ee-compare-item">
                  <div className="ee-compare-tag">原卷</div>
                  <img src="/exams/5NFfaS5PHSg81Ff2K20a8daY.jpg" alt="" className="ee-compare-img" />
                </div>
                <div className="ee-compare-arrow-h">
                  <span className="ee-compare-spark">&#10024;</span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </div>
                <div className="ee-compare-item">
                  <div className="ee-compare-tag ee-compare-tag-clean">空白卷</div>
                  <img src="/exams/5NFfaS5PHSg81Ff2K20a8daY.jpg" alt="" className="ee-compare-img ee-compare-clean" />
                </div>
              </div>
            </div>
            <div className="ee-scene-bottom">
              <div className="ee-scene-info">
                <h2 className="ee-scene-title">一键去手写</h2>
                <p className="ee-scene-desc">去除笔迹，打印重做一遍</p>
              </div>
              <button className="ee-scene-cta ee-cta-cool" onClick={onDemo}>体验 &#9654;</button>
            </div>
          </div>
        )}

        <div className="ee-hero-dots">
          {[0,1,2].map(i => (
            <span key={i} className={`ee-hero-dot ${i === carouselIdx ? 'active' : ''}`}
              onClick={() => setCarouselIdx(i)} />
          ))}
        </div>
      </div>

      {/* AI 功能 */}
      <div className="ee-section">
        <h3 className="ee-section-title">AI 功能</h3>
        <div className="ee-func-grid">
          <button className="ee-func-card" onClick={onQuickGrade || onScan}>
            <div className="ee-func-icon" style={{ background: '#E8F5E9' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            <span className="ee-func-label">拍照批改</span>
          </button>
          <button className="ee-func-card" onClick={() => onFeature && onFeature('wrongbook')}>
            <div className="ee-func-icon" style={{ background: '#FFF3E0' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            </div>
            <span className="ee-func-label">错题本</span>
            {wrongCount > 0 && <span className="ee-func-badge">{wrongCount}</span>}
          </button>
          <button className="ee-func-card" onClick={() => onFeature && onFeature('review')}>
            <div className="ee-func-icon" style={{ background: '#E3F2FD' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>
            </div>
            <span className="ee-func-label">智能复习</span>
          </button>
          <button className="ee-func-card" onClick={() => onFeature && onFeature('report')}>
            <div className="ee-func-icon" style={{ background: '#F3E5F5' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            </div>
            <span className="ee-func-label">学习报告</span>
          </button>
        </div>
      </div>

      {/* 试卷文档 */}
      <div className="ee-section">
        <h3 className="ee-section-title">试卷文档</h3>
        <div className="ee-action-row">
          <button className="ee-action-card" onClick={onScan}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
            <span>扫描</span>
          </button>
          <button className="ee-action-card" onClick={onSelectDoc}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>选择文档</span>
          </button>
        </div>

        {onLibrary && (
          <div className="eh-library-entry" onClick={onLibrary} style={{ marginTop: 12 }}>
            <div className="eh-library-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="13" y2="11"/></svg>
            </div>
            <div className="eh-library-text">
              <span className="eh-library-title">我的试卷库</span>
              {libraryCount > 0 ? (
                <span className="eh-library-hint">
                  已自动分类 {libraryCount} 份试卷 · {subjectKeys.length} 个科目
                  {subjectKeys.length > 0 && (
                    <span className="ee-lib-subjects">
                      {subjectKeys.slice(0, 3).map(s => (
                        <span key={s} className="ee-lib-subject-tag">{s} {subjectCounts[s]}</span>
                      ))}
                    </span>
                  )}
                </span>
              ) : (
                <span className="eh-library-hint">查看历史试卷和批改记录</span>
              )}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )}
        <div className="ee-doc-list">
          {EXAM_DOCUMENTS.map(doc => {
            const score = getDocScore(doc.id);
            const hasResult = docHasResult(doc.id);
            return (
              <div key={doc.id} className="ee-doc-row" onClick={() => onSelectCachedExam(doc.id)}>
                <div className="ee-doc-thumb">
                  <img src={doc.thumb} alt={doc.title} className="ee-doc-thumb-img" />
                </div>
                <div className="ee-doc-info">
                  <span className="ee-doc-title">{doc.title}</span>
                  <span className="ee-doc-meta">{doc.subtitle} | {doc.date} | {doc.pages}页</span>
                </div>
                {hasResult ? (
                  <span className="ee-doc-ai-tag ee-doc-ai-graded">{score}%</span>
                ) : (
                  <span className="ee-doc-ai-tag ee-doc-ai-ready">可批改</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
