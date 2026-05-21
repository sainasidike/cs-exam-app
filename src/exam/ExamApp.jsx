import { useState, useEffect } from 'react';
import './exam.css';
import DocPreviewPage from './pages/DocPreviewPage.jsx';
import DocEditPage from './pages/DocEditPage.jsx';
import { recognizeExam, gradeExam, getQuestionAnswer, generatePractice, generateReviewQuiz, findCachedResult } from './services/ocrService.js';
import { DEMO_EXAM, DEMO_HISTORY, DEMO_WRONG_QUESTIONS, DEMO_TOPIC_MASTERY, DEMO_MASTERY_HISTORY, DEMO_REDO_LOG } from './demoData.js';
import { saveHistory, getHistory, saveWrongQuestions, getWrongQuestions, getTopicMastery, updateTopicMastery, saveExamToLibrary, saveExamResult, getMasteryHistory, getRedoLog, appendRedoLog } from './services/storageService.js';

export default function ExamApp({ initialFiles = [], onExit, onLibrary, cachedResult = null, cachedDocTitle = null, skipPreview = false, initialStep = null, examImages = [] }) {
  const [csStep, setCsStep] = useState(() => {
    if (initialStep) return initialStep;
    if (cachedResult) return 'processing';
    if (initialFiles.length > 0 && skipPreview) return 'processing';
    if (initialFiles.length > 0) return 'preview';
    return 'home';
  });
  const [uploadedFiles, setUploadedFiles] = useState(initialFiles);
  const [scanAddFiles, setScanAddFiles] = useState([]);

  // Processing
  const [ocrResult, setOcrResult] = useState(null);
  const [gradeResult, setGradeResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(!!(cachedResult || skipPreview));
  const [processingStep, setProcessingStep] = useState(cachedResult ? '正在加载预解析数据...' : (skipPreview ? '正在识别试卷文字...' : ''));
  const [processingProgress, setProcessingProgress] = useState(cachedResult ? 30 : (skipPreview ? 10 : 0));

  // Features
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [explainResult, setExplainResult] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [isPracticing, setIsPracticing] = useState(false);
  const [reviewQuiz, setReviewQuiz] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [resultTab, setResultTab] = useState('wrong');

  // Data
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [topicMastery, setTopicMastery] = useState({});
  const [selectedSubject, setSelectedSubject] = useState('全部');

  // Wrongbook features
  const [redoQuestions, setRedoQuestions] = useState([]);
  const [redoIndex, setRedoIndex] = useState(0);
  const [redoRevealed, setRedoRevealed] = useState(false);
  const [redoSelected, setRedoSelected] = useState(null);
  const [redoResults, setRedoResults] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [prevStep, setPrevStep] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const [autoReviewTriggered, setAutoReviewTriggered] = useState(false);

  useEffect(() => {
    const wq = getWrongQuestions();
    const h = getHistory();
    const tm = getTopicMastery();
    setWrongQuestions(wq.length ? wq : DEMO_WRONG_QUESTIONS);
    setHistory(h.length ? h : DEMO_HISTORY);
    setTopicMastery(Object.keys(tm).length ? tm : DEMO_TOPIC_MASTERY);
  }, []);

  useEffect(() => {
    if (initialStep === 'review' && !autoReviewTriggered && wrongQuestions.length >= 3) {
      setAutoReviewTriggered(true);
      setIsGeneratingQuiz(true);
      setReviewQuiz(null);
      generateReviewQuiz(wrongQuestions, 5).then(result => {
        setReviewQuiz(result);
      }).catch(() => {
        setReviewQuiz(null);
      }).finally(() => {
        setIsGeneratingQuiz(false);
      });
    }
    if (initialStep === 'redo' && !autoReviewTriggered && wrongQuestions.length > 0) {
      setAutoReviewTriggered(true);
      setRedoQuestions(wrongQuestions);
      setRedoIndex(0);
      setRedoRevealed(false);
      setRedoSelected(null);
      setRedoResults([]);
      setCsStep('redo');
    }
  }, [initialStep, wrongQuestions, autoReviewTriggered]);

  useEffect(() => {
    if (cachedResult) {
      setIsProcessing(true);
      setProcessingStep('正在加载预解析数据...');
      setProcessingProgress(30);
      const t1 = setTimeout(() => {
        setProcessingStep('正在生成批改结果...');
        setProcessingProgress(70);
      }, 400);
      const t2 = setTimeout(() => {
        setGradeResult(cachedResult);
        setProcessingProgress(100);
        setProcessingStep('完成');
        const questions = cachedResult?.questions || [];
        const correctCount = questions.filter(q => q.correct).length;
        const totalCount = questions.length;
        const scoreVal = totalCount > 0 ? Math.round(correctCount / totalCount * 100) : 0;
        const newHistoryItem = {
          title: cachedDocTitle || `试卷批改 ${new Date().toLocaleDateString()}`,
          score: scoreVal,
          date: new Date().toISOString().split('T')[0],
          total: totalCount,
          correct: correctCount,
        };
        setHistory(prev => {
          const updated = [newHistoryItem, ...prev];
          saveHistory(updated);
          return updated;
        });
        questions.forEach(q => { if (q.topic) updateTopicMastery(q.topic, q.correct); });
        setTopicMastery(getTopicMastery());
        const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
        const examId = `exam_${Date.now()}`;
        saveExamToLibrary({
          id: examId,
          title: cachedDocTitle || `试卷批改 ${new Date().toLocaleDateString('zh-CN')}`,
          subject: subjects[0] || '数学',
          date: new Date().toISOString().split('T')[0],
          pages: 1,
          status: 'graded',
          score: scoreVal,
          totalQuestions: totalCount,
          correctCount,
          starred: false,
        });
        saveExamResult(examId, cachedResult);
      }, 800);
      const t3 = setTimeout(() => {
        setIsProcessing(false);
        setCsStep('result');
      }, 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else if (skipPreview && initialFiles.length > 0) {
      handlePreviewConfirm();
    }
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  // --- Upload & Preview ---
  const handleUpload = (files) => {
    setUploadedFiles(files);
    setCsStep('edit');
  };

  const handleEditDone = (files) => {
    setUploadedFiles(files);
    setCsStep('preview');
  };

  const handleEditCancel = () => {
    setUploadedFiles([]);
    setCsStep('home');
  };

  const handlePreviewConfirm = async () => {
    setCsStep('processing');
    setIsProcessing(true);

    try {
      // Step 1: Prepare images
      setProcessingStep('正在准备图片...');
      setProcessingProgress(10);
      const ocr = await recognizeExam(uploadedFiles);
      setOcrResult(ocr);

      // Step 2: AI Vision Grade (single call) with fake progress animation
      setProcessingStep('AI正在识别并批改...');
      setProcessingProgress(30);
      let fakeProgress = 30;
      const progressTimer = setInterval(() => {
        fakeProgress += Math.random() * 8 + 2;
        if (fakeProgress > 90) fakeProgress = 90;
        setProcessingProgress(Math.round(fakeProgress));
      }, 800);
      const grade = await gradeExam(ocr);
      clearInterval(progressTimer);
      setGradeResult(grade);

      // Step 3: Save
      setProcessingStep('正在生成报告...');
      setProcessingProgress(95);

      // Auto-save history
      const questions = grade?.questions || [];
      const correctCount = questions.filter(q => q.correct).length;
      const totalCount = questions.length;
      const scoreVal = totalCount > 0 ? Math.round(correctCount / totalCount * 100) : 0;
      const newHistoryItem = {
        title: `试卷批改 ${new Date().toLocaleDateString()}`,
        score: scoreVal,
        date: new Date().toISOString().split('T')[0],
        total: totalCount,
        correct: correctCount,
      };
      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      saveHistory(updatedHistory);

      // Auto-update topic mastery
      questions.forEach(q => {
        if (q.topic) {
          updateTopicMastery(q.topic, q.correct);
        }
      });
      setTopicMastery(getTopicMastery());

      // Auto-save to exam library
      const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
      const examId = `exam_${Date.now()}`;
      saveExamToLibrary({
        id: examId,
        title: `试卷批改 ${new Date().toLocaleDateString('zh-CN')}`,
        subject: subjects[0] || '数学',
        date: new Date().toISOString().split('T')[0],
        pages: uploadedFiles.length || 1,
        status: 'graded',
        score: scoreVal,
        totalQuestions: totalCount,
        correctCount,
        starred: false,
      });
      saveExamResult(examId, grade);

      setProcessingProgress(100);
      setCsStep('result');
    } catch (e) {
      console.error('Processing error:', e);
      setOcrResult(DEMO_EXAM);
      setGradeResult(DEMO_EXAM);
      setCsStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Scan Add Flow ---
  const handleScanAdd = () => {
    setCsStep('scan-capture');
  };

  const handleScanCapture = (files) => {
    setScanAddFiles(files);
    setCsStep('scan-edit');
  };

  const handleScanEditConfirm = (editedFiles) => {
    setUploadedFiles(prev => [...prev, ...editedFiles]);
    setScanAddFiles([]);
    setCsStep('preview');
    showToast(`已添加 ${editedFiles.length} 页`);
  };

  const handleScanEditBack = () => {
    setScanAddFiles([]);
    setCsStep('preview');
  };

  // --- Explain ---
  const handleExplain = async (question) => {
    setSelectedQuestion(question);
    setIsExplaining(true);
    setExplainResult(null);
    setPrevStep(csStep);
    setCsStep('explain');
    try {
      const result = await getQuestionAnswer(question, (partial) => {
        setExplainResult(partial);
        setIsExplaining(false);
      });
      setExplainResult(result);
    } catch (e) {
      setExplainResult({
        explanation: '讲解生成失败，请重试。',
        steps: [],
        keyPoint: question.topic || ''
      });
    } finally {
      setIsExplaining(false);
    }
  };

  // --- Wrong Book ---
  const handleAddToWrongBook = (questions) => {
    const existingIds = new Set(wrongQuestions.map(q => q.content));
    const newOnes = questions.filter(q => !existingIds.has(q.content));
    if (newOnes.length === 0) {
      showToast('这些题目已在错题本中');
      return;
    }
    const newWrong = newOnes.map(q => ({
      ...q,
      id: Date.now() + Math.random(),
      addedAt: new Date().toISOString(),
      subject: q.subject || '数学',
    }));
    const updated = [...newWrong, ...wrongQuestions];
    setWrongQuestions(updated);
    saveWrongQuestions(updated);
    showToast(`已添加 ${newOnes.length} 道题到错题本`);
  };

  const handleRemoveFromWrongBook = (id) => {
    const updated = wrongQuestions.filter(q => q.id !== id);
    setWrongQuestions(updated);
    saveWrongQuestions(updated);
    showToast('已从错题本移除');
  };

  const handleBatchRemove = () => {
    if (selectedIds.size === 0) return;
    const updated = wrongQuestions.filter(q => !selectedIds.has(q.id));
    setWrongQuestions(updated);
    saveWrongQuestions(updated);
    showToast(`已移除 ${selectedIds.size} 道题`);
    setSelectedIds(new Set());
    setEditMode(false);
  };

  const handleClearAll = () => {
    if (!confirm('确定清空全部错题吗？此操作不可撤销。')) return;
    setWrongQuestions([]);
    saveWrongQuestions([]);
    setEditMode(false);
    setSelectedIds(new Set());
    showToast('已清空全部错题');
  };

  const toggleSelectId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartRedo = (questions) => {
    if (questions.length === 0) {
      showToast('没有可重做的题目');
      return;
    }
    setRedoQuestions(questions);
    setRedoIndex(0);
    setRedoRevealed(false);
    setRedoSelected(null);
    setRedoResults([]);
    setCsStep('redo');
  };

  const handleRedoJudge = (mastered) => {
    const current = redoQuestions[redoIndex];
    setRedoResults(prev => [...prev, { ...current, mastered }]);
    if (redoIndex < redoQuestions.length - 1) {
      setRedoIndex(redoIndex + 1);
      setRedoRevealed(false);
      setRedoSelected(null);
    } else {
      setCsStep('redo-result');
    }
  };

  const handleRedoChoiceSelect = (letter) => {
    if (redoRevealed) return;
    setRedoSelected(letter);
    setRedoRevealed(true);
  };

  const handleRedoFinish = () => {
    const masteredIds = redoResults.filter(r => r.mastered).map(r => r.id);
    const masteredCount = masteredIds.length;
    appendRedoLog(redoResults.length, masteredCount);
    if (masteredCount > 0) {
      const updated = wrongQuestions.filter(q => !masteredIds.includes(q.id));
      setWrongQuestions(updated);
      saveWrongQuestions(updated);
    }
    setCsStep('wrongbook');
  };

  const handleExportWrongBook = (withAnswer) => {
    const filtered = selectedSubject === '全部' ? wrongQuestions : wrongQuestions.filter(q => (q.subject || '数学') === selectedSubject);
    const title = `错题集 ${new Date().toLocaleDateString('zh-CN')}`;
    let html = `<html><head><meta charset="utf-8"><title>${title}</title><style>
      body{font-family:-apple-system,sans-serif;padding:24px;max-width:700px;margin:0 auto;color:#222}
      h1{font-size:20px;text-align:center;margin-bottom:24px}
      .q{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #eee}
      .q-num{font-weight:600;margin-bottom:4px}
      .q-meta{font-size:12px;color:#999;margin-bottom:6px}
      .q-content{font-size:14px;line-height:1.6;margin-bottom:8px}
      .q-answer{font-size:13px;color:#4CAF50;margin-top:8px}
      .q-blank{height:60px;border:1px dashed #ddd;border-radius:4px;margin-top:8px}
      @media print{body{padding:12px}.q{page-break-inside:avoid}}
    </style></head><body><h1>${title}</h1>`;
    filtered.forEach((q, i) => {
      html += `<div class="q"><div class="q-num">第${i+1}题</div>`;
      html += `<div class="q-meta">${q.subject || '数学'}${q.topic ? ' · ' + q.topic : ''}</div>`;
      html += `<div class="q-content">${q.content || q.question}</div>`;
      if (withAnswer) {
        html += `<div class="q-answer">正确答案：${q.correctAnswer || '—'}</div>`;
      } else {
        html += `<div class="q-blank"></div>`;
      }
      html += `</div>`;
    });
    html += `</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => { URL.revokeObjectURL(url); };
    }
    showToast(withAnswer ? '已生成带答案版' : '已生成空白卷版');
  };

  // --- Practice ---
  const handlePractice = async (question) => {
    setSelectedQuestion(question);
    setIsPracticing(true);
    setPracticeQuestions([]);
    setPrevStep(csStep);
    setCsStep('practice');
    try {
      const result = await generatePractice(question, 3, (partial) => {
        if (Array.isArray(partial) && partial.length > 0) {
          setPracticeQuestions(partial);
          setIsPracticing(false);
        }
      });
      setPracticeQuestions(result);
    } catch (e) {
      setPracticeQuestions([]);
      showToast('生成练习题失败');
    } finally {
      setIsPracticing(false);
    }
  };

  // --- Review Quiz ---
  const handleGenerateReview = async () => {
    if (wrongQuestions.length < 3) {
      showToast('至少需要3道错题才能生成复习测验');
      return;
    }
    setIsGeneratingQuiz(true);
    setReviewQuiz(null);
    setPrevStep(csStep);
    setCsStep('review');
    try {
      const result = await generateReviewQuiz(wrongQuestions, 5);
      setReviewQuiz(result);
    } catch (e) {
      setReviewQuiz(null);
      showToast('生成复习测验失败');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // --- Navigation ---
  const enteredFromOutside = !!(cachedResult || skipPreview);
  const enteredViaFeature = !!initialStep;

  const handleBackFromResult = () => {
    if (enteredFromOutside && onExit) {
      onExit(gradeResult);
      return;
    }
    setCsStep('home');
    setOcrResult(null);
    setGradeResult(null);
    setSelectedQuestion(null);
    setExplainResult(null);
    setPracticeQuestions([]);
    setReviewQuiz(null);
    setUploadedFiles([]);
    setProcessingProgress(0);
  };

  const handleBackToHome = () => {
    if (csStep === 'home' && onExit) {
      onExit();
      return;
    }
    if (enteredViaFeature && csStep === initialStep && onExit) {
      onExit();
      return;
    }
    setCsStep('home');
  };

  const handleExitApp = () => {
    if (onExit) onExit();
  };

  // ======== RENDER ========

  // Toast overlay
  const ToastOverlay = () => toast ? (
    <div className="cs-toast">{toast}</div>
  ) : null;

  // === HOME ===
  if (csStep === 'home') {
    return (
      <div className="eh-page">
        <ToastOverlay />
        <div className="eh-header">
          {onExit && (
            <button className="eh-back-btn" onClick={handleExitApp}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          <div className="eh-header-title">试卷智能助手</div>
          {onExit && <div style={{width:36}}/>}
        </div>
        <div className="eh-content">
          <div className="eh-upload-area" onClick={() => document.getElementById('exam-file-input').click()}>
            <div className="eh-upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="eh-upload-text">拍照或上传试卷</p>
            <p className="eh-upload-hint">支持拍照、相册选择、多页上传</p>
            <input id="exam-file-input" type="file" accept="image/*" multiple hidden onChange={e => {
              if (e.target.files.length > 0) handleUpload(Array.from(e.target.files));
            }} />
          </div>

          <div className="eh-actions">
            <button className="eh-action-btn" onClick={() => setCsStep('wrongbook')}>
              <div className="eh-action-icon eh-action-icon-wrong">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              </div>
              <span>错题本</span>
              {wrongQuestions.length > 0 && <span className="eh-action-badge">{wrongQuestions.length}</span>}
            </button>
            <button className="eh-action-btn" onClick={handleGenerateReview}>
              <div className="eh-action-icon eh-action-icon-review">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <span>复习测验</span>
            </button>
            <button className="eh-action-btn" onClick={() => setCsStep('report')}>
              <div className="eh-action-icon eh-action-icon-report">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              </div>
              <span>学习报告</span>
            </button>
          </div>

          {onLibrary && (
            <div className="eh-library-entry" onClick={onLibrary}>
              <div className="eh-library-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="13" y2="11"/></svg>
              </div>
              <div className="eh-library-text">
                <span className="eh-library-title">我的试卷库</span>
                <span className="eh-library-hint">按学科自动分类，随时查看历史试卷</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          )}

          {history.length > 0 && (
            <div className="eh-history">
              <h3 className="eh-section-title">批改历史</h3>
              {history.slice(0, 5).map((h, i) => (
                <div key={i} className="eh-history-item" onClick={() => showToast(`${h.title || '试卷'}：${h.score}分（${h.correct}/${h.total}题）`)}>
                  <div className="eh-history-left">
                    <span className="eh-history-name">{h.title || `试卷 ${i + 1}`}</span>
                    <span className="eh-history-date">{h.date}</span>
                  </div>
                  <div className="eh-history-right">
                    <span className="eh-history-score">{h.score}分</span>
                    <span className="eh-history-detail">{h.correct}/{h.total}题</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === EDIT (internal upload flow) ===
  if (csStep === 'edit') {
    return (
      <DocEditPage
        files={uploadedFiles}
        onConfirm={handleEditDone}
        onBack={handleEditCancel}
      />
    );
  }

  // === PREVIEW ===
  if (csStep === 'preview') {
    return (
      <>
        <ToastOverlay />
        <DocPreviewPage
          uploadedFiles={uploadedFiles}
          onCancel={handleBackToHome}
          onConfirm={handlePreviewConfirm}
          onScanAdd={handleScanAdd}
        />
      </>
    );
  }

  // === SCAN CAPTURE ===
  if (csStep === 'scan-capture') {
    return (
      <div className="eh-page">
        <ToastOverlay />
        <div className="eh-header">
          <button className="eh-back-btn" onClick={handleScanEditBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="eh-header-title">扫描添加</div>
          <div style={{width:40}}/>
        </div>
        <div className="eh-content eh-scan-content">
          <div className="eh-scan-camera" onClick={() => document.getElementById('scan-file-input').click()}>
            <div className="eh-scan-circle">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <p className="eh-upload-text">拍照扫描</p>
            <p className="eh-upload-hint">拍摄更多试卷页面添加到当前文档</p>
            <input id="scan-file-input" type="file" accept="image/*" capture="environment" multiple hidden onChange={e => {
              if (e.target.files.length > 0) handleScanCapture(Array.from(e.target.files));
            }} />
          </div>
        </div>
      </div>
    );
  }

  // === SCAN EDIT ===
  if (csStep === 'scan-edit') {
    return (
      <DocEditPage
        files={scanAddFiles}
        onConfirm={handleScanEditConfirm}
        onBack={handleScanEditBack}
      />
    );
  }

  // === PROCESSING ===
  if (csStep === 'processing') {
    return (
      <div className="eh-page">
        <div className="eh-processing">
          <div className="eh-processing-anim">
            <div className="eh-spinner"></div>
            <div className="eh-progress-bar">
              <div className="eh-progress-fill" style={{width: `${processingProgress}%`}}></div>
            </div>
          </div>
          <p className="eh-processing-text">{processingStep}</p>
          <p className="eh-processing-hint">AI正在分析试卷，请稍候...</p>
          <div className="eh-processing-steps">
            <div className={`eh-pstep ${processingProgress >= 10 ? 'done' : ''}`}>图片准备</div>
            <div className={`eh-pstep ${processingProgress >= 30 ? 'done' : ''}`}>AI识别批改</div>
            <div className={`eh-pstep ${processingProgress >= 95 ? 'done' : ''}`}>生成报告</div>
          </div>
        </div>
      </div>
    );
  }

  // === RESULT ===
  if (csStep === 'result') {
    const questions = gradeResult?.questions || DEMO_EXAM.questions;
    const wrongOnes = questions.filter(q => !q.correct);
    const correctCount = questions.filter(q => q.correct).length;
    const total = questions.length;
    const scorePercent = Math.round(correctCount / total * 100);

    const topicMap = {};
    questions.forEach(q => {
      const t = q.topic || '其他';
      if (!topicMap[t]) topicMap[t] = { correct: 0, total: 0 };
      topicMap[t].total++;
      if (q.correct) topicMap[t].correct++;
    });
    const weakTopics = Object.entries(topicMap)
      .filter(([, d]) => d.correct < d.total)
      .map(([name, d]) => {
        const hist = topicMastery[name];
        const histPct = hist ? hist.mastery : null;
        return { name, ...d, examWrong: d.total - d.correct, histPct };
      })
      .sort((a, b) => (a.histPct ?? 0) - (b.histPct ?? 0))
      .slice(0, 5);

    const displayQuestions = resultTab === 'wrong' ? wrongOnes : questions;

    return (
      <div className="eh-page">
        <ToastOverlay />
        <div className="eh-header">
          <button className="eh-back-btn" onClick={handleBackFromResult}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="eh-header-title">批改结果</div>
          <div style={{width:40}}/>
        </div>
        <div className="eh-content">
          <div className="wb-score-card">
            <div className="wb-score-ring">
              <svg viewBox="0 0 100 100" className="wb-ring-svg">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeWidth="8"
                  strokeDasharray={`${scorePercent * 2.64} 264`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"/>
              </svg>
              <div className="wb-score-center">
                <span className="wb-score-big">{scorePercent}</span>
                <span className="wb-score-unit">分</span>
              </div>
            </div>
            <div className="wb-score-info">
              <span>共{total}题，对{correctCount}题，错{wrongOnes.length}题</span>
            </div>
          </div>

          {(() => {
            const imgs = examImages.length > 0 ? examImages : (uploadedFiles.length > 0 ? uploadedFiles : []);
            const imageUrls = imgs.map(f => typeof f === 'string' ? f : (f instanceof File ? URL.createObjectURL(f) : null)).filter(Boolean);
            if (imageUrls.length === 0) return null;
            return (
              <details className="wb-originals">
                <summary className="wb-originals-toggle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  查看试卷原图 ({imageUrls.length}页)
                </summary>
                <div className="wb-originals-strip">
                  {imageUrls.map((url, i) => (
                    <img key={i} src={url} alt={`试卷第${i+1}页`} className="wb-originals-img" onClick={() => window.open(url, '_blank')} />
                  ))}
                </div>
              </details>
            );
          })()}

          {weakTopics.length > 0 && (
            <div className="wb-weak-section">
              <div className="wb-weak-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>本次薄弱点</span>
              </div>
              {weakTopics.map(t => {
                const pct = t.histPct ?? 0;
                return (
                  <div key={t.name} className="wb-weak-row">
                    <span className="wb-weak-name">{t.name}</span>
                    <div className="wb-weak-bar"><div className={`wb-weak-fill ${pct >= 50 ? 'ok' : 'bad'}`} style={{width: `${Math.max(pct, 4)}%`}} /></div>
                    <span className="wb-weak-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}

          {wrongOnes.length > 0 && (
            <button className="wb-add-all-btn-full" onClick={() => handleAddToWrongBook(wrongOnes)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              错题全部加入错题本 ({wrongOnes.length}题)
            </button>
          )}

          <div className="wb-result-tabs">
            <button className={`wb-result-tab ${resultTab === 'wrong' ? 'active' : ''}`} onClick={() => setResultTab('wrong')}>
              错题 ({wrongOnes.length})
            </button>
            <button className={`wb-result-tab ${resultTab === 'all' ? 'active' : ''}`} onClick={() => setResultTab('all')}>
              全部 ({total})
            </button>
          </div>

          <div className="wb-section">
            {displayQuestions.map((q, i) => (
              <div key={i} className={`wb-question-card ${q.correct ? 'wb-card-correct' : ''}`}>
                <div className="wb-q-header">
                  <span className="wb-q-num">第{q.number || i+1}题</span>
                  <span className={`wb-q-status-tag ${q.correct ? 'correct' : 'wrong'}`}>
                    {q.correct ? '✓ 正确' : '✗ 错误'}
                  </span>
                  <span className="wb-q-subject">{q.subject || '数学'}</span>
                  {q.topic && <span className="wb-q-topic">{q.topic}</span>}
                </div>
                <p className="wb-q-content">{q.content || q.question}</p>
                {!q.correct && (
                  <div className="wb-q-answer">
                    <div className="wb-q-ans-item wrong">
                      <span className="wb-q-ans-label">你的答案</span>
                      <span className="wb-q-ans-val">{q.userAnswer || '—'}</span>
                    </div>
                    <div className="wb-q-ans-item correct">
                      <span className="wb-q-ans-label">正确答案</span>
                      <span className="wb-q-ans-val">{q.correctAnswer || '—'}</span>
                    </div>
                  </div>
                )}
                {q.correct && (
                  <div className="wb-q-answer">
                    <div className="wb-q-ans-item correct">
                      <span className="wb-q-ans-label">正确答案</span>
                      <span className="wb-q-ans-val">{q.correctAnswer || '—'}</span>
                    </div>
                  </div>
                )}
                <div className="wb-q-actions">
                  <button className="wb-q-action-btn primary" onClick={() => handleExplain(q)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    深度讲解
                  </button>
                  <button className="wb-q-action-btn" onClick={() => handlePractice(q)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                    举一反三
                  </button>
                  <button className="wb-q-action-btn" onClick={() => handleAddToWrongBook([q])}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    {q.correct ? '收藏练习' : '错题本'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === EXPLAIN ===
  if (csStep === 'explain') {
    return (
      <div className="eh-page">
        <div className="eh-header">
          <button className="eh-back-btn" onClick={() => setCsStep(prevStep || 'result')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="eh-header-title">深度讲解</div>
          <div style={{width:40}}/>
        </div>
        <div className="eh-content">
          {isExplaining ? (
            <div className="eh-processing">
              <div className="eh-spinner"></div>
              <p className="eh-processing-text">AI正在生成讲解...</p>
            </div>
          ) : explainResult && (
            <div className="wb-explain">
              <div className="wb-explain-card wb-explain-q">
                <div className="wb-explain-card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  题目
                </div>
                <p>{selectedQuestion?.content}</p>
                <div className="wb-explain-meta">
                  <span className="wb-q-subject">{selectedQuestion?.subject}</span>
                  <span className="wb-q-topic">{selectedQuestion?.topic}</span>
                </div>
              </div>

              <div className="wb-explain-card">
                <div className="wb-explain-card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  解题思路
                </div>
                <p className="wb-explain-text">{explainResult.explanation}</p>
              </div>

              {explainResult.steps?.length > 0 && (
                <div className="wb-explain-card">
                  <div className="wb-explain-card-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    解题步骤
                  </div>
                  <ol className="wb-explain-steps">
                    {explainResult.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}

              {explainResult.keyPoint && (
                <div className="wb-explain-card">
                  <div className="wb-explain-card-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    核心知识点
                  </div>
                  <div className="wb-key-point">{explainResult.keyPoint}</div>
                </div>
              )}

              <div className="wb-explain-bottom">
                <button className="wb-action-full-btn" onClick={() => handlePractice(selectedQuestion)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                  举一反三练习
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === PRACTICE ===
  if (csStep === 'practice') {
    return (
      <div className="eh-page">
        <div className="eh-header">
          <button className="eh-back-btn" onClick={() => setCsStep(prevStep || 'result')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="eh-header-title">举一反三</div>
          <div style={{width:40}}/>
        </div>
        <div className="eh-content">
          {isPracticing ? (
            <div className="eh-processing">
              <div className="eh-spinner"></div>
              <p className="eh-processing-text">AI正在生成类似练习题...</p>
            </div>
          ) : (
            <div className="wb-practice">
              <div className="wb-practice-origin">
                <div className="wb-practice-origin-label">原题</div>
                <p>{selectedQuestion?.content}</p>
                <div className="wb-practice-origin-answer">正确答案：{selectedQuestion?.correctAnswer}</div>
              </div>

              {practiceQuestions.length > 0 ? (
                <div className="wb-practice-list">
                  <h4>类似练习 ({practiceQuestions.length}题)</h4>
                  {practiceQuestions.map((pq, i) => (
                    <div key={i} className="wb-practice-item">
                      <div className="wb-practice-item-header">
                        <span className="wb-practice-num">练习 {i+1}</span>
                        {pq.topic && <span className="wb-q-topic">{pq.topic}</span>}
                      </div>
                      <p className="wb-practice-question">{pq.question || pq.content}</p>
                      {pq.options && pq.options.length > 0 && (
                        <div className="wb-practice-options">
                          {pq.options.map((opt, j) => (
                            <div key={j} className="wb-practice-option">{opt}</div>
                          ))}
                        </div>
                      )}
                      <details className="wb-practice-details">
                        <summary>查看答案与解析</summary>
                        <div className="wb-practice-answer">
                          {pq.options ? `正确答案：${pq.answer}` : pq.answer}
                          {pq.explanation && <div className="wb-practice-explain">{pq.explanation}</div>}
                        </div>
                      </details>
                      <div className="wb-practice-item-actions">
                        <button className="wb-q-action-btn" onClick={() => handleAddToWrongBook([{
                          content: pq.question || pq.content,
                          correctAnswer: pq.answer,
                          userAnswer: '待练习',
                          subject: selectedQuestion?.subject || '数学',
                          topic: pq.topic || selectedQuestion?.topic || '',
                        }])}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          加入错题本
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="wb-empty-state">
                  <p>暂未生成练习题</p>
                  <button className="wb-retry-btn" onClick={() => handlePractice(selectedQuestion)}>重新生成</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === WRONGBOOK ===
  if (csStep === 'wrongbook') {
    const subjects = ['全部', ...new Set(wrongQuestions.map(q => q.subject || '数学'))];
    const filtered = selectedSubject === '全部' ? wrongQuestions : wrongQuestions.filter(q => (q.subject || '数学') === selectedSubject);

    return (
      <div className="eh-page">
        <ToastOverlay />
        <div className="eh-header">
          <button className="eh-back-btn" onClick={() => { setEditMode(false); setSelectedIds(new Set()); handleBackToHome(); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="eh-header-title">错题本 ({wrongQuestions.length})</div>
          {wrongQuestions.length > 0 ? (
            <button className="eh-header-action" onClick={() => { setEditMode(!editMode); setSelectedIds(new Set()); }}>
              {editMode ? '完成' : '编辑'}
            </button>
          ) : <div style={{width:40}}/>}
        </div>
        <div className="eh-content">
          <div className="wb-tabs">
            {subjects.map(s => (
              <button key={s} className={`wb-tab ${s === selectedSubject ? 'active' : ''}`} onClick={() => setSelectedSubject(s)}>
                {s}
                {s !== '全部' && <span className="wb-tab-count">{wrongQuestions.filter(q => (q.subject || '数学') === s).length}</span>}
              </button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div className="wb-wrong-list">
              {filtered.map((q, i) => (
                <div key={q.id || i} className={`wb-question-card ${editMode && selectedIds.has(q.id) ? 'wb-card-selected' : ''}`}
                  onClick={editMode ? () => toggleSelectId(q.id) : undefined}>
                  {editMode && (
                    <div className="wb-checkbox-wrap">
                      <div className={`wb-checkbox ${selectedIds.has(q.id) ? 'checked' : ''}`}>
                        {selectedIds.has(q.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </div>
                  )}
                  <div className="wb-q-header">
                    <span className="wb-q-subject">{q.subject || '数学'}</span>
                    <span className="wb-q-topic">{q.topic}</span>
                    <span className="wb-q-date">{q.addedAt ? new Date(q.addedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="wb-q-content">{q.content || q.question}</p>
                  {!editMode && (
                    <>
                      <div className="wb-q-answer">
                        <div className="wb-q-ans-item wrong">
                          <span className="wb-q-ans-label">错误答案</span>
                          <span className="wb-q-ans-val">{q.userAnswer}</span>
                        </div>
                        <div className="wb-q-ans-item correct">
                          <span className="wb-q-ans-label">正确答案</span>
                          <span className="wb-q-ans-val">{q.correctAnswer}</span>
                        </div>
                      </div>
                      <div className="wb-q-actions">
                        <button className="wb-q-action-btn primary" onClick={() => handleExplain(q)}>讲解</button>
                        <button className="wb-q-action-btn" onClick={() => handlePractice(q)}>举一反三</button>
                        <button className="wb-q-action-btn danger" onClick={() => handleRemoveFromWrongBook(q.id)}>移除</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="wb-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              <p>还没有错题</p>
              <p className="wb-empty-hint">批改试卷后，错题会自动收录到这里</p>
            </div>
          )}

          {editMode && selectedIds.size > 0 && (
            <div className="wb-edit-bar">
              <button className="wb-edit-bar-btn danger" onClick={handleBatchRemove}>
                删除选中 ({selectedIds.size})
              </button>
              <button className="wb-edit-bar-btn" onClick={() => { setSelectedIds(new Set(filtered.map(q => q.id))); }}>
                全选
              </button>
              <button className="wb-edit-bar-btn danger-text" onClick={handleClearAll}>
                清空全部
              </button>
            </div>
          )}

          {!editMode && wrongQuestions.length > 0 && (
            <div className="wb-bottom-actions">
              <button className="wb-action-primary-btn" onClick={() => handleStartRedo(filtered)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                重做全部 ({filtered.length}题)
              </button>
              <div className="wb-bottom-row">
                <button className="wb-action-secondary-btn" onClick={() => setCsStep('export')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  导出试卷
                </button>
                <button className="wb-action-secondary-btn" onClick={handleGenerateReview}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  复习测验
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === REVIEW ===
  if (csStep === 'review') {
    const handleReviewBack = () => {
      if (enteredViaFeature && initialStep === 'review' && onExit) {
        onExit();
        return;
      }
      if (prevStep && prevStep !== 'review') { setCsStep(prevStep); return; }
      handleBackToHome();
    };
    return (
      <div className="eh-page">
        <ToastOverlay />
        <div className="eh-header">
          <button className="eh-back-btn" onClick={handleReviewBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="eh-header-title">复习测验</div>
          <div style={{width:40}}/>
        </div>
        <div className="eh-content">
          {isGeneratingQuiz ? (
            <div className="eh-processing">
              <div className="eh-spinner"></div>
              <p className="eh-processing-text">AI正在根据你的错题生成复习测验...</p>
              <p className="eh-processing-hint">正在分析薄弱知识点</p>
            </div>
          ) : reviewQuiz && reviewQuiz.length > 0 ? (
            <div className="wb-review">
              <div className="wb-review-header">
                <h4>针对薄弱知识点的复习题</h4>
                <span className="wb-review-count">共{reviewQuiz.length}题</span>
              </div>
              {reviewQuiz.map((q, i) => (
                <div key={i} className="wb-practice-item">
                  <div className="wb-practice-item-header">
                    <span className="wb-practice-num">第{i+1}题</span>
                    {q.topic && <span className="wb-q-topic">{q.topic}</span>}
                  </div>
                  <p className="wb-practice-question">{q.question || q.content}</p>
                  {q.options && q.options.length > 0 && (
                    <div className="wb-review-options">
                      {q.options.map((opt, j) => (
                        <div key={j} className="wb-review-opt">{String.fromCharCode(65 + j)}. {opt}</div>
                      ))}
                    </div>
                  )}
                  <details className="wb-practice-details">
                    <summary>查看答案与解析</summary>
                    <div className="wb-practice-answer">{q.answer}</div>
                    {q.explanation && <div className="wb-practice-explain">{q.explanation}</div>}
                  </details>
                </div>
              ))}
            </div>
          ) : (
            <div className="wb-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p>暂无复习测验</p>
              <p className="wb-empty-hint">至少需要3道错题才能生成复习测验</p>
              <button className="wb-retry-btn" onClick={() => setCsStep('wrongbook')}>去错题本看看</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === REPORT ===
  if (csStep === 'report') {
    const masteryEntries = Object.entries(topicMastery).sort((a, b) => a[1].mastery - b[1].mastery);
    const masteryHist = (() => { const h = getMasteryHistory(); return Object.keys(h).length ? h : DEMO_MASTERY_HISTORY; })();
    const redoLog = (() => { const r = getRedoLog(); return r.length ? r : DEMO_REDO_LOG; })();

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const days7ago = new Date(now - 7 * 86400000).toISOString().split('T')[0];
    const days30ago = new Date(now - 30 * 86400000).toISOString().split('T')[0];

    const thisWeekHistory = history.filter(h => h.date >= days7ago);
    const lastWeekStart = new Date(now - 14 * 86400000).toISOString().split('T')[0];
    const lastWeekHistory = history.filter(h => h.date >= lastWeekStart && h.date < days7ago);

    const thisWeekAvg = thisWeekHistory.length > 0
      ? Math.round(thisWeekHistory.reduce((s, h) => s + h.score, 0) / thisWeekHistory.length)
      : null;
    const lastWeekAvg = lastWeekHistory.length > 0
      ? Math.round(lastWeekHistory.reduce((s, h) => s + h.score, 0) / lastWeekHistory.length)
      : null;
    const avgDiff = (thisWeekAvg !== null && lastWeekAvg !== null) ? thisWeekAvg - lastWeekAvg : null;

    // Activity heatmap (last 14 days)
    const activityDays = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000).toISOString().split('T')[0];
      const count = history.filter(h => h.date === d).length;
      activityDays.push({ date: d, count });
    }
    const streak = (() => {
      let s = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(now - i * 86400000).toISOString().split('T')[0];
        if (history.some(h => h.date === d)) s++;
        else break;
      }
      return s;
    })();

    // Score trend (last 8 exams)
    const trendData = history.slice(0, 8).reverse();
    const overallAvg = trendData.length > 0 ? Math.round(trendData.reduce((s, h) => s + h.score, 0) / trendData.length) : 0;

    // Knowledge point diagnosis
    const improving = [];
    const needAttention = [];
    const mastered = [];
    Object.entries(topicMastery).forEach(([topic, data]) => {
      const hist = masteryHist[topic] || [];
      let trend = 0;
      if (hist.length >= 2) {
        const recent = hist[hist.length - 1].value;
        const older = hist[Math.max(0, hist.length - 3)].value;
        trend = recent - older;
      }
      if (data.mastery >= 80) {
        mastered.push({ topic, mastery: data.mastery, trend });
      } else if (trend > 5) {
        improving.push({ topic, mastery: data.mastery, trend, hist });
      } else {
        needAttention.push({ topic, mastery: data.mastery, trend, hist });
      }
    });
    needAttention.sort((a, b) => a.mastery - b.mastery);
    improving.sort((a, b) => b.trend - a.trend);

    // Redo digest
    const thisWeekRedo = redoLog.filter(r => r.date >= days7ago);
    const redoTotal = thisWeekRedo.reduce((s, r) => s + r.total, 0);
    const redoMastered = thisWeekRedo.reduce((s, r) => s + r.mastered, 0);
    const digestRate = wrongQuestions.length > 0 ? Math.round((redoMastered / (wrongQuestions.length + redoMastered)) * 100) : 0;

    // Weekly summary text
    const summaryParts = [];
    if (thisWeekHistory.length > 0) summaryParts.push(`本周完成 ${thisWeekHistory.length} 次批改`);
    if (thisWeekAvg !== null) {
      let avgText = `平均正确率 ${thisWeekAvg}%`;
      if (avgDiff !== null && avgDiff !== 0) avgText += `（${avgDiff > 0 ? '↑' : '↓'}${Math.abs(avgDiff)}%）`;
      summaryParts.push(avgText);
    }
    if (improving.length > 0) summaryParts.push(`${improving[0].topic}明显进步`);
    if (needAttention.length > 0) summaryParts.push(`${needAttention[0].topic}仍需加强`);
    const summaryText = summaryParts.length > 0 ? summaryParts.join('，') + '。' : '暂无本周数据，批改试卷后将自动生成报告。';

    // Suggestions
    const suggestions = [];
    if (needAttention.length > 0 && needAttention[0].mastery < 40) {
      suggestions.push(`「${needAttention[0].topic}」掌握度较低，建议本周针对性重做相关错题`);
    }
    if (wrongQuestions.length > 15 && redoTotal === 0) {
      suggestions.push(`有 ${wrongQuestions.length} 道错题未重做，建议安排一次集中复习`);
    } else if (wrongQuestions.length > 0 && digestRate > 70) {
      suggestions.push('错题消化率良好，继续保持当前节奏');
    }
    if (streak === 0) {
      suggestions.push('最近没有学习记录，建议每天至少练习一次');
    } else if (streak >= 5) {
      suggestions.push(`已连续学习 ${streak} 天，保持得很好！`);
    }

    // SVG line chart helper
    const renderTrendChart = () => {
      if (trendData.length < 2) return null;
      const w = 300, h = 100, px = 30, py = 10;
      const chartW = w - px * 2, chartH = h - py * 2;
      const minS = Math.min(...trendData.map(d => d.score)) - 5;
      const maxS = Math.max(...trendData.map(d => d.score)) + 5;
      const range = maxS - minS || 1;
      const points = trendData.map((d, i) => {
        const x = px + (i / (trendData.length - 1)) * chartW;
        const y = py + chartH - ((d.score - minS) / range) * chartH;
        return `${x},${y}`;
      });
      const avgY = py + chartH - ((overallAvg - minS) / range) * chartH;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="rpt-chart-svg">
          <line x1={px} y1={avgY} x2={w-px} y2={avgY} stroke="#E0E0E0" strokeWidth="1" strokeDasharray="4"/>
          <text x={w-px+4} y={avgY+3} fontSize="9" fill="#bbb">{overallAvg}</text>
          <polyline points={points.join(' ')} fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {trendData.map((d, i) => {
            const x = px + (i / (trendData.length - 1)) * chartW;
            const y = py + chartH - ((d.score - minS) / range) * chartH;
            return <circle key={i} cx={x} cy={y} r="3" fill="#4CAF50"/>;
          })}
          {trendData.map((d, i) => {
            const x = px + (i / (trendData.length - 1)) * chartW;
            return <text key={i} x={x} y={h - 2} fontSize="8" fill="#bbb" textAnchor="middle">{d.date.slice(5)}</text>;
          })}
        </svg>
      );
    };

    return (
      <div className="eh-page">
        <div className="eh-header">
          <button className="eh-back-btn" onClick={handleBackToHome}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="eh-header-title">学习报告</div>
          <div style={{width:40}}/>
        </div>
        <div className="eh-content">
          <div className="rpt-container">

            {/* Weekly Summary */}
            <div className="rpt-summary-card">
              <div className="rpt-summary-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <p className="rpt-summary-text">{summaryText}</p>
            </div>

            {/* Activity */}
            <div className="rpt-section">
              <div className="rpt-section-title">学习活跃度</div>
              <div className="rpt-activity">
                <div className="rpt-heatmap">
                  {activityDays.map((d, i) => (
                    <div key={i} className={`rpt-heat-cell ${d.count > 0 ? (d.count > 1 ? 'hot' : 'warm') : ''}`}
                      title={`${d.date}: ${d.count}次`}>
                      {i % 7 === 0 && <span className="rpt-heat-label">{d.date.slice(5)}</span>}
                    </div>
                  ))}
                </div>
                <div className="rpt-activity-stats">
                  <div className="rpt-activity-stat">
                    <span className="rpt-act-num">{thisWeekHistory.length}</span>
                    <span className="rpt-act-label">本周批改</span>
                  </div>
                  <div className="rpt-activity-stat">
                    <span className="rpt-act-num">{lastWeekHistory.length}</span>
                    <span className="rpt-act-label">上周批改</span>
                  </div>
                  <div className="rpt-activity-stat">
                    <span className="rpt-act-num">{streak}</span>
                    <span className="rpt-act-label">连续天数</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Trend */}
            <div className="rpt-section">
              <div className="rpt-section-title">正确率趋势</div>
              {trendData.length >= 2 ? (
                <div className="rpt-chart">
                  {renderTrendChart()}
                </div>
              ) : (
                <p className="rpt-hint">再批改几次就能看到趋势变化</p>
              )}
            </div>

            {/* Radar Chart */}
            {masteryEntries.length >= 3 && (() => {
              const radarTopics = masteryEntries.slice(0, 6);
              const n = radarTopics.length;
              const cx = 150, cy = 140, r = 100;
              const angleStep = (2 * Math.PI) / n;
              const levels = [20, 40, 60, 80, 100];
              const getPoint = (i, val) => {
                const angle = angleStep * i - Math.PI / 2;
                const dist = (val / 100) * r;
                return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
              };
              const dataPoints = radarTopics.map((t, i) => getPoint(i, t[1].mastery));
              const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
              return (
                <div className="rpt-section">
                  <div className="rpt-section-title">知识掌握全景</div>
                  <svg viewBox="0 0 300 280" className="rpt-radar-svg">
                    {levels.map(lv => {
                      const pts = Array.from({length: n}, (_, i) => getPoint(i, lv));
                      return <polygon key={lv} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#e8e8e8" strokeWidth="0.8" />;
                    })}
                    {radarTopics.map((_, i) => {
                      const edge = getPoint(i, 100);
                      return <line key={i} x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke="#e8e8e8" strokeWidth="0.6" />;
                    })}
                    <polygon points={polygon} fill="rgba(76,175,80,0.15)" stroke="#4CAF50" strokeWidth="2" />
                    {dataPoints.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#4CAF50" />
                    ))}
                    {radarTopics.map((t, i) => {
                      const lp = getPoint(i, 118);
                      const anchor = lp.x < cx - 10 ? 'end' : lp.x > cx + 10 ? 'start' : 'middle';
                      return (
                        <text key={i} x={lp.x} y={lp.y} textAnchor={anchor} fontSize="10" fill="#666" dominantBaseline="central">
                          {t[0].length > 5 ? t[0].slice(0, 5) + '..' : t[0]}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}

            {/* Knowledge Diagnosis */}
            <div className="rpt-section">
              <div className="rpt-section-title">知识点诊断</div>

              {improving.length > 0 && (
                <div className="rpt-diag-group">
                  <div className="rpt-diag-label rpt-diag-improving">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                    正在进步
                  </div>
                  {improving.slice(0, 3).map(t => {
                    const hist = t.hist || [];
                    const from = hist.length >= 2 ? hist[Math.max(0, hist.length - 3)].value : 0;
                    return (
                      <div key={t.topic} className="rpt-diag-item rpt-diag-item-detail">
                        <div className="rpt-diag-item-top">
                          <span className="rpt-diag-topic">{t.topic}</span>
                          <span className="rpt-diag-change positive">{from}% → {t.mastery}%</span>
                        </div>
                        <div className="rpt-diag-item-reason">
                          做过{topicMastery[t.topic]?.attempts || 0}题，正确率在上升
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {needAttention.length > 0 && (
                <div className="rpt-diag-group">
                  <div className="rpt-diag-label rpt-diag-attention">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    需要关注
                  </div>
                  {needAttention.slice(0, 3).map(t => {
                    const topicWrong = wrongQuestions.filter(q => q.topic === t.topic);
                    const attempted = t.hist.length > 0 ? topicMastery[t.topic]?.attempts || 0 : 0;
                    const wrongCount = topicWrong.length;
                    const sparkData = t.hist || [];
                    return (
                      <div key={t.topic} className="rpt-diag-item rpt-diag-item-detail">
                        <div className="rpt-diag-item-top">
                          <span className="rpt-diag-topic">{t.topic}</span>
                          {sparkData.length >= 2 && (
                            <svg viewBox="0 0 60 20" className="rpt-sparkline">
                              <polyline
                                fill="none" stroke="#FF9800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                                points={sparkData.map((d, i) => {
                                  const x = (i / (sparkData.length - 1)) * 56 + 2;
                                  const y = 18 - (d.value / 100) * 16;
                                  return `${x},${y}`;
                                }).join(' ')}
                              />
                            </svg>
                          )}
                          <span className="rpt-diag-val warn">{t.mastery}%</span>
                        </div>
                        <div className="rpt-diag-item-reason">
                          累计做过{attempted}题，错题本中还有{wrongCount}道未消化
                        </div>
                        {topicWrong.length > 0 && (
                          <button className="rpt-diag-action" onClick={() => handleStartRedo(topicWrong)}>
                            去重做 ({topicWrong.length}题)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {mastered.length > 0 && (
                <details className="rpt-diag-group rpt-mastered-group">
                  <summary className="rpt-diag-label rpt-diag-mastered">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    已掌握 ({mastered.length})
                  </summary>
                  {mastered.map(t => (
                    <div key={t.topic} className="rpt-diag-item">
                      <span className="rpt-diag-topic">{t.topic}</span>
                      <span className="rpt-diag-val good">{t.mastery}%</span>
                    </div>
                  ))}
                </details>
              )}

              {masteryEntries.length === 0 && (
                <p className="rpt-hint">批改试卷后将自动分析知识点掌握情况</p>
              )}
            </div>

            {/* Redo Digest */}
            <div className="rpt-section">
              <div className="rpt-section-title">错题消化情况</div>
              <div className="rpt-redo-stats">
                <div className="rpt-redo-stat">
                  <span className="rpt-redo-num">{wrongQuestions.length}</span>
                  <span className="rpt-redo-label">当前错题</span>
                </div>
                <div className="rpt-redo-stat">
                  <span className="rpt-redo-num">{redoTotal}</span>
                  <span className="rpt-redo-label">本周重做</span>
                </div>
                <div className="rpt-redo-stat">
                  <span className="rpt-redo-num">{redoMastered}</span>
                  <span className="rpt-redo-label">已掌握</span>
                </div>
                <div className="rpt-redo-stat">
                  <span className="rpt-redo-num">{digestRate}%</span>
                  <span className="rpt-redo-label">消化率</span>
                </div>
              </div>
              {wrongQuestions.length > 15 && redoTotal === 0 && (
                <div className="rpt-redo-warning">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  有 {wrongQuestions.length} 道错题未重做，建议本周安排复习
                </div>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="rpt-section">
                <div className="rpt-section-title">行动建议</div>
                <div className="rpt-suggestions">
                  {suggestions.map((s, i) => (
                    <div key={i} className="rpt-suggestion-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // === REDO MODE ===
  if (csStep === 'redo') {
    const current = redoQuestions[redoIndex];
    const hasChoices = current?.options && current.options.length > 0;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const isChoiceCorrect = redoSelected === current?.correctAnswer;
    return (
      <div className="eh-page">
        <div className="eh-header">
          <button className="eh-back-btn" onClick={() => setCsStep('wrongbook')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="eh-header-title">重做错题 ({redoIndex + 1}/{redoQuestions.length})</div>
          <div style={{width:40}}/>
        </div>
        <div className="eh-content">
          <div className="wb-redo-progress">
            <div className="wb-redo-progress-fill" style={{width: `${(redoIndex + 1) / redoQuestions.length * 100}%`}}></div>
          </div>
          <div className="wb-redo-card">
            <div className="wb-redo-meta">
              <span className="wb-q-subject">{current?.subject || '数学'}</span>
              {current?.topic && <span className="wb-q-topic">{current.topic}</span>}
            </div>
            <p className="wb-redo-question">{current?.content || current?.question}</p>

            {hasChoices ? (
              <>
                <div className="wb-redo-choices">
                  {current.options.map((opt, i) => {
                    const letter = letters[i];
                    let cls = 'wb-redo-choice';
                    if (redoRevealed) {
                      if (letter === current.correctAnswer) cls += ' correct';
                      else if (letter === redoSelected && letter !== current.correctAnswer) cls += ' wrong';
                      else cls += ' dimmed';
                    } else if (redoSelected === letter) {
                      cls += ' selected';
                    }
                    return (
                      <button key={i} className={cls} onClick={() => handleRedoChoiceSelect(letter)} disabled={redoRevealed}>
                        <span className="wb-redo-choice-letter">{letter}</span>
                        <span className="wb-redo-choice-text">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {redoRevealed && (
                  <div className="wb-redo-answer-area">
                    <div className={`wb-redo-feedback ${isChoiceCorrect ? 'correct' : 'wrong'}`}>
                      {isChoiceCorrect ? '回答正确！' : `回答错误，正确答案是 ${current.correctAnswer}`}
                    </div>
                    <div className="wb-redo-judge-btns">
                      <button className="wb-redo-judge-btn mastered" onClick={() => handleRedoJudge(isChoiceCorrect)}>
                        {isChoiceCorrect ? '下一题' : '记住了'}
                      </button>
                      {!isChoiceCorrect && (
                        <button className="wb-redo-judge-btn not-yet" onClick={() => handleRedoJudge(false)}>
                          仍不会
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {!redoRevealed ? (
                  <button className="wb-redo-reveal-btn" onClick={() => setRedoRevealed(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    显示答案
                  </button>
                ) : (
                  <div className="wb-redo-answer-area">
                    <div className="wb-redo-correct-answer">
                      <span className="wb-redo-answer-label">正确答案</span>
                      <span className="wb-redo-answer-val">{current?.correctAnswer || '—'}</span>
                    </div>
                    <p className="wb-redo-judge-hint">你这次做对了吗？</p>
                    <div className="wb-redo-judge-btns">
                      <button className="wb-redo-judge-btn mastered" onClick={() => handleRedoJudge(true)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        已掌握
                      </button>
                      <button className="wb-redo-judge-btn not-yet" onClick={() => handleRedoJudge(false)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        仍不会
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === REDO RESULT ===
  if (csStep === 'redo-result') {
    const masteredCount = redoResults.filter(r => r.mastered).length;
    const failedCount = redoResults.filter(r => !r.mastered).length;
    const total = redoResults.length;

    return (
      <div className="eh-page">
        <div className="eh-header">
          <div style={{width:40}}/>
          <div className="eh-header-title">重做完成</div>
          <div style={{width:40}}/>
        </div>
        <div className="eh-content">
          <div className="wb-redo-summary">
            <div className="wb-redo-summary-ring">
              <svg viewBox="0 0 100 100" className="wb-ring-svg">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f0f0f0" strokeWidth="8"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#4CAF50" strokeWidth="8"
                  strokeDasharray={`${(masteredCount / total) * 264} 264`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"/>
              </svg>
              <div className="wb-redo-summary-center">
                <span className="wb-redo-summary-num">{masteredCount}</span>
                <span className="wb-redo-summary-label">已掌握</span>
              </div>
            </div>
            <div className="wb-redo-summary-stats">
              <div className="wb-redo-stat">
                <span className="wb-redo-stat-num">{total}</span>
                <span className="wb-redo-stat-label">总题数</span>
              </div>
              <div className="wb-redo-stat">
                <span className="wb-redo-stat-num wb-stat-green">{masteredCount}</span>
                <span className="wb-redo-stat-label">已掌握</span>
              </div>
              <div className="wb-redo-stat">
                <span className="wb-redo-stat-num wb-stat-red">{failedCount}</span>
                <span className="wb-redo-stat-label">仍需加强</span>
              </div>
            </div>
          </div>

          {masteredCount > 0 && (
            <div className="wb-redo-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>已掌握的 {masteredCount} 题将从错题本中移除</span>
            </div>
          )}

          {failedCount > 0 && (
            <div className="wb-redo-failed-list">
              <h4>仍需加强 ({failedCount}题)</h4>
              {redoResults.filter(r => !r.mastered).map((q, i) => (
                <div key={i} className="wb-redo-failed-item">
                  <span className="wb-q-subject">{q.subject || '数学'}</span>
                  <span className="wb-redo-failed-content">{q.content || q.question}</span>
                </div>
              ))}
            </div>
          )}

          <button className="wb-action-primary-btn" onClick={handleRedoFinish}>
            返回错题本
          </button>
        </div>
      </div>
    );
  }

  // === EXPORT ===
  if (csStep === 'export') {
    const filtered = selectedSubject === '全部' ? wrongQuestions : wrongQuestions.filter(q => (q.subject || '数学') === selectedSubject);

    return (
      <div className="eh-page">
        <div className="eh-header">
          <button className="eh-back-btn" onClick={() => setCsStep('wrongbook')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="eh-header-title">导出错题</div>
          <div style={{width:40}}/>
        </div>
        <div className="eh-content">
          <div className="wb-export">
            <div className="wb-export-info">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div>
                <p className="wb-export-count">共 {filtered.length} 道题</p>
                <p className="wb-export-hint">{selectedSubject === '全部' ? '全部学科' : selectedSubject}</p>
              </div>
            </div>

            <div className="wb-export-options">
              <button className="wb-export-option" onClick={() => handleExportWrongBook(false)}>
                <div className="wb-export-option-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div className="wb-export-option-text">
                  <span className="wb-export-option-title">空白卷版</span>
                  <span className="wb-export-option-desc">只有题目，适合重新做题打印</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              <button className="wb-export-option" onClick={() => handleExportWrongBook(true)}>
                <div className="wb-export-option-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>
                </div>
                <div className="wb-export-option-text">
                  <span className="wb-export-option-title">带答案版</span>
                  <span className="wb-export-option-desc">含正确答案，适合复习参考</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <p className="wb-export-tip">导出后可直接打印或保存为PDF</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
