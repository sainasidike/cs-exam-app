import { useState, useEffect } from 'react';
import { saveExamToLibrary, savePracticePaper } from '../services/storageService.js';
import { generatePractice } from '../services/ocrService.js';
import { CACHED_EXAM_RESULTS, EXAM_DOCUMENTS } from '../cachedExams.js';

export default function ExamWorkbench({ files, cachedExamId, onBack, onGrade, onStar, onAddMore, isGraded, isSaved, gradeResult, onSavePractice, onSaveBlank }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [starred, setStarred] = useState(isSaved || false);
  const [aiLabel, setAiLabel] = useState(null);
  const [toast, setToast] = useState(null);
  const [subPage, setSubPage] = useState(null);
  const [blankProgress, setBlankProgress] = useState(0);
  const [blankReady, setBlankReady] = useState(false);
  const [blankStage, setBlankStage] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [practiceProgress, setPracticeProgress] = useState(0);
  const [practiceReady, setPracticeReady] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(true);
  const [visibleLines, setVisibleLines] = useState(0);

  const cachedResult = cachedExamId ? CACHED_EXAM_RESULTS[cachedExamId] : null;
  const cachedDoc = cachedExamId ? EXAM_DOCUMENTS.find(d => d.id === cachedExamId) : null;
  const displayResult = gradeResult || cachedResult;


  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const urls = files.map(f => typeof f === 'string' ? f : URL.createObjectURL(f));
    setImageUrls(urls);
    return () => urls.forEach(u => { if (typeof files[0] !== 'string') URL.revokeObjectURL(u); });
  }, [files]);

  const getAiLines = () => {
    if (!displayResult) return [];
    const qs = displayResult.questions || [];
    const total = qs.length;
    const correct = qs.filter(q => q.correct).length;
    const wrong = qs.filter(q => !q.correct);
    const score = total > 0 ? Math.round(correct / total * 100) : 0;

    const topicMap = {};
    qs.forEach(q => {
      const t = q.topic || '其他';
      if (!topicMap[t]) topicMap[t] = { total: 0, correct: 0 };
      topicMap[t].total++;
      if (q.correct) topicMap[t].correct++;
    });

    const grade = cachedDoc?.grade || '';
    const subject = cachedDoc?.subject || aiLabel?.subject || '数学';
    const titleAndSub = (cachedDoc?.title || '') + (cachedDoc?.subtitle || '');
    const examType = titleAndSub.includes('期末') ? '期末检测' :
                     titleAndSub.includes('期中') ? '期中测试' :
                     titleAndSub.includes('质量检测') ? '质量检测' :
                     titleAndSub.includes('统一考试') ? '毕业考试' : '章节测试';

    const strongTopics = [];
    const weakTopics = [];
    Object.entries(topicMap).forEach(([name, d]) => {
      const r = d.total > 0 ? d.correct / d.total : 0;
      if (r >= 1 && d.total >= 2) strongTopics.push(name);
      else if (r < 0.6) weakTopics.push(name);
    });

    const allTopics = Object.keys(topicMap);
    const topicSummary = allTopics.length > 4
      ? allTopics.slice(0, 4).join('、') + '等'
      : allTopics.join('、');

    const lines = [];
    lines.push({ text: `${grade}${subject} · ${examType} · 共${total}题`, type: 'info' });
    lines.push({ text: `考点：${topicSummary}`, type: 'stat' });
    lines.push({ text: `正确${correct}题，错误${wrong.length}题，正确率${score}%`, type: 'score' });
    lines.push({ text: `查看逐题批改详情 ›`, type: 'link', action: 'grade' });

    if (score === 100) {
      lines.push({ text: '全部正确，知识点掌握扎实', type: 'stat' });
    } else if (score >= 80) {
      const weakHint = weakTopics.length > 0 ? `，${weakTopics.slice(0, 2).join('、')}还需巩固` : '';
      lines.push({ text: `整体掌握良好${weakHint}`, type: 'stat' });
    } else if (score >= 60) {
      if (weakTopics.length > 0) {
        lines.push({ text: `薄弱点：${weakTopics.slice(0, 3).join('、')}`, type: 'weak' });
      }
      if (strongTopics.length > 0) {
        lines.push({ text: `${strongTopics.slice(0, 2).join('、')}表现较好`, type: 'stat' });
      }
    } else {
      if (weakTopics.length > 0) {
        lines.push({ text: `薄弱点集中在：${weakTopics.slice(0, 3).join('、')}`, type: 'weak' });
      }
      if (strongTopics.length > 0) {
        lines.push({ text: `${strongTopics.slice(0, 2).join('、')}表现较好`, type: 'stat' });
      }
    }

    if (wrong.length > 0) {
      const practiceCount = Math.min(wrong.length * 3, 20);
      lines.push({ text: `针对错题生成${practiceCount}道同类练习 ›`, type: 'link', action: 'practice' });
    }
    return lines;
  };

  useEffect(() => {
    const label = cachedDoc
      ? { subject: cachedDoc.subject, type: '试卷', date: cachedDoc.date }
      : { subject: '数学', type: '试卷', date: new Date().toLocaleDateString('zh-CN') };
    const t1 = setTimeout(() => setAiLabel(label), 800);
    const t2 = setTimeout(() => setAiAnalyzing(false), displayResult ? 1800 : 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (aiAnalyzing || !displayResult) return;
    const lines = getAiLines();
    let i = 0;
    setVisibleLines(0);
    const timer = setInterval(() => {
      i++;
      if (i >= lines.length) { clearInterval(timer); setVisibleLines(lines.length); return; }
      setVisibleLines(i + 1);
    }, 600);
    setVisibleLines(1);
    return () => clearInterval(timer);
  }, [aiAnalyzing]);

  const handleStar = () => {
    if (starred) { showToast('已在试卷库中'); return; }
    setStarred(true);
    const record = {
      id: `exam_${Date.now()}`,
      title: aiLabel ? `${aiLabel.subject}${aiLabel.type}` : '未命名试卷',
      subject: aiLabel?.subject || '未分类',
      date: new Date().toISOString().split('T')[0],
      pages: files.length,
      status: isGraded ? 'graded' : 'saved',
      starred: true,
    };
    saveExamToLibrary(record);
    if (onStar) onStar();
    showToast('已收藏到试卷库');
  };

  const handleSwipe = (dir) => {
    if (dir === 'left' && currentPage < files.length - 1) setCurrentPage(p => p + 1);
    if (dir === 'right' && currentPage > 0) setCurrentPage(p => p - 1);
  };

  const handleBlankExam = () => {
    setSubPage('blank');
    setBlankProgress(0);
    setBlankReady(false);
    setBlankStage(0);
    let p = 0;
    let stage = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 8;
      if (p >= 50 && stage === 0) { stage = 1; setBlankStage(1); }
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setBlankStage(2);
        setTimeout(() => setBlankReady(true), 300);
      }
      setBlankProgress(Math.min(100, Math.round(p)));
    }, 400);
  };

  const handlePracticeExam = async () => {
    setSubPage('practice');
    setPracticeProgress(0);
    setPracticeReady(false);
    setPracticeQuestions([]);

    const subject = aiLabel?.subject || '数学';
    const mockQuestion = {
      content: `${subject}综合练习`,
      correctAnswer: '',
      subject,
      topic: `${subject}综合`,
    };

    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 8;
      if (p >= 90) { p = 90; clearInterval(interval); }
      setPracticeProgress(Math.min(90, Math.round(p)));
    }, 300);

    try {
      const result = await generatePractice(mockQuestion, 10);
      clearInterval(interval);
      setPracticeProgress(100);
      setPracticeQuestions(result);
      setTimeout(() => setPracticeReady(true), 300);
    } catch {
      clearInterval(interval);
      setPracticeProgress(100);
      setPracticeReady(true);
      showToast('生成失败，请重试');
    }
  };


  // === 子页面：生成空白卷 ===
  if (subPage === 'blank') {
    return (
      <div className="ew-page">
        {toast && <div className="cs-toast">{toast}</div>}
        <div className="ew-header">
          <button className="ew-back-btn" onClick={() => { setSubPage(null); setBlankReady(false); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="ew-header-title">生成空白卷</div>
          <div style={{width: 36}} />
        </div>

        {!blankReady ? (
          <div className="ew-processing">
            <div className="ew-processing-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="13" x2="15" y2="13" strokeDasharray="2 2"/>
                <line x1="9" y1="17" x2="13" y2="17" strokeDasharray="2 2"/>
              </svg>
            </div>
            <p className="ew-processing-text">
              {blankStage === 0 ? '正在去除手写内容...' : blankStage === 1 ? '正在去除印刷体答案...' : '处理完成'}
            </p>
            <div className="ew-progress-bar">
              <div className="ew-progress-fill" style={{width: `${blankProgress}%`}} />
            </div>
            <p className="ew-processing-hint">空白卷可以让孩子重新做一遍</p>
          </div>
        ) : (
          <div className="ew-blank-result">
            <div className="ew-blank-preview">
              {imageUrls.map((url, i) => (
                <div key={i} className="ew-blank-img-wrap">
                  <img src={url} alt={`第${i+1}页`} className="ew-blank-img" style={{filter: 'brightness(1.3) contrast(1.5) saturate(0.2)'}} />
                  <span className="ew-blank-page-label">第{i+1}页</span>
                </div>
              ))}
            </div>
            <div className="ew-sub-actions">
              <button className="ew-action-btn ew-action-primary" onClick={() => {
                if (onSaveBlank) onSaveBlank({ images: imageUrls });
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                保存试卷
              </button>
              <button className="ew-action-btn" onClick={() => showToast('打印功能开发中')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                打印
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === 子页面：举一反三 ===
  if (subPage === 'practice') {
    return (
      <div className="ew-page">
        {toast && <div className="cs-toast">{toast}</div>}
        <div className="ew-header">
          <button className="ew-back-btn" onClick={() => { setSubPage(null); setPracticeReady(false); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="ew-header-title">举一反三 · 新试卷</div>
          <div style={{width: 36}} />
        </div>

        {!practiceReady ? (
          <div className="ew-processing">
            <div className="ew-processing-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="1.5">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
              </svg>
            </div>
            <p className="ew-processing-text">正在基于试卷生成新题目...</p>
            <div className="ew-progress-bar">
              <div className="ew-progress-fill" style={{width: `${practiceProgress}%`}} />
            </div>
            <p className="ew-processing-hint">AI分析题型结构，生成同类型新试卷</p>
          </div>
        ) : (
          <div className="ew-practice-result">
            <div className="ew-practice-header-info">
              <span className="ew-practice-count">{practiceQuestions.length}道题</span>
              <span className="ew-practice-subject">{aiLabel?.subject || '数学'} · 同步练习</span>
            </div>
            <div className="ew-practice-list">
              {practiceQuestions.map((pq, i) => (
                <div key={i} className="ew-practice-card">
                  <div className="ew-practice-card-head">
                    <span className="ew-practice-card-num">第{i+1}题</span>
                    {pq.topic && <span className="ew-practice-card-topic">{pq.topic}</span>}
                  </div>
                  <p className="ew-practice-card-q">{pq.question || pq.content}</p>
                  {pq.options && pq.options.length > 0 && (
                    <div className="ew-practice-card-opts">
                      {pq.options.map((opt, j) => (
                        <div key={j} className="ew-practice-card-opt">{opt}</div>
                      ))}
                    </div>
                  )}
                  <details className="ew-practice-card-details">
                    <summary>查看答案</summary>
                    <div className="ew-practice-card-ans">
                      {pq.options ? `正确答案：${pq.answer}` : pq.answer}
                      {pq.explanation && <p className="ew-practice-card-explain">{pq.explanation}</p>}
                    </div>
                  </details>
                </div>
              ))}
            </div>
            <div className="ew-sub-actions">
              <button className="ew-action-btn ew-action-primary" onClick={() => {
                const paper = {
                  id: `practice_${Date.now()}`,
                  title: `${aiLabel?.subject || '综合'}举一反三练习`,
                  subject: aiLabel?.subject || '综合',
                  date: new Date().toLocaleDateString('zh-CN'),
                  questions: practiceQuestions,
                };
                savePracticePaper(paper);
                if (onSavePractice) onSavePractice(paper);
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                保存练习卷
              </button>
              <button className="ew-action-btn" onClick={handlePracticeExam}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                重新生成
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === 主页面：操作台 ===
  return (
    <div className="ew-page">
      {toast && <div className="cs-toast">{toast}</div>}
      <div className="ew-header">
        <button className="ew-back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="ew-header-title">
          {cachedDoc?.title || (aiLabel ? `${aiLabel.subject}${aiLabel.type}` : '试卷处理')}
        </div>
        {onAddMore && (
          <button className="ew-add-btn" onClick={onAddMore}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        )}
      </div>

      <div className="ew-body"
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return;
          const diff = e.changedTouches[0].clientX - touchStart;
          if (diff > 50) handleSwipe('right');
          else if (diff < -50) handleSwipe('left');
          setTouchStart(null);
        }}
      >
        <div className="ew-preview-full">
          {imageUrls[currentPage] && (
            <img src={imageUrls[currentPage]} alt="试卷预览" className="ew-preview-img-full" />
          )}
          {files.length > 1 && (
            <div className="ew-page-indicator">{currentPage + 1}/{files.length}</div>
          )}
        </div>

        <div className="ew-analysis">
          {aiAnalyzing ? (
            <div className="ew-danmu-loading">
              <span className="ew-danmu-dot" />
              <span>AI 正在分析...</span>
            </div>
          ) : displayResult ? (
            getAiLines().slice(0, visibleLines).map((line, i) => (
              <div key={i}
                className={`ew-danmu-line ew-danmu-${line.type}`}
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={line.action === 'practice' ? handlePracticeExam : line.action === 'grade' ? onGrade : undefined}
              >
                {line.text}
              </div>
            ))
          ) : cachedDoc ? (<>
            <div className="ew-danmu-line ew-danmu-info">{cachedDoc.grade}{cachedDoc.subject} · {cachedDoc.pages}页</div>
            {cachedDoc.topics && <div className="ew-danmu-line ew-danmu-stat">考点：{cachedDoc.topics.length > 4 ? cachedDoc.topics.slice(0, 4).join('、') + '等' : cachedDoc.topics.join('、')}</div>}
            {cachedDoc.subtitle && <div className="ew-danmu-line ew-danmu-stat">{cachedDoc.subtitle}</div>}
            <div className="ew-danmu-line ew-danmu-stat">可打印给孩子做，做完后拍照即可批改</div>
          </>) : aiLabel ? (<>
            <div className="ew-danmu-line ew-danmu-info">{aiLabel.subject}{aiLabel.type} · {files.length}页</div>
            <div className="ew-danmu-line ew-danmu-stat">已识别为{aiLabel.subject}试卷，共{files.length}页</div>
            <div className="ew-danmu-line ew-danmu-link" onClick={onGrade}>点击「智能批改」获取逐题分析 ›</div>
          </>) : (
            <div className="ew-danmu-line ew-danmu-hint">点击「智能批改」开始分析</div>
          )}
        </div>
      </div>

      <div className="ew-toolbar">
        <div className="ew-toolbar-grid">
          <button className="ew-tool-btn ew-tool-primary" onClick={onGrade}>
            <div className="ew-tool-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <span>智能批改</span>
          </button>
          <button className="ew-tool-btn" onClick={handleBlankExam}>
            <div className="ew-tool-icon ew-icon-blank">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="13" x2="15" y2="13" strokeDasharray="2 2"/>
              </svg>
            </div>
            <span>生成空白卷</span>
          </button>
          <button className="ew-tool-btn" onClick={handlePracticeExam}>
            <div className="ew-tool-icon ew-icon-practice">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
              </svg>
            </div>
            <span>举一反三</span>
          </button>
          <button className={`ew-tool-btn ${starred ? 'starred' : ''}`} onClick={handleStar}>
            <div className="ew-tool-icon ew-icon-star">
              <svg width="24" height="24" viewBox="0 0 24 24" fill={starred ? '#fff' : 'none'} stroke="#fff" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <span>{starred ? '已收藏' : '收藏试卷'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
