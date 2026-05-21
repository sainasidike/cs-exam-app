import { useState, useEffect, useRef, useMemo } from 'react';
import { createFlowEngine } from '../services/flowEngine.js';
import { EXAM_DOCUMENTS, EXAM_GRADABLE } from '../cachedExams.js';
import { DEMO_EXAM } from '../demoData.js';
import { getWrongQuestions, getExamLibrary, getExamResult, getExamMessages, getExamNotes, getExamWrong, savePracticePaper, getReviewSchedule, markReviewDone } from '../services/storageService.js';
import { generateReviewQuiz, callZhipuAI } from '../services/ocrService.js';
import { getNotebook, getNotebookStats } from '../services/notebookService.js';
import MessageBubble from './MessageBubble.jsx';
import SummaryCard from './SummaryCard.jsx';
import QuestionCard from './QuestionCard.jsx';
import ExplanationCard from './ExplanationCard.jsx';
import ProgressCard from './ProgressCard.jsx';
import ActionButtons from './ActionButtons.jsx';
import PracticeCard from './PracticeCard.jsx';
import InputBar from './InputBar.jsx';

export default function ChatView({ files, cachedExamId, cachedResult, onBack, onTabChange, onScan, onCamera, onPickDoc, onManageExams, onSavePaper, autoStart }) {
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [showInput, setShowInput] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [currentExamTitle, setCurrentExamTitle] = useState('');
  const [currentExamThumb, setCurrentExamThumb] = useState(null);
  const [currentExamId, setCurrentExamId] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [welcomeTab, setWelcomeTab] = useState('docs');
  const [wrongMode, setWrongMode] = useState('list');
  const [wrongRedoAnswers, setWrongRedoAnswers] = useState({});
  const [wrongQuizQuestions, setWrongQuizQuestions] = useState(null);
  const [wrongQuizAnswers, setWrongQuizAnswers] = useState({});
  const [wrongQuizLoading, setWrongQuizLoading] = useState(false);
  const [notesMode, setNotesMode] = useState('list');
  const [notesPracticeQuestions, setNotesPracticeQuestions] = useState(null);
  const [notesPracticeAnswers, setNotesPracticeAnswers] = useState({});
  const [notesPracticeLoading, setNotesPracticeLoading] = useState(false);
  const scrollRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const engine = useMemo(() => {
    return createFlowEngine({
      onMessage: (msg) => {
        setMessages(prev => {
          if (msg.loading) {
            return [...prev.filter(m => !m.loading), msg];
          }
          return [...prev.filter(m => !m.loading), msg];
        });
        if (msg.type === 'ai_input_needed') {
          setShowInput(true);
          setInputPlaceholder(msg.placeholder || '输入你的问题...');
        } else if (msg.type === 'ai_action') {
          setShowInput(false);
        }
      },
      onPhaseChange: (p) => setPhase(p),
      onComplete: () => setPhase('done'),
    });
  }, []);

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (autoStart && !isStarted && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      handleStart();
    }
  }, [autoStart, isStarted]);

  const handleStart = () => {
    const examId = cachedExamId || `exam_${Date.now()}`;
    setCurrentExamId(examId);
    setIsStarted(true);
    setActiveTab('chat');

    const savedMessages = getExamMessages(examId);
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
      const result = cachedResult || getExamResult(examId);
      engine.restore(examId, result, savedMessages);
      const lastSaved = savedMessages[savedMessages.length - 1];
      if (lastSaved?.type === 'ai_input_needed') {
        setShowInput(true);
        setInputPlaceholder(lastSaved.placeholder || '输入你的问题...');
      }
      if (cachedExamId) {
        const doc = EXAM_DOCUMENTS.find(d => d.id === cachedExamId);
        if (doc) {
          setCurrentExamTitle(doc.title);
          setCurrentExamThumb(doc.thumb);
        }
      }
      return;
    }

    setMessages([]);
    if (cachedExamId) {
      const doc = EXAM_DOCUMENTS.find(d => d.id === cachedExamId);
      if (doc) {
        setCurrentExamTitle(doc.title);
        setCurrentExamThumb(doc.thumb);
      }
    } else if (files && files.length > 0) {
      if (typeof files[0] === 'string') {
        setCurrentExamThumb(files[0]);
      } else {
        setCurrentExamThumb(URL.createObjectURL(files[0]));
      }
    }
    engine.start(files, examId, cachedResult);
  };

  const startWithExam = (doc, result) => {
    const examId = doc.id;
    setCurrentExamId(examId);
    setIsStarted(true);
    setActiveTab('chat');
    setCurrentExamTitle(doc.title);
    setCurrentExamThumb(doc.thumb || null);

    const savedMessages = getExamMessages(examId);
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
      const restoreResult = result || getExamResult(examId);
      engine.restore(examId, restoreResult, savedMessages);
      const lastSaved = savedMessages[savedMessages.length - 1];
      if (lastSaved?.type === 'ai_input_needed') {
        setShowInput(true);
        setInputPlaceholder(lastSaved.placeholder || '输入你的问题...');
      }
      return;
    }

    setMessages([]);
    if (result) {
      engine.start(null, doc.id, result);
    } else {
      const imageUrl = doc.thumb?.split('?')[0] || doc.thumb;
      engine.start([imageUrl], doc.id, null);
    }
  };

  const handleDemo = () => {
    const examId = 'exam-2';
    setCurrentExamId(examId);
    setIsStarted(true);
    setActiveTab('chat');
    setCurrentExamTitle('演示试卷');
    setCurrentExamThumb('/exams/7dHyKX2haYaA57aBFW694CAS.jpg');

    const savedMessages = getExamMessages(examId);
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
      engine.restore(examId, DEMO_EXAM, savedMessages);
      const lastSaved = savedMessages[savedMessages.length - 1];
      if (lastSaved?.type === 'ai_input_needed') {
        setShowInput(true);
        setInputPlaceholder(lastSaved.placeholder || '输入你的问题...');
      }
      return;
    }

    setMessages([]);
    const demoResult = DEMO_EXAM;
    engine.start(null, 'exam-2', demoResult);
  };

  const handleBackToWelcome = () => {
    setIsStarted(false);
    setMessages([]);
    setPhase('idle');
    setShowInput(false);
    setCurrentExamTitle('');
    setCurrentExamThumb(null);
    setCurrentExamId(null);
    setActiveTab('chat');
    engine.cancel();
  };

  const handleAction = (actionId, data) => {
    if (actionId === 'review_wrong') {
      setActiveTab('wrongbook');
      return;
    }
    if (actionId === 'done_exit') {
      handleBackToWelcome();
      return;
    }
    engine.handleUserAction(actionId, data);
  };

  const handleSendMessage = (text) => {
    engine.handleUserMessage(text);
  };

  const handlePracticeAnswer = (question, selected) => {
    const correct = selected === question.answer;
    engine.handleUserAction('practice_answer', { selected, correct, question });
  };

  // === Scoped data for current exam ===
  const examNotes = currentExamId ? getExamNotes(currentExamId) : [];
  const examWrong = currentExamId ? getExamWrong(currentExamId) : [];

  const renderWelcome = () => {
    const wrongCount = getWrongQuestions().length;
    const notebookStats = getNotebookStats();
    const library = getExamLibrary();

    const studiedExams = library.map(record => {
      const doc = EXAM_DOCUMENTS.find(d => d.id === record.id);
      return {
        id: record.id,
        title: record.title || doc?.title || '试卷',
        subject: record.subject || doc?.subject || '综合',
        thumb: record.thumb || doc?.thumb || null,
        stats: { total: record.total || 0, correct: record.correct || 0, wrong: record.wrong || 0, score: record.score || 0 },
      };
    });

    const hasStudied = studiedExams.length > 0;

    const startStudiedExam = (exam) => {
      const result = getExamResult(exam.id);
      if (result) startWithExam(exam, result);
    };

    const computeReminder = () => {
      if (!hasStudied) return null;
      const latest = library[0];
      if (!latest) return null;

      const msgs = getExamMessages(latest.id);
      const result = getExamResult(latest.id);
      if (!result) return null;

      const questions = result.questions || [];
      const wrongCount = questions.filter(q => !q.correct).length;
      if (wrongCount === 0) return null;

      const teachCount = msgs.filter(m => m.type === 'ai_teach_intro').length;
      const practiceCount = msgs.filter(m => m.type === 'ai_feedback').length;

      const doc = EXAM_DOCUMENTS.find(d => d.id === latest.id);
      const examTitle = latest.title || doc?.title || '试卷';

      if (teachCount < wrongCount) {
        const remaining = wrongCount - teachCount;
        return {
          text: `「${examTitle}」还有 ${remaining} 道错题没讲解完，要继续吗？还是扫描新试卷开始批改？`,
          cta: '继续讲解',
          exam: { id: latest.id, title: examTitle, thumb: doc?.thumb || null },
        };
      }

      if (teachCount >= wrongCount && practiceCount === 0) {
        return {
          text: `「${examTitle}」的错题都讲完了，来做几道巩固练习吧！`,
          cta: '开始练习',
          exam: { id: latest.id, title: examTitle, thumb: doc?.thumb || null },
        };
      }

      const correctCount = msgs.filter(m => m.type === 'ai_feedback' && m.correct).length;
      if (practiceCount > 0 && correctCount < practiceCount) {
        return {
          text: `上次练习正确率 ${Math.round(correctCount / practiceCount * 100)}%，薄弱知识点还需巩固！`,
          cta: '再练一次',
          exam: { id: latest.id, title: examTitle, thumb: doc?.thumb || null },
        };
      }

      return null;
    };

    const reminder = computeReminder();

    const computeReviewPlan = () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const allWrong = getWrongQuestions();
      const schedule = getReviewSchedule();
      const history = schedule.history || [];

      const getNextSaturday = () => {
        const d = new Date(today);
        const daysUntil = (6 - dayOfWeek + 7) % 7 || 7;
        d.setDate(d.getDate() + (dayOfWeek === 6 ? 0 : daysUntil));
        return d;
      };

      const getMonthEnd = () => {
        const d = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return d;
      };

      const getSemesterEnd = () => {
        const month = today.getMonth();
        if (month >= 1 && month <= 6) return new Date(today.getFullYear(), 5, 20);
        return new Date(today.getFullYear() + 1, 0, 10);
      };

      const diffDays = (target) => Math.max(0, Math.ceil((target - today) / 86400000));

      const weekWrong = allWrong.filter(q => {
        if (!q.addedAt) return false;
        const added = new Date(q.addedAt);
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        return added >= weekStart;
      });

      const lastWeekReview = history.find(h => h.type === 'weekly');
      const lastMonthReview = history.find(h => h.type === 'monthly');

      const satDate = getNextSaturday();
      const monthEnd = getMonthEnd();
      const semEnd = getSemesterEnd();

      const items = [];

      const isToday = (d) => d.toDateString() === today.toDateString();

      items.push({
        type: 'weekly',
        label: '周复习',
        date: `${satDate.getMonth() + 1}/${satDate.getDate()}`,
        daysLeft: dayOfWeek === 6 ? 0 : diffDays(satDate),
        isActive: dayOfWeek === 6,
        subtitle: weekWrong.length > 0 ? `本周新增 ${weekWrong.length} 道错题待巩固` : '本周暂无新错题',
        count: weekWrong.length,
      });

      items.push({
        type: 'monthly',
        label: '月度测验',
        date: `${monthEnd.getMonth() + 1}/${monthEnd.getDate()}`,
        daysLeft: diffDays(monthEnd),
        isActive: isToday(monthEnd),
        subtitle: `覆盖本月全部薄弱知识点`,
        count: allWrong.length,
      });

      items.push({
        type: 'semester',
        label: '期末复习',
        date: `${semEnd.getMonth() + 1}/${semEnd.getDate()}`,
        daysLeft: diffDays(semEnd),
        isActive: isToday(semEnd),
        subtitle: `综合测验 + 错题重做`,
        count: allWrong.length,
      });

      if (lastWeekReview) {
        items.push({
          type: 'done',
          label: '上周复习',
          date: lastWeekReview.date?.slice(5).replace('-', '/'),
          daysLeft: -1,
          isActive: false,
          subtitle: lastWeekReview.score != null ? `得分 ${lastWeekReview.score}%` : '已完成',
          count: 0,
        });
      }

      return items;
    };

    const reviewPlan = computeReviewPlan();

    if (!hasStudied) {
      return (
        <div className="cv-empty">
          <div className="cv-empty-card">
            <div className="cv-empty-visual">
              <img className="cv-empty-exam-img" src="/exams/5NFfaS5PHSg81Ff2K20a8daY.jpg" alt="试卷" />
              <div className="cv-empty-exam-overlay">
                <div className="cv-empty-exam-score">85<small>分</small></div>
              </div>
            </div>
            <div className="cv-empty-card-body">
              <h2 className="cv-empty-card-title">拍试卷，30秒出结果</h2>
              <div className="cv-empty-features">
                <span className="cv-empty-feat">✓ 自动批改 + 精准打分</span>
                <span className="cv-empty-feat">✓ 找出薄弱知识点</span>
                <span className="cv-empty-feat">✓ 生成针对性练习</span>
              </div>
              <button className="cv-empty-cta" onClick={() => onCamera?.()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                立即扫描试卷
              </button>
              <button className="cv-empty-demo" onClick={handleDemo}>体验 Demo</button>
            </div>
          </div>

          <div className="cv-empty-divider"><span>或选择应用内试卷</span></div>
          <div className="cv-empty-docs">
            {EXAM_DOCUMENTS.map(doc => (
              <button key={doc.id} className="cv-empty-doc" onClick={() => {
                const cached = getExamResult(doc.id);
                if (cached) {
                  startWithExam(doc, cached);
                } else {
                  startWithExam(doc, null);
                }
              }}>
                <img className="cv-empty-doc-img" src={doc.thumb} alt="" />
                <div className="cv-empty-doc-info">
                  <span className="cv-empty-doc-name">{doc.title}</span>
                  <span className="cv-empty-doc-meta">{doc.date || '2026/5'} · {doc.pages || 1}页</span>
                </div>
                {EXAM_GRADABLE.includes(doc.id) && (
                  <span className="cv-empty-doc-badge">可批改</span>
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="cv-home">
        {reminder ? (
          <div className="cv-home-bubble-wrap">
            <div className="cv-home-bubble-avatar">AI</div>
            <div className="cv-home-bubble">
              <p className="cv-home-bubble-text">{reminder.text}</p>
              <div className="cv-home-bubble-actions">
                <button className="cv-home-bubble-btn" onClick={() => startStudiedExam(reminder.exam)}>
                  {reminder.cta} →
                </button>
                <button className="cv-home-bubble-btn scan" onClick={() => onCamera?.()}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  扫描新试卷
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="cv-home-bubble-wrap">
            <div className="cv-home-bubble-avatar">AI</div>
            <div className="cv-home-bubble">
              <p className="cv-home-bubble-text">拍照上传试卷，30秒出批改结果！</p>
              <div className="cv-home-bubble-actions">
                <button className="cv-home-bubble-btn" onClick={() => onCamera?.()}>
                  扫描新试卷 →
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="cv-review-plan">
          <div className="cv-review-plan-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>学习计划</span>
          </div>
          {reviewPlan.map((item) => (
            <div key={item.type} className="cv-review-item-wrap">
              <div
                className={`cv-review-item ${item.isActive ? 'active' : ''} ${item.type === 'done' ? 'done' : ''}`}
                onClick={() => {
                  if (item.isActive && item.count > 0) {
                    onTabChange?.('all-wrongbook');
                  }
                }}
              >
                <span className="cv-review-item-dot">{item.type === 'done' ? '✓' : '○'}</span>
                <span className="cv-review-item-label">{item.label}</span>
                <span className="cv-review-item-date">{item.date}</span>
                <span className="cv-review-item-days">
                  {item.type === 'done' ? '完成' : item.daysLeft === 0 ? '今天' : `${item.daysLeft}天后`}
                </span>
                {item.isActive && item.count > 0 && <span className="cv-review-item-go">开始</span>}
              </div>
              {item.type === 'weekly' && item.subtitle && (
                <div className="cv-review-subtitle" onClick={() => onTabChange?.('wrongbook-redo')}>
                  {item.subtitle} &gt;
                </div>
              )}
            </div>
          ))}
        </div>


        <div className="cv-home-tabs">
          <button className={`cv-home-tab ${welcomeTab === 'docs' ? 'active' : ''}`} onClick={() => setWelcomeTab('docs')}>
            应用内试卷
          </button>
          <button className={`cv-home-tab ${welcomeTab === 'graded' ? 'active' : ''}`} onClick={() => setWelcomeTab('graded')}>
            已批改
            {studiedExams.length > 0 && <span className="cv-home-tab-badge">{studiedExams.length}</span>}
          </button>
          <button className={`cv-home-tab ${welcomeTab === 'wrong' ? 'active' : ''}`} onClick={() => setWelcomeTab('wrong')}>
            全部错题
            {wrongCount > 0 && <span className="cv-home-tab-badge">{wrongCount}</span>}
          </button>
        </div>

        <div className="cv-home-tab-content">
          {welcomeTab === 'docs' && (
            <div className="cv-home-docs">
              {EXAM_DOCUMENTS.map(doc => (
                <button key={doc.id} className="cv-home-doc-item" onClick={() => {
                  const cached = getExamResult(doc.id);
                  if (cached) {
                    startWithExam(doc, cached);
                  } else {
                    startWithExam(doc, null);
                  }
                }}>
                  <img className="cv-home-doc-img" src={doc.thumb} alt="" />
                  <div className="cv-home-doc-info">
                    <span className="cv-home-doc-name">{doc.title}</span>
                    <span className="cv-home-doc-meta">{doc.date || '2026/5'} · {doc.pages || 1}页</span>
                  </div>
                  {EXAM_GRADABLE.includes(doc.id) && (
                    <span className="cv-home-doc-badge">可批改</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {welcomeTab === 'graded' && (
            <div className="cv-home-graded">
              <button className="cv-home-entry-link" onClick={() => onManageExams?.()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                我的试卷库
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              {studiedExams.length === 0 && (
                <div className="cv-home-empty">还没有批改过试卷</div>
              )}
              {studiedExams.map(exam => (
                <button key={exam.id} className="cv-home-doc-item" onClick={() => startStudiedExam(exam)}>
                  {exam.thumb && <img className="cv-home-doc-img" src={exam.thumb} alt="" />}
                  {!exam.thumb && <div className="cv-home-doc-img cv-home-doc-img-placeholder"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>}
                  <div className="cv-home-doc-info">
                    <span className="cv-home-doc-name">{exam.title}</span>
                    <span className="cv-home-doc-meta">{exam.subject} · {exam.stats.total}题</span>
                  </div>
                  <div className="cv-home-score-wrap">
                    <span className={`cv-home-score ${exam.stats.score >= 80 ? 'high' : exam.stats.score >= 60 ? 'mid' : 'low'}`}>{exam.stats.score}%</span>
                    {exam.stats.wrong > 0 && <span className="cv-home-score-sub">{exam.stats.wrong}题错</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {welcomeTab === 'wrong' && (
            <div className="cv-home-wrong">
              <button className="cv-home-entry-link" onClick={() => onTabChange?.('all-wrongbook')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                我的错题库
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              {(() => {
                const allWrong = getWrongQuestions();
                if (allWrong.length === 0) return <div className="cv-home-empty">暂无错题记录</div>;
                const grouped = {};
                allWrong.forEach(q => {
                  const key = q.subject || q.topic || '未分类';
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(q);
                });
                return Object.entries(grouped).map(([subject, questions]) => (
                  <div key={subject} className="cv-home-wrong-group">
                    <div className="cv-home-wrong-header">
                      <span className="cv-home-wrong-subject">{subject}</span>
                      <span className="cv-home-wrong-count">{questions.length}题</span>
                    </div>
                    {questions.slice(0, 5).map((q, i) => (
                      <div key={i} className="cv-home-wrong-item">
                        <span className="cv-home-wrong-num">{q.number || i + 1}</span>
                        <div className="cv-home-wrong-content">
                          <span className="cv-home-wrong-text">{q.content}</span>
                          <span className="cv-home-wrong-answer">你的答案: {q.userAnswer} → 正确: {q.correctAnswer}</span>
                        </div>
                        <span className="cv-home-wrong-topic">{q.topic}</span>
                      </div>
                    ))}
                    {questions.length > 5 && (
                      <div className="cv-home-wrong-more">还有 {questions.length - 5} 题...</div>
                    )}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleExportNotes = () => {
    const subject = examNotes[0]?.subject || '综合';
    const paper = {
      id: `notes_${Date.now()}`,
      title: `${currentExamTitle || subject} - 知识点笔记`,
      subject,
      type: 'notes',
      questions: examNotes.map((n, i) => ({
        number: i + 1,
        question: n.topic,
        answer: n.content,
        topic: n.topic,
      })),
      date: new Date().toLocaleDateString('zh-CN'),
      _from: 'chat',
    };
    savePracticePaper(paper);
    onSavePaper?.(paper);
  };

  const handleExportWrong = () => {
    const subject = examWrong[0]?.subject || '综合';
    const paper = {
      id: `wrong_${Date.now()}`,
      title: `${currentExamTitle || subject} - 错题集`,
      subject,
      questions: examWrong.map((q, i) => ({
        number: i + 1,
        question: q.content,
        options: q.options || null,
        answer: q.correctAnswer,
        explanation: `错误答案：${q.userAnswer}，正确答案：${q.correctAnswer}`,
        topic: q.topic,
      })),
      date: new Date().toLocaleDateString('zh-CN'),
      _from: 'chat',
    };
    savePracticePaper(paper);
    onSavePaper?.(paper);
  };

  const handleNotesPractice = async () => {
    setNotesPracticeLoading(true);
    setNotesPracticeAnswers({});
    setNotesMode('practice');
    try {
      const topics = examNotes.map(n => n.topic).join('、');
      const subject = examNotes[0]?.subject || '综合';
      const seed = Math.random().toString(36).slice(2, 6);
      const systemPrompt = `K12出题专家。严格根据指定学科和知识点出5道选择题。题目内容必须属于指定学科。JSON数组：[{"question":"题目","options":["A. xxx","B. xxx","C. xxx","D. xxx"],"answer":"正确选项字母","explanation":"解析","topic":"知识点"}]。只返回JSON。`;
      const content = await callZhipuAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `学科：${subject}（必须是${subject}学科的题目）\n知识点：${topics}\n(#${seed})` },
      ]);
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) parsed = [parsed];
      setNotesPracticeQuestions(parsed);
    } catch {
      setNotesPracticeQuestions([]);
    } finally {
      setNotesPracticeLoading(false);
    }
  };

  const renderExamNotes = () => {
    if (examNotes.length === 0) {
      return <div className="cv-scoped-empty">该试卷暂无知识点笔记</div>;
    }

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    if (notesMode === 'practice') {
      if (notesPracticeLoading) {
        return (
          <div className="cv-wrong-quiz-wrap">
            <div className="cv-wrong-quiz-header">
              <button className="cv-wrong-quiz-back" onClick={() => setNotesMode('list')}>←</button>
              <span className="cv-wrong-quiz-title">笔记练习</span>
            </div>
            <div className="cv-wrong-quiz-loading">正在根据笔记生成练习题...</div>
          </div>
        );
      }

      const questions = notesPracticeQuestions || [];
      if (questions.length === 0) {
        return (
          <div className="cv-wrong-quiz-wrap">
            <div className="cv-wrong-quiz-header">
              <button className="cv-wrong-quiz-back" onClick={() => setNotesMode('list')}>←</button>
              <span className="cv-wrong-quiz-title">笔记练习</span>
            </div>
            <div className="cv-wrong-quiz-loading">生成失败，请返回重试</div>
          </div>
        );
      }

      const answeredCount = Object.keys(notesPracticeAnswers).length;
      const correctCount = Object.entries(notesPracticeAnswers).filter(([i, ans]) => ans === questions[i]?.answer).length;
      const allDone = answeredCount === questions.length;

      return (
        <div className="cv-wrong-quiz-wrap">
          <div className="cv-wrong-quiz-header">
            <button className="cv-wrong-quiz-back" onClick={() => setNotesMode('list')}>←</button>
            <span className="cv-wrong-quiz-title">笔记练习</span>
            <span className="cv-wrong-quiz-progress">{answeredCount}/{questions.length}</span>
          </div>
          <div className="cv-wrong-quiz-list">
            {questions.map((q, qIdx) => {
              const answered = notesPracticeAnswers[qIdx] !== undefined;
              const userAns = notesPracticeAnswers[qIdx];
              return (
                <div key={qIdx} className="nb-practice-card">
                  <div className="nb-practice-q-header">
                    <span className="nb-practice-q-num">{qIdx + 1}</span>
                    {q.topic && <span className="nb-practice-q-topic">{q.topic}</span>}
                  </div>
                  <p className="nb-practice-q-text">{q.question}</p>
                  {q.options && q.options.length > 0 && (
                    <div className="nb-practice-options">
                      {q.options.slice(0, 4).map((opt, oIdx) => {
                        const letter = letters[oIdx];
                        const optText = opt.replace(/^[A-F][.、]\s*/, '');
                        let cls = 'nb-practice-opt';
                        if (answered) {
                          if (letter === q.answer) cls += ' nb-opt-correct';
                          else if (letter === userAns && letter !== q.answer) cls += ' nb-opt-wrong';
                          else cls += ' nb-opt-dimmed';
                        }
                        return (
                          <button key={oIdx} className={cls} disabled={answered} onClick={() => {
                            if (!answered) setNotesPracticeAnswers(prev => ({ ...prev, [qIdx]: letter }));
                          }}>
                            <span className="nb-opt-letter">{letter}</span>
                            <span className="nb-opt-text">{optText}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {answered && q.explanation && (
                    <div className="nb-practice-explanation">
                      <span className="nb-practice-exp-label">解析：</span>{q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {allDone && (
            <div className="nb-practice-bottom">
              <div className="nb-practice-result-text">
                完成！正确 {correctCount}/{questions.length} 题
              </div>
              <div className="nb-practice-result-actions">
                <button className="nb-practice-save-btn" onClick={handleNotesPractice}>
                  再来一组
                </button>
                <button className="nb-practice-again-btn" onClick={() => setNotesMode('list')}>
                  返回笔记
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="cv-scoped-list">
        {examNotes.map((note, i) => (
          <div key={i} className="cv-scoped-card">
            <div className="cv-scoped-card-top">
              <span className="cv-scoped-icon">💡</span>
              <span className="cv-scoped-topic">{note.topic}</span>
              <span className="cv-scoped-subject">{note.subject}</span>
            </div>
            <p className="cv-scoped-content">{note.content}</p>
          </div>
        ))}
        <div className="cv-scoped-export">
          <button className="cv-scoped-export-btn cv-scoped-export-primary" onClick={handleNotesPractice}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            根据笔记生成练习
          </button>
          <button className="cv-scoped-export-btn" onClick={handleExportNotes}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            导出笔记
          </button>
        </div>
      </div>
    );
  };

  const handleStartRedo = () => {
    setWrongRedoAnswers({});
    setWrongMode('redo');
  };

  const handleStartQuiz = async () => {
    setWrongQuizLoading(true);
    setWrongQuizAnswers({});
    setWrongMode('quiz');
    try {
      const questions = await generateReviewQuiz(examWrong, 5);
      setWrongQuizQuestions(questions);
    } catch {
      setWrongQuizQuestions([]);
    } finally {
      setWrongQuizLoading(false);
    }
  };

  const renderExamWrong = () => {
    if (examWrong.length === 0) {
      return <div className="cv-scoped-empty">该试卷暂无错题</div>;
    }

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    if (wrongMode === 'redo') {
      const answeredCount = Object.keys(wrongRedoAnswers).length;
      const correctCount = Object.entries(wrongRedoAnswers).filter(([i, ans]) => ans === examWrong[i]?.correctAnswer).length;
      const allDone = answeredCount === examWrong.length;

      return (
        <div className="cv-wrong-quiz-wrap">
          <div className="cv-wrong-quiz-header">
            <button className="cv-wrong-quiz-back" onClick={() => setWrongMode('list')}>←</button>
            <span className="cv-wrong-quiz-title">全部重做</span>
            <span className="cv-wrong-quiz-progress">{answeredCount}/{examWrong.length}</span>
          </div>
          <div className="cv-wrong-quiz-list">
            {examWrong.map((q, qIdx) => {
              const answered = wrongRedoAnswers[qIdx] !== undefined;
              const userAns = wrongRedoAnswers[qIdx];
              const options = q.options || [`A. ${q.correctAnswer}`, 'B. ', 'C. ', 'D. '];
              return (
                <div key={qIdx} className="nb-practice-card">
                  <div className="nb-practice-q-header">
                    <span className="nb-practice-q-num">{qIdx + 1}</span>
                    {q.topic && <span className="nb-practice-q-topic">{q.topic}</span>}
                  </div>
                  <p className="nb-practice-q-text">{q.content}</p>
                  {options.length >= 2 && (
                    <div className="nb-practice-options">
                      {options.slice(0, 4).map((opt, oIdx) => {
                        const letter = letters[oIdx];
                        const optText = opt.replace(/^[A-F][.、]\s*/, '');
                        let cls = 'nb-practice-opt';
                        if (answered) {
                          if (letter === q.correctAnswer) cls += ' nb-opt-correct';
                          else if (letter === userAns && letter !== q.correctAnswer) cls += ' nb-opt-wrong';
                          else cls += ' nb-opt-dimmed';
                        }
                        return (
                          <button key={oIdx} className={cls} disabled={answered} onClick={() => {
                            if (!answered) setWrongRedoAnswers(prev => ({ ...prev, [qIdx]: letter }));
                          }}>
                            <span className="nb-opt-letter">{letter}</span>
                            <span className="nb-opt-text">{optText}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {answered && (
                    <div className="nb-practice-explanation">
                      <span className="nb-practice-exp-label">{userAns === q.correctAnswer ? '正确！' : `错误，正确答案：${q.correctAnswer}`}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {allDone && (
            <div className="nb-practice-bottom">
              <div className="nb-practice-result-text">
                完成！正确 {correctCount}/{examWrong.length} 题
              </div>
              <div className="nb-practice-result-actions">
                <button className="nb-practice-save-btn" onClick={() => { setWrongRedoAnswers({}); }}>
                  再做一次
                </button>
                <button className="nb-practice-again-btn" onClick={() => setWrongMode('list')}>
                  返回列表
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (wrongMode === 'quiz') {
      if (wrongQuizLoading) {
        return (
          <div className="cv-wrong-quiz-wrap">
            <div className="cv-wrong-quiz-header">
              <button className="cv-wrong-quiz-back" onClick={() => setWrongMode('list')}>←</button>
              <span className="cv-wrong-quiz-title">复习测验</span>
            </div>
            <div className="cv-wrong-quiz-loading">正在生成测验题...</div>
          </div>
        );
      }

      const questions = wrongQuizQuestions || [];
      if (questions.length === 0) {
        return (
          <div className="cv-wrong-quiz-wrap">
            <div className="cv-wrong-quiz-header">
              <button className="cv-wrong-quiz-back" onClick={() => setWrongMode('list')}>←</button>
              <span className="cv-wrong-quiz-title">复习测验</span>
            </div>
            <div className="cv-wrong-quiz-loading">生成失败，请返回重试</div>
          </div>
        );
      }

      const answeredCount = Object.keys(wrongQuizAnswers).length;
      const correctCount = Object.entries(wrongQuizAnswers).filter(([i, ans]) => ans === questions[i]?.answer).length;
      const allDone = answeredCount === questions.length;

      return (
        <div className="cv-wrong-quiz-wrap">
          <div className="cv-wrong-quiz-header">
            <button className="cv-wrong-quiz-back" onClick={() => setWrongMode('list')}>←</button>
            <span className="cv-wrong-quiz-title">复习测验</span>
            <span className="cv-wrong-quiz-progress">{answeredCount}/{questions.length}</span>
          </div>
          <div className="cv-wrong-quiz-list">
            {questions.map((q, qIdx) => {
              const answered = wrongQuizAnswers[qIdx] !== undefined;
              const userAns = wrongQuizAnswers[qIdx];
              return (
                <div key={qIdx} className="nb-practice-card">
                  <div className="nb-practice-q-header">
                    <span className="nb-practice-q-num">{qIdx + 1}</span>
                    {q.topic && <span className="nb-practice-q-topic">{q.topic}</span>}
                  </div>
                  <p className="nb-practice-q-text">{q.question}</p>
                  {q.options && q.options.length > 0 && (
                    <div className="nb-practice-options">
                      {q.options.slice(0, 4).map((opt, oIdx) => {
                        const letter = letters[oIdx];
                        const optText = opt.replace(/^[A-F][.、]\s*/, '');
                        let cls = 'nb-practice-opt';
                        if (answered) {
                          if (letter === q.answer) cls += ' nb-opt-correct';
                          else if (letter === userAns && letter !== q.answer) cls += ' nb-opt-wrong';
                          else cls += ' nb-opt-dimmed';
                        }
                        return (
                          <button key={oIdx} className={cls} disabled={answered} onClick={() => {
                            if (!answered) setWrongQuizAnswers(prev => ({ ...prev, [qIdx]: letter }));
                          }}>
                            <span className="nb-opt-letter">{letter}</span>
                            <span className="nb-opt-text">{optText}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {answered && q.explanation && (
                    <div className="nb-practice-explanation">
                      <span className="nb-practice-exp-label">解析：</span>{q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {allDone && (
            <div className="nb-practice-bottom">
              <div className="nb-practice-result-text">
                完成！正确 {correctCount}/{questions.length} 题
              </div>
              <div className="nb-practice-result-actions">
                <button className="nb-practice-save-btn" onClick={handleStartQuiz}>
                  再来一组
                </button>
                <button className="nb-practice-again-btn" onClick={() => setWrongMode('list')}>
                  返回列表
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="cv-scoped-list cv-wrong-list">
        {examWrong.map((q, i) => (
          <div key={i} className="cv-wrong-card">
            <div className="cv-wrong-card-header">
              <span className="cv-wrong-card-subject">{q.subject || '综合'}</span>
              <span className="cv-wrong-card-topic">{q.topic}</span>
            </div>
            <p className="cv-wrong-card-content">{q.content}</p>
            <div className="cv-wrong-card-answers">
              <div className="cv-wrong-card-ans wrong">
                <span className="cv-wrong-card-ans-label">错误答案</span>
                <span className="cv-wrong-card-ans-val">{q.userAnswer}</span>
              </div>
              <div className="cv-wrong-card-ans correct">
                <span className="cv-wrong-card-ans-label">正确答案</span>
                <span className="cv-wrong-card-ans-val">{q.correctAnswer}</span>
              </div>
            </div>
            <div className="cv-wrong-card-actions">
              <button className="cv-wrong-action-btn primary" onClick={() => {
                setActiveTab('chat');
                engine.handleUserAction('start_teach');
              }}>讲解</button>
              <button className="cv-wrong-action-btn" onClick={() => {
                setActiveTab('chat');
                engine.handleUserAction('skip_to_practice');
              }}>举一反三</button>
            </div>
          </div>
        ))}
        <div className="cv-wrong-bottom-actions">
          <button className="cv-wrong-primary-btn" onClick={handleStartRedo}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            全部重做 ({examWrong.length}题)
          </button>
          <div className="cv-wrong-secondary-row">
            <button className="cv-wrong-secondary-btn" onClick={handleStartQuiz}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              复习测验
            </button>
            <button className="cv-wrong-secondary-btn" onClick={handleExportWrong}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              导出错题
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderExamReport = () => {
    const result = cachedResult || (currentExamId ? getExamResult(currentExamId) : null);
    if (!result) {
      return <div className="cv-scoped-empty">该试卷暂无报告</div>;
    }
    const questions = result.questions || [];
    const total = questions.length;
    const correct = questions.filter(q => q.correct).length;
    const wrong = total - correct;
    const score = total > 0 ? Math.round(correct / total * 100) : 0;
    const topicMap = {};
    questions.filter(q => !q.correct).forEach(q => {
      const t = q.topic || '未分类';
      topicMap[t] = (topicMap[t] || 0) + 1;
    });
    const weakTopics = Object.entries(topicMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
      <div className="cv-scoped-list cv-report">
        <div className="cv-report-score">
          <div className="cv-report-score-num">{score}%</div>
          <div className="cv-report-score-detail">
            <span>总题数 {total}</span>
            <span className="cv-report-correct">正确 {correct}</span>
            <span className="cv-report-wrong">错误 {wrong}</span>
          </div>
        </div>
        {weakTopics.length > 0 && (
          <div className="cv-report-section">
            <div className="cv-report-section-title">薄弱知识点</div>
            {weakTopics.map(([topic, count]) => (
              <div key={topic} className="cv-report-topic-row">
                <span className="cv-report-topic-name">{topic}</span>
                <span className="cv-report-topic-count">{count}题错</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const activeActionIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'ai_action') {
        const hasResponse = messages.slice(i + 1).some(m =>
          m.type !== 'ai_action' && m.type !== 'ai_input_needed'
        );
        return hasResponse ? -1 : i;
      }
    }
    return -1;
  }, [messages]);

  const renderMessage = (msg, idx) => {
    switch (msg.type) {
      case 'ai_text':
        return <MessageBubble key={idx} content={msg.content} role="ai" loading={msg.loading} />;
      case 'user_text':
        return <MessageBubble key={idx} content={msg.content} role="user" />;
      case 'ai_summary':
        return <SummaryCard key={idx} data={msg.data} />;
      case 'ai_teach_intro':
        return <QuestionCard key={idx} question={msg.question} label={msg.content} />;
      case 'ai_explanation':
        return <ExplanationCard key={idx} question={msg.question} explanation={msg.explanation} steps={msg.steps} keyPoint={msg.keyPoint} />;
      case 'ai_practice': {
        const hasFollowingFeedback = messages.slice(idx + 1).some(m => m.type === 'ai_feedback');
        return <PracticeCard key={idx} question={msg.question} onAnswer={handlePracticeAnswer} answered={hasFollowingFeedback} />;
      }
      case 'ai_feedback':
        return (
          <div key={idx} className={`cv-feedback ${msg.correct ? 'correct' : 'wrong'}`}>
            <span className="cv-feedback-icon">{msg.correct ? '✅' : '❌'}</span>
            <span className="cv-feedback-text">{msg.content}</span>
          </div>
        );
      case 'ai_wrap_up':
        return <ProgressCard key={idx} data={msg.data} />;
      case 'ai_action':
        if (idx === activeActionIndex) {
          return <ActionButtons key={idx} actions={msg.actions} onAction={handleAction} />;
        }
        return <ActionButtons key={idx} actions={msg.actions} onAction={() => {}} disabled />;
      case 'ai_error':
        return (
          <div key={idx} className="cv-error">
            <span>⚠️ {msg.content}</span>
            <button className="cv-retry-btn" onClick={handleStart}>重试</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="cv-page">
      <div className="cv-header">
        {isStarted ? (
          <button className="cv-back-btn" onClick={handleBackToWelcome}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        ) : (
          <button className="cv-back-btn" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        <div className="cv-header-title">{isStarted && currentExamTitle ? currentExamTitle : '试卷智能助手'}</div>
        <button className="cv-header-lib" onClick={() => onManageExams?.()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
        </button>
      </div>

      <div className="cv-messages" ref={scrollRef}>
        {!isStarted ? renderWelcome() : (
          <>
            {activeTab === 'chat' && (
              <>
                {currentExamThumb && (
                  <div className="cv-doc-viewer">
                    <img className="cv-doc-viewer-img" src={currentExamThumb} alt="试卷" />
                  </div>
                )}
                {examWrong.length > 0 && (
                  <div className="cv-wrong-preview">
                    <div className="cv-wrong-preview-header">
                      <span className="cv-wrong-preview-title">错题一览（{examWrong.length}题）</span>
                      <span className="cv-wrong-preview-hint">左滑查看 →</span>
                    </div>
                    <div className="cv-wrong-preview-scroll">
                      {examWrong.map((q, i) => (
                        <div key={i} className="cv-wrong-preview-card" onClick={() => {
                          setActiveTab('chat');
                          engine.handleUserAction('start_teach');
                        }}>
                          <div className="cv-wrong-preview-card-top">
                            <span className="cv-wrong-preview-num">第{q.number || i+1}题</span>
                            {q.topic && <span className="cv-wrong-preview-topic">{q.topic}</span>}
                          </div>
                          <p className="cv-wrong-preview-content">{q.content || q.question}</p>
                          <div className="cv-wrong-preview-answers">
                            <span className="cv-wrong-preview-ans wrong">✗ {q.userAnswer || '—'}</span>
                            <span className="cv-wrong-preview-ans correct">✓ {q.correctAnswer || '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map(renderMessage)}
              </>
            )}
            {activeTab === 'wrongbook' && renderExamWrong()}
          </>
        )}
      </div>

      {showInput && activeTab === 'chat' && (
        <InputBar placeholder={inputPlaceholder} onSend={handleSendMessage} />
      )}

      {isStarted && (
        <div className="cv-bottom-tabs">
          <button className={`cv-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span>对话</span>
          </button>
          <button className={`cv-tab ${activeTab === 'wrongbook' ? 'active' : ''}`} onClick={() => setActiveTab('wrongbook')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            <span>错题</span>
          </button>
        </div>
      )}
    </div>
  );
}
