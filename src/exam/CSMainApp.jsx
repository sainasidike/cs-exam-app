import { useState } from 'react';
import './cs-main.css';
import './exam.css';
import './teacher.css';
import './landing.css';
import './chat.css';
import DocEditPage from './pages/DocEditPage.jsx';
import DocListPage from './pages/DocListPage.jsx';
import ExamEntryPage from './pages/ExamEntryPage.jsx';
import ExamWorkbench from './pages/ExamWorkbench.jsx';
import ExamLibrary from './pages/ExamLibrary.jsx';
import TeacherHomePage from './pages/TeacherHomePage.jsx';
import ClassManagePage from './pages/ClassManagePage.jsx';
import BatchGradePage from './pages/BatchGradePage.jsx';
import ClassReportPage from './pages/ClassReportPage.jsx';
import QuizGeneratorPage from './pages/QuizGeneratorPage.jsx';
import ExportPage from './pages/ExportPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PracticePaperPage from './pages/PracticePaperPage.jsx';
import ExamApp from './ExamApp.jsx';
import ChatView from './components/ChatView.jsx';
import NotebookView from './components/NotebookView.jsx';
import ExamManagePage from './components/ExamManagePage.jsx';
import { EXAM_DOCUMENTS, EXAM_GRADABLE } from './cachedExams.js';
import { DEMO_EXAM } from './demoData.js';
import { getExamResult } from './services/storageService.js';

const LANDING_SEEN_KEY = 'cs_landing_seen';

export default function CSMainApp() {
  const [route, setRoute] = useState(() => {
    return localStorage.getItem(LANDING_SEEN_KEY) ? 'tabs' : 'landing';
  });
  const [activeTab, setActiveTab] = useState('home');
  const [capturedFiles, setCapturedFiles] = useState([]);
  const [toolboxCategory, setToolboxCategory] = useState('求职与校园');
  const [cachedExamId, setCachedExamId] = useState(null);
  const [examFlow, setExamFlow] = useState(false);
  const [examGraded, setExamGraded] = useState(false);
  const [examGradeResult, setExamGradeResult] = useState(null);
  const [examStarred, setExamStarred] = useState(false);
  const [toast, setToast] = useState(null);
  const [practicePaper, setPracticePaper] = useState(null);
  const [examInitialStep, setExamInitialStep] = useState(null);
  const [examReturnRoute, setExamReturnRoute] = useState(null);
  const [quickGradeMode, setQuickGradeMode] = useState(false);
  const [blankPaperFiles, setBlankPaperFiles] = useState([]);
  const [blankProcessing, setBlankProcessing] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const showComingSoon = () => showToast('功能开发中');

  const recentDocs = [
    { id: 1, title: '扫描全能王 2026-4-10 12.11', date: '2026/4/28 19:19', pages: 13, thumb: null },
    { id: 2, title: '扫描全能王 2026-04-20 15.24', date: '2026/4/28 19:05', pages: 4, thumb: null },
    { id: 3, title: 'Converting to Exce...d 2026-4-20 15.28', date: '2026/4/28 17:59', pages: 3, thumb: null },
    { id: 4, title: 'Convert to Word 2026-4-20 15.28', date: '2026/4/28 17:22', pages: 3, thumb: null },
    { id: 5, title: 'Convert to Word 2026-4-21 10.04', date: '2026/4/23 15:45', pages: 1, thumb: null },
    { id: 6, title: '鸿蒙', date: '2026/4/20 10:30', pages: 2, thumb: null },
  ];

  // --- Camera & File handling ---
  const handleCamera = () => {
    setExamFlow(false);
    document.getElementById('cs-camera-input').click();
  };

  const handleImportImage = () => {
    setExamFlow(false);
    document.getElementById('cs-album-input').click();
  };

  const handleCameraFileChange = (e) => {
    if (e.target.files.length > 0) {
      setCapturedFiles(Array.from(e.target.files));
      if (quickGradeMode) {
        setQuickGradeMode(false);
        setExamFlow(true);
      }
      setRoute('cs-edit');
    }
    e.target.value = '';
  };

  // --- Edit & List flow ---
  const handleEditConfirm = (files) => {
    setCapturedFiles(files);
    if (examFlow) {
      setRoute('ai-assistant');
    } else {
      setRoute('cs-list');
    }
  };

  const handleEditBack = () => {
    setCapturedFiles([]);
    if (examReturnRoute) {
      const ret = examReturnRoute;
      setExamReturnRoute(null);
      setRoute(ret);
    } else if (examFlow) {
      setRoute('exam-entry');
    } else {
      setRoute('tabs');
    }
  };

  const handleListBack = () => {
    setCapturedFiles([]);
    if (examFlow) {
      setRoute('exam-entry');
    } else {
      setRoute('tabs');
    }
  };

  const handleToolSelect = (tool) => {
    if (tool === 'exam') {
      if (examFlow || capturedFiles.length > 0) {
        setRoute('exam-app');
      } else {
        setRoute('exam-entry');
      }
    } else {
      showToast('功能开发中');
    }
  };

  // --- ExamEntryPage actions ---
  const handleExamScan = () => {
    setExamFlow(true);
    document.getElementById('cs-camera-input').click();
  };

  const handleExamSelectDoc = () => {
    setExamFlow(true);
    document.getElementById('cs-album-input').click();
  };

  const handleDemoExam = () => {
    setCachedExamId('demo');
    setCapturedFiles(['/exams/7dHyKX2haYaA57aBFW694CAS.jpg']);
    setExamFlow(true);
    setRoute('ai-assistant');
  };

  const handleExamBack = (result) => {
    const wasFeatureEntry = !!examInitialStep;
    const returnTo = examReturnRoute;
    setExamInitialStep(null);
    setExamReturnRoute(null);
    if (wasFeatureEntry) {
      setExamGradeResult(null);
      setExamGraded(false);
      setRoute(returnTo || 'exam-entry');
    } else if (examFlow && capturedFiles.length > 0) {
      setRoute('exam-workbench');
      if (result) {
        setExamGraded(true);
        setExamGradeResult(result);
      }
    } else {
      setRoute('tabs');
      setActiveTab('tools');
      setCapturedFiles([]);
      setCachedExamId(null);
      setExamFlow(false);
      setExamGraded(false);
      setExamGradeResult(null);
      setExamStarred(false);
    }
  };

  const handleExamBackFull = () => {
    setRoute('tabs');
    setActiveTab('tools');
    setCapturedFiles([]);
    setCachedExamId(null);
    setExamFlow(false);
    setExamGraded(false);
    setExamGradeResult(null);
    setExamStarred(false);
  };

  const handleWorkbenchBack = () => {
    setRoute('exam-entry');
    setCapturedFiles([]);
    setExamGraded(false);
    setExamStarred(false);
  };

  const handleWorkbenchGrade = () => {
    setRoute('ai-assistant');
  };

  const handleWorkbenchStar = () => {
    setExamStarred(true);
  };

  const handleQuickGrade = () => {
    setQuickGradeMode(true);
    setExamFlow(true);
    document.getElementById('cs-album-input').click();
  };

  const handleExamEntryBack = () => {
    setRoute('tabs');
    setActiveTab('tools');
    setExamFlow(false);
  };

  const handleSelectCachedExam = (examId) => {
    setCachedExamId(examId);
    setExamGradeResult(null);
    const doc = EXAM_DOCUMENTS.find(d => d.id === examId);
    if (doc) {
      setCapturedFiles([doc.thumb]);
      setExamFlow(true);
      setRoute('ai-assistant');
    } else {
      setExamFlow(false);
      setRoute('ai-assistant');
    }
  };

  // --- Hidden inputs as stable JSX (BUG 3 fix) ---
  const handleAddMoreFiles = (e) => {
    if (e.target.files.length > 0) {
      setCapturedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
    e.target.value = '';
  };

  const hiddenInputs = (
    <>
      <input
        key="cs-camera-input"
        id="cs-camera-input"
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        hidden
        onChange={handleCameraFileChange}
      />
      <input
        key="cs-album-input"
        id="cs-album-input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleCameraFileChange}
      />
      <input
        key="cs-addmore-input"
        id="cs-addmore-input"
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        hidden
        onChange={handleAddMoreFiles}
      />
    </>
  );

  // === Landing Page ===
  if (route === 'landing') {
    const hasSeen = localStorage.getItem(LANDING_SEEN_KEY);
    return (
      <LandingPage
        showBack={!!hasSeen}
        onStart={() => {
          localStorage.setItem(LANDING_SEEN_KEY, '1');
          setRoute('tabs');
        }}
      />
    );
  }

  // === DocEditPage ===
  if (route === 'cs-edit') {
    return <>{hiddenInputs}<DocEditPage files={capturedFiles} onConfirm={handleEditConfirm} onBack={handleEditBack} /></>;
  }

  // === DocListPage ===
  if (route === 'cs-list') {
    return (
      <>
        {hiddenInputs}
        <DocListPage
          files={capturedFiles}
          onBack={handleListBack}
          onAddMore={() => document.getElementById('cs-addmore-input').click()}
          onToolSelect={handleToolSelect}
          onExamAssistant={() => {
            setExamFlow(true);
            setRoute('ai-assistant');
          }}
        />
      </>
    );
  }

  // === ExamEntryPage ===
  if (route === 'exam-entry') {
    return (
      <>
        {hiddenInputs}
        <ExamEntryPage
          onBack={handleExamEntryBack}
          onScan={handleExamScan}
          onSelectDoc={handleExamSelectDoc}
          onDemo={handleDemoExam}
          onSelectCachedExam={handleSelectCachedExam}
          onLibrary={() => setRoute('exam-library')}
          onQuickGrade={handleQuickGrade}
          onFeature={(step) => {
            setExamReturnRoute('exam-entry');
            setExamInitialStep(step);
            setCapturedFiles([]);
            setCachedExamId(null);
            setExamFlow(false);
            setExamGradeResult(null);
            setExamGraded(false);
            setRoute('exam-app');
          }}
        />
      </>
    );
  }

  // === ExamWorkbench (试卷操作台) ===
  if (route === 'exam-workbench') {
    return (
      <>
        {hiddenInputs}
        <ExamWorkbench
          files={capturedFiles}
          cachedExamId={cachedExamId}
          onBack={handleWorkbenchBack}
          onGrade={handleWorkbenchGrade}
          onStar={handleWorkbenchStar}
          onAddMore={() => document.getElementById('cs-addmore-input').click()}
          isGraded={examGraded}
          isSaved={examStarred}
          gradeResult={examGradeResult}
          onSavePractice={(paper) => {
            setPracticePaper(paper);
            setRoute('practice-paper');
          }}
          onSaveBlank={(blankData) => {
            setPracticePaper({
              id: `blank_${Date.now()}`,
              title: '空白试卷',
              type: 'blank',
              images: blankData.images,
              date: new Date().toLocaleDateString('zh-CN'),
            });
            setRoute('practice-paper');
          }}
        />
      </>
    );
  }

  // === AI Assistant (对话式学习助手) ===
  if (route === 'ai-assistant') {
    let aiCachedResult = null;
    if (cachedExamId === 'demo') {
      aiCachedResult = DEMO_EXAM;
    } else if (examGradeResult) {
      aiCachedResult = examGradeResult;
    } else if (cachedExamId) {
      aiCachedResult = getExamResult(cachedExamId) || null;
    }
    return (
      <>
        {hiddenInputs}
        <ChatView
          files={capturedFiles}
          cachedExamId={cachedExamId}
          cachedResult={aiCachedResult}
          autoStart={!!aiCachedResult || (capturedFiles.length > 0)}
          onBack={() => {
            setRoute('tabs');
            setActiveTab('tools');
            setCapturedFiles([]);
            setCachedExamId(null);
            setExamGradeResult(null);
          }}
          onScan={() => {
            setExamFlow(true);
            setQuickGradeMode(true);
            setExamReturnRoute('ai-assistant');
            document.getElementById('cs-album-input')?.click();
          }}
          onCamera={() => {
            setExamFlow(true);
            setQuickGradeMode(true);
            setExamReturnRoute('ai-assistant');
            document.getElementById('cs-camera-input')?.click();
          }}
          onPickDoc={() => {
            setRoute('ai-pick-doc');
          }}
          onManageExams={() => {
            setRoute('exam-manage');
          }}
          onSavePaper={(paper) => {
            setPracticePaper(paper);
            setRoute('practice-paper');
          }}
          onGenerateBlank={(thumbUrl) => {
            setBlankProcessing(true);
            // 模拟 AI 去手写处理（实际接入时替换为真实 API）
            setTimeout(() => {
              setBlankPaperFiles([thumbUrl]);
              setBlankProcessing(false);
              setRoute('blank-paper-list');
            }, 2000);
          }}
          onTabChange={(tab) => {
            if (tab === 'all-notebook') setRoute('ai-notebook');
            else if (tab === 'wrongbook-redo') {
              setExamReturnRoute('ai-assistant');
              setExamInitialStep('redo');
              setRoute('exam-app');
            } else if (tab === 'all-wrongbook' || tab === 'wrongbook-export' || tab === 'wrongbook-review') {
              setExamReturnRoute('ai-assistant');
              setExamInitialStep('wrongbook');
              setRoute('exam-app');
            } else if (tab === 'all-report') {
              setExamReturnRoute('ai-assistant');
              setExamInitialStep('report');
              setRoute('exam-app');
            }
          }}
        />
        {blankProcessing && (
          <div className="cs-blank-loading">
            <div className="cs-blank-loading-inner">
              <div className="cs-blank-spinner" />
              <p>AI 正在去除手写内容...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  // === AI Notebook ===
  if (route === 'ai-notebook') {
    return (
      <NotebookView
        onBack={() => setRoute('ai-assistant')}
        onPractice={(result) => {
          showToast(`已生成${result.questions?.length || 0}道练习`);
          setRoute('ai-assistant');
        }}
        onSavePaper={(paper) => {
          setPracticePaper(paper);
          setRoute('practice-paper');
        }}
        onTabChange={(tab) => {
          if (tab === 'chat') setRoute('ai-assistant');
          else if (tab === 'wrongbook') {
            setExamReturnRoute('ai-notebook');
            setExamInitialStep('wrongbook');
            setRoute('exam-app');
          } else if (tab === 'report') {
            setExamReturnRoute('ai-notebook');
            setExamInitialStep('report');
            setRoute('exam-app');
          }
        }}
      />
    );
  }

  // === Exam Manage (试卷管理) ===
  if (route === 'exam-manage') {
    return (
      <ExamManagePage
        onBack={() => setRoute('ai-assistant')}
        onSelectExam={(exam) => {
          const result = getExamResult(exam.id) || null;
          if (result) {
            setCachedExamId(exam.id);
            setExamGradeResult(result);
            setCapturedFiles(exam.thumb ? [exam.thumb] : []);
            setExamFlow(true);
            setRoute('ai-assistant');
          } else {
            showToast('该试卷暂无批改数据');
          }
        }}
      />
    );
  }

  // === AI Pick Doc (从应用内选择文档) ===
  if (route === 'ai-pick-doc') {
    const appDocs = [
      { id: 'exam-1', title: '七年级数学期末检测', thumb: '/exams/5NFfaS5PHSg81Ff2K20a8daY.jpg', subject: '数学' },
      { id: 'exam-2', title: '数据的收集与整理', thumb: '/exams/7dHyKX2haYaA57aBFW694CAS.jpg', subject: '数学' },
      { id: 'exam-3', title: '三年级语文模拟测试', thumb: '/exams/纯文本-739398.jpg', subject: '语文' },
      { id: 'exam-4', title: '初中生物统一考试', thumb: '/exams/试卷作业_45365.jpg', subject: '生物' },
      { id: 'exam-5', title: '四年级语文期中测评', thumb: '/exams/C488hA2E866dtdLJA8E3J6We.jpg', subject: '语文' },
      { id: 'exam-6', title: '三年级道德与法治', thumb: '/exams/三年级道德与法治_thumb-1.jpg', subject: '道法' },
    ];
    return (
      <div className="cv-page">
        <div className="cv-header">
          <button className="cv-back-btn" onClick={() => setRoute('ai-assistant')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="cv-header-title">选择文档</div>
          <div className="cv-header-right"></div>
        </div>
        <div className="cv-messages" style={{ padding: '16px', gap: '8px' }}>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 12px' }}>选择一份已扫描的文档进行 AI 批改：</p>
          {appDocs.map(doc => (
            <button key={doc.id} className="cv-exam-item" onClick={() => {
              setCapturedFiles([doc.thumb]);
              setCachedExamId(doc.id);
              const result = getExamResult(doc.id) || null;
              setExamGradeResult(result);
              setExamFlow(true);
              setRoute('ai-assistant');
            }}>
              <img className="cv-exam-thumb" src={doc.thumb} alt="" />
              <div className="cv-exam-info">
                <span className="cv-exam-title">{doc.title}</span>
                <span className="cv-exam-meta">{doc.subject}</span>
              </div>
              {getExamResult(doc.id) ? (
                <span style={{ fontSize: '11px', color: '#43A047', background: '#E8F5E9', padding: '2px 8px', borderRadius: '4px' }}>已批改</span>
              ) : (
                <span style={{ fontSize: '11px', color: '#999', background: '#f5f5f5', padding: '2px 8px', borderRadius: '4px' }}>待批改</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // === PracticePaperPage (练习卷) ===
  if (route === 'practice-paper' && practicePaper) {
    return (
      <PracticePaperPage
        paper={practicePaper}
        onBack={() => {
          if (practicePaper._from === 'notebook') setRoute('ai-notebook');
          else if (practicePaper._from === 'chat') setRoute('ai-assistant');
          else setRoute('exam-workbench');
        }}
      />
    );
  }

  // === Blank Paper List (空白试卷预览) ===
  if (route === 'blank-paper-list' && blankPaperFiles.length > 0) {
    return (
      <DocListPage
        files={blankPaperFiles}
        onBack={() => {
          setBlankPaperFiles([]);
          setRoute('ai-assistant');
        }}
        onAddMore={() => showToast('功能开发中')}
        onToolSelect={() => {}}
        onExamAssistant={() => {
          setBlankPaperFiles([]);
          setRoute('ai-assistant');
        }}
      />
    );
  }

  // === ExamLibrary (试卷库) ===
  if (route === 'exam-library') {
    return (
      <ExamLibrary
        onBack={() => {
          if (examFlow) setRoute('exam-entry');
          else if (cachedExamId || capturedFiles.length > 0) setRoute('exam-app');
          else setRoute('exam-entry');
        }}
        onOpenExam={(exam, gradeResult) => {
          setCachedExamId(null);
          setExamFlow(false);
          if (gradeResult) {
            setCapturedFiles([]);
            setExamGraded(true);
            setExamGradeResult(gradeResult);
            setRoute('exam-app');
          } else {
            setCapturedFiles(['/exams/7dHyKX2haYaA57aBFW694CAS.jpg']);
            setExamGraded(false);
            setExamGradeResult(null);
            setExamStarred(true);
            setRoute('exam-workbench');
          }
        }}
      />
    );
  }

  // === ExamApp ===
  if (route === 'exam-app') {
    let cachedResult = null;
    let cachedDocTitle = null;
    if (examGradeResult && !cachedExamId && capturedFiles.length === 0) {
      cachedResult = examGradeResult;
      cachedDocTitle = '历史批改结果';
    } else if (cachedExamId === 'demo') {
      cachedResult = DEMO_EXAM;
      cachedDocTitle = '试卷批改示例';
    } else if (cachedExamId) {
      cachedResult = getExamResult(cachedExamId) || null;
      const cachedDoc = EXAM_DOCUMENTS.find(d => d.id === cachedExamId);
      cachedDocTitle = cachedDoc?.title || null;
    }
    const skipPreview = !cachedResult && capturedFiles.length > 0;
    return (
      <>
        {hiddenInputs}
        <ExamApp
          initialFiles={capturedFiles}
          onExit={handleExamBack}
          onLibrary={() => { setRoute('exam-library'); }}
          cachedResult={cachedResult}
          cachedDocTitle={cachedDocTitle}
          skipPreview={skipPreview}
          initialStep={examInitialStep}
          examImages={capturedFiles}
        />
      </>
    );
  }

  // === Teacher Mode Pages ===
  if (route === 'teacher-home') {
    return (
      <TeacherHomePage
        onBack={() => { setRoute('tabs'); setActiveTab('tools'); }}
        onBatchGrade={() => setRoute('teacher-batch')}
        onClassManage={() => setRoute('teacher-class')}
        onReport={() => setRoute('teacher-report')}
        onQuizGen={() => setRoute('teacher-quiz')}
      />
    );
  }

  if (route === 'teacher-class') {
    return <ClassManagePage onBack={() => setRoute('teacher-home')} />;
  }

  if (route === 'teacher-batch') {
    return <BatchGradePage onBack={() => setRoute('teacher-home')} onReport={() => setRoute('teacher-report')} />;
  }

  if (route === 'teacher-report') {
    return <ClassReportPage onBack={() => setRoute('teacher-home')} onExport={(exam) => setRoute('teacher-export')} />;
  }

  if (route === 'teacher-quiz') {
    return <QuizGeneratorPage onBack={() => setRoute('teacher-home')} />;
  }

  if (route === 'teacher-export') {
    return <ExportPage onBack={() => setRoute('teacher-report')} />;
  }

  // === Tabs ===
  return (
    <div className="cs-app">
      {hiddenInputs}

      {/* Toast */}
      {toast && <div className="cs-toast">{toast}</div>}

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <div className="cs-home">
          <div className="cs-banner">
            <div className="cs-banner-content">
              <div className="cs-banner-logo">
                <span className="cs-banner-cs">CS</span>
                <span className="cs-banner-title">扫描全能王</span>
              </div>
            </div>
          </div>

          <div className="cs-search-wrap">
            <div className="cs-search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span className="cs-search-placeholder">试试搜索应用，如 "转 Word"</span>
            </div>
          </div>

          <div className="cs-quick-grid">
            <div className="cs-quick-item" onClick={handleCamera}>
              <div className="cs-quick-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20"/><path d="M9 3v5"/><path d="M15 3v5"/><circle cx="12" cy="15" r="3"/></svg></div>
              <span>智能扫描</span>
            </div>
            <div className="cs-quick-item" onClick={handleImportImage}>
              <div className="cs-quick-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E91E63" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>
              <span>导入图片</span>
            </div>
            <div className="cs-quick-item" onClick={handleImportImage}>
              <div className="cs-quick-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <span>导入文档</span>
            </div>
            <div className="cs-quick-item" onClick={showComingSoon}>
              <div className="cs-quick-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12h4"/><path d="M10 16h4"/></svg></div>
              <span>PDF 工具包</span>
            </div>
            <div className="cs-quick-item" onClick={showComingSoon}>
              <div className="cs-quick-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#607D8B" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
              <span>扫描证件</span>
            </div>
            <div className="cs-quick-item" onClick={showComingSoon}>
              <div className="cs-quick-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#009688" strokeWidth="1.5"><path d="M4 7V4a2 2 0 012-2h2"/><path d="M4 17v3a2 2 0 002 2h2"/><path d="M16 2h2a2 2 0 012 2v3"/><path d="M16 22h2a2 2 0 002-2v-3"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="17" y2="13"/><line x1="7" y1="17" x2="13" y2="17"/></svg></div>
              <span>提取文字</span>
            </div>
            <div className="cs-quick-item" onClick={showComingSoon}>
              <div className="cs-quick-icon cs-quick-hot"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h3"/><path d="M8 17h5"/></svg><span className="cs-hot-badge">HOT</span></div>
              <span>拍图转 Word</span>
            </div>
            <div className="cs-quick-item" onClick={() => { setActiveTab('tools'); }}>
              <div className="cs-quick-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></div>
              <span>全部</span>
            </div>
          </div>

          <div className="cs-recent">
            <div className="cs-recent-header">
              <span className="cs-recent-title">最近文档</span>
              <span className="cs-recent-all" onClick={() => setActiveTab('docs')}>全部文档 {'>'}</span>
            </div>
            <div className="cs-recent-list">
              {recentDocs.map((doc, i) => (
                <div key={doc.id} className="cs-doc-row-wrap">
                  <div className="cs-doc-row" onClick={showComingSoon} style={{cursor:'pointer'}}>
                    <div className="cs-doc-thumb-sm">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div className="cs-doc-row-info">
                      <span className="cs-doc-row-title">{doc.title}</span>
                      <span className="cs-doc-row-meta">{doc.date}  <span className="cs-doc-pages">▢ {doc.pages}</span></span>
                    </div>
                    <div className="cs-doc-row-check">
                      <div className="cs-checkbox"></div>
                    </div>
                  </div>
                  {i === 0 && (
                    <div className="cs-doc-row-actions">
                      <button className="cs-doc-action-btn" onClick={showComingSoon}>分享</button>
                      <button className="cs-doc-action-btn cs-doc-action-primary" onClick={showComingSoon}>✦ 转 Word</button>
                      <button className="cs-doc-action-btn" onClick={showComingSoon}>查看</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DOCS TAB */}
      {activeTab === 'docs' && (
        <div className="cs-home">
          <div className="cs-docs-header">
            <h2>文档</h2>
            <div className="cs-docs-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>试试搜索文档</span>
            </div>
          </div>

          <div className="cs-docs-actions">
            <div className="cs-docs-action-item" onClick={handleImportImage}>
              <div className="cs-docs-action-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
              </div>
              <span>导入文档</span>
            </div>
            <div className="cs-docs-action-item" onClick={handleImportImage}>
              <div className="cs-docs-action-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              </div>
              <span>导入图片</span>
            </div>
            <div className="cs-docs-action-item" onClick={showComingSoon}>
              <div className="cs-docs-action-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
              </div>
              <span>新建文件夹</span>
            </div>
          </div>

          <div className="cs-docs-count">
            <span>文件夹</span>
          </div>

          <div className="cs-docs-list">
            <div className="cs-folder-row" onClick={() => { setRoute('exam-library'); }}>
              <div className="cs-folder-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#4CAF50" stroke="none"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
              </div>
              <div className="cs-folder-info">
                <span className="cs-folder-title">我的试卷库</span>
                <span className="cs-folder-meta">试卷批改记录与收藏</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>

          <div className="cs-docs-count">
            <span>文档 · 5</span>
          </div>

          <div className="cs-docs-list">
            {[
              { id: 'exam1', title: '纯文本-739398', path: '/exams/纯文本-739398.jpg', date: '2026/5/8' },
              { id: 'exam2', title: '试卷作业_45365', path: '/exams/试卷作业_45365.jpg', date: '2026/5/6' },
              { id: 'exam3', title: '5NFfaS5PHSg81Ff2K20a8daY', path: '/exams/5NFfaS5PHSg81Ff2K20a8daY.jpg', date: '2026/5/5' },
              { id: 'exam4', title: '7dHyKX2haYaA57aBFW694CAS', path: '/exams/7dHyKX2haYaA57aBFW694CAS.jpg', date: '2026/5/4' },
              { id: 'exam5', title: 'C488hA2E866dtdLJA8E3J6We', path: '/exams/C488hA2E866dtdLJA8E3J6We.jpg', date: '2026/5/3' },
            ].map(doc => (
              <div key={doc.id} className="cs-exam-doc-row" onClick={() => {
                setCapturedFiles([doc.path]);
                setExamFlow(true);
                setRoute('ai-assistant');
              }}>
                <div className="cs-exam-doc-thumb">
                  <img src={doc.path} alt={doc.title} />
                </div>
                <div className="cs-exam-doc-info">
                  <span className="cs-exam-doc-title">{doc.title}</span>
                  <span className="cs-exam-doc-meta">{doc.date} · 1页</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOOLBOX TAB */}
      {activeTab === 'tools' && (
        <div className="cs-home">
          <div className="cs-toolbox-header">
            <h2>工具箱</h2>
            <div className="cs-toolbox-right">
              <span className="cs-feature-new">▢ 功能上新</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>

          <div className="cs-cat-tabs">
            {['服务', '导入', '格式转换', '文档编辑', '实用工具', '求职与校园'].map(cat => (
              <button key={cat} className={`cs-cat-tab ${toolboxCategory === cat ? 'active' : ''}`} onClick={() => setToolboxCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          <div className="cs-tool-section">
            <div className="cs-tool-cards">
              <div className="cs-tool-card-lg" onClick={() => setRoute('exam-entry')}>
                <span className="cs-tool-card-title">AI 搜题</span>
                <div className="cs-tool-card-img">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1"><path d="M9 11l3 3L22 4"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
              </div>
              <div className="cs-tool-card-lg" onClick={showComingSoon}>
                <span className="cs-tool-card-title">简历模板</span>
                <div className="cs-tool-card-img">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="1"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              </div>
            </div>
            <div className="cs-tool-cards">
              <div className="cs-tool-card-lg" onClick={() => { setCachedExamId(null); setCapturedFiles([]); setExamGradeResult(null); setRoute('ai-assistant'); }}>
                <span className="cs-tool-card-title">试卷智能助手</span>
                <div className="cs-tool-card-img">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="cs-tool-section">
            <h3 className="cs-tool-section-title">实用工具</h3>
            <div className="cs-tool-cards">
              <div className="cs-tool-card-lg" onClick={showComingSoon}>
                <span className="cs-tool-card-title">AI 测量</span>
                <div className="cs-tool-card-img">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1"><path d="M2 12h20"/><path d="M6 8v8"/><path d="M18 8v8"/></svg>
                </div>
              </div>
              <div className="cs-tool-card-lg" onClick={showComingSoon}>
                <span className="cs-tool-card-title">滚动截屏</span>
                <div className="cs-tool-card-img">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="1"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
                </div>
              </div>
            </div>
            <div className="cs-tool-cards">
              <div className="cs-tool-card-lg" onClick={showComingSoon}>
                <span className="cs-tool-card-title">拍照计数</span>
                <div className="cs-tool-card-img">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="1"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><circle cx="8" cy="16" r="3"/><circle cx="16" cy="16" r="3"/></svg>
                </div>
              </div>
              <div className="cs-tool-card-lg" onClick={showComingSoon}>
                <span className="cs-tool-card-title">二维码</span>
                <div className="cs-tool-card-img">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00BCD4" strokeWidth="1"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="cs-home">
          <div className="cs-profile-section">
            <div className="cs-profile-card">
              <div className="cs-avatar-lg">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="cs-profile-text">
                <span className="cs-profile-name">用户</span>
                <span className="cs-profile-sub">免费版 · 升级VIP享更多功能</span>
              </div>
            </div>
            <div className="cs-profile-menu">
              <div className="cs-menu-row" onClick={showComingSoon}><span>我的VIP</span><span className="cs-menu-r">{'>'}</span></div>
              <div className="cs-menu-row" onClick={showComingSoon}><span>云空间</span><span className="cs-menu-r">{'>'}</span></div>
              <div className="cs-menu-row" onClick={showComingSoon}><span>使用记录</span><span className="cs-menu-r">{'>'}</span></div>
              <div className="cs-menu-row" onClick={showComingSoon}><span>设置</span><span className="cs-menu-r">{'>'}</span></div>
              <div className="cs-menu-row" onClick={() => setRoute('landing')}><span>关于试卷助手</span><span className="cs-menu-r">{'>'}</span></div>
              <div className="cs-menu-row" onClick={showComingSoon}><span>帮助与反馈</span><span className="cs-menu-r">{'>'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Camera FAB */}
      <div className="cs-fab" onClick={handleCamera}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
      </div>

      {/* Bottom Tab Bar */}
      <div className="cs-tabbar">
        <button className={`cs-tabbar-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <div className="cs-tabbar-icon-wrap">
            <span className="cs-tabbar-cs-icon">CS</span>
          </div>
          <span>首页</span>
        </button>
        <button className={`cs-tabbar-item ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/></svg>
          <span>全部文档</span>
        </button>
        <div className="cs-tabbar-spacer"></div>
        <button className={`cs-tabbar-item ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <span>工具箱</span>
        </button>
        <button className={`cs-tabbar-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>我的</span>
        </button>
      </div>
    </div>
  );
}
