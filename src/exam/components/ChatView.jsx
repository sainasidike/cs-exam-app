import { useState, useEffect, useRef, useMemo } from 'react';
import { createFlowEngine } from '../services/flowEngine.js';
import { CACHED_EXAM_RESULTS, EXAM_DOCUMENTS } from '../cachedExams.js';
import { DEMO_EXAM } from '../demoData.js';
import { getWrongQuestions } from '../services/storageService.js';
import { getNotebookStats } from '../services/notebookService.js';
import { getPracticeRecommendation } from '../services/practiceScheduler.js';
import MessageBubble from './MessageBubble.jsx';
import SummaryCard from './SummaryCard.jsx';
import QuestionCard from './QuestionCard.jsx';
import ExplanationCard from './ExplanationCard.jsx';
import ProgressCard from './ProgressCard.jsx';
import ActionButtons from './ActionButtons.jsx';
import PracticeCard from './PracticeCard.jsx';
import InputBar from './InputBar.jsx';

export default function ChatView({ files, cachedExamId, cachedResult, onBack, onTabChange, autoStart }) {
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [showInput, setShowInput] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const scrollRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  useEffect(() => {
    if (autoStart && !isStarted) {
      handleStart();
    }
  }, [autoStart, isStarted]);

  const handleStart = () => {
    setIsStarted(true);
    setMessages([]);
    engine.start(files, cachedExamId, cachedResult);
  };

  const handleDemo = () => {
    setIsStarted(true);
    setMessages([]);
    const demoResult = CACHED_EXAM_RESULTS['exam-2'] || DEMO_EXAM;
    engine.start(null, 'exam-2', demoResult);
  };

  const handleAction = (actionId, data) => {
    engine.handleUserAction(actionId, data);
  };

  const handleSendMessage = (text) => {
    setShowInput(false);
    engine.handleUserMessage(text);
  };

  const handlePracticeAnswer = (question, selected) => {
    const correct = selected === question.answer;
    engine.handleUserAction('practice_answer', { selected, correct, question });
  };

  const docInfo = useMemo(() => {
    if (cachedExamId) {
      const doc = EXAM_DOCUMENTS.find(d => d.id === cachedExamId);
      if (doc) return { title: doc.title, subject: doc.subject, pages: doc.pages, thumb: doc.thumb };
    }
    if (files && files.length > 0) {
      return { title: '试卷', subject: '', pages: files.length, thumb: typeof files[0] === 'string' ? files[0] : null };
    }
    return null;
  }, [cachedExamId, files]);

  const renderWelcome = () => {
    const recommendation = getPracticeRecommendation();
    const wrongCount = getWrongQuestions().length;
    const notebookStats = getNotebookStats();

    return (
      <div className="cv-welcome">
        <div className="cv-welcome-avatar">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5">
            <path d="M12 2a7 7 0 017 7v1a7 7 0 01-14 0V9a7 7 0 017-7z"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <path d="M9 9h.01M15 9h.01"/>
            <path d="M7.5 19L6 22h12l-1.5-3"/>
          </svg>
        </div>
        <h2 className="cv-welcome-title">你好！我是你的 AI 学习助手</h2>
        <p className="cv-welcome-desc">我能帮你批改试卷、讲解错题、生成练习题。</p>

        {recommendation && (
          <div className="cv-recommendation">
            <span className="cv-rec-icon">💡</span>
            <span className="cv-rec-text">{recommendation.reason}</span>
          </div>
        )}

        <div className="cv-welcome-stats">
          {wrongCount > 0 && <span className="cv-stat-chip">📕 {wrongCount}道错题</span>}
          {notebookStats.total > 0 && <span className="cv-stat-chip">📒 {notebookStats.total}个知识点</span>}
          {notebookStats.dueCount > 0 && <span className="cv-stat-chip">🔔 {notebookStats.dueCount}个待复习</span>}
        </div>

        <div className="cv-welcome-actions">
          {(files && files.length > 0) || cachedResult ? (
            <button className="cv-action-primary" onClick={handleStart}>开始分析这份试卷</button>
          ) : (
            <>
              <button className="cv-action-primary" onClick={() => document.getElementById('cs-album-input')?.click()}>
                📷 扫描我的试卷
              </button>
              <button className="cv-action-secondary" onClick={handleDemo}>
                👀 看示例
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderMessage = (msg, idx) => {
    switch (msg.type) {
      case 'ai_text':
        return <MessageBubble key={idx} content={msg.content} role="ai" loading={msg.loading} />;
      case 'user_text':
        return <MessageBubble key={idx} content={msg.content} role="user" />;
      case 'ai_progress':
        return (
          <div key={idx} className="cv-progress-wrap">
            <div className="cv-progress-label">{msg.label}</div>
            <div className="cv-progress-bar">
              <div className="cv-progress-fill" style={{ width: `${msg.progress}%` }}></div>
            </div>
          </div>
        );
      case 'ai_summary':
        return <SummaryCard key={idx} data={msg.data} />;
      case 'ai_teach_intro':
        return <QuestionCard key={idx} question={msg.question} label={msg.content} />;
      case 'ai_explanation':
        return <ExplanationCard key={idx} question={msg.question} explanation={msg.explanation} steps={msg.steps} keyPoint={msg.keyPoint} />;
      case 'ai_practice':
        return <PracticeCard key={idx} question={msg.question} onAnswer={handlePracticeAnswer} />;
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
        return <ActionButtons key={idx} actions={msg.actions} onAction={handleAction} />;
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
        <button className="cv-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="cv-header-title">AI 学习助手</div>
        <div className="cv-header-right">
          {phase !== 'idle' && phase !== 'done' && (
            <span className="cv-phase-badge">{getPhaseLabel(phase)}</span>
          )}
        </div>
      </div>

      {docInfo && isStarted && (
        <div className="cv-doc-bar">
          {docInfo.thumb && <img className="cv-doc-thumb" src={docInfo.thumb} alt="" />}
          <div className="cv-doc-info">
            <span className="cv-doc-title">{docInfo.title}</span>
            <span className="cv-doc-meta">{docInfo.subject} · {docInfo.pages}页</span>
          </div>
        </div>
      )}

      <div className="cv-messages" ref={scrollRef}>
        {!isStarted ? renderWelcome() : messages.map(renderMessage)}
      </div>

      {showInput && (
        <InputBar placeholder={inputPlaceholder} onSend={handleSendMessage} />
      )}

      <div className="cv-bottom-tabs">
        <button className="cv-tab active" onClick={() => onTabChange?.('chat')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>对话</span>
        </button>
        <button className="cv-tab" onClick={() => onTabChange?.('notebook')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
          <span>笔记</span>
        </button>
        <button className="cv-tab" onClick={() => onTabChange?.('wrongbook')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          <span>错题</span>
        </button>
        <button className="cv-tab" onClick={() => onTabChange?.('report')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span>报告</span>
        </button>
      </div>
    </div>
  );
}

function getPhaseLabel(phase) {
  const labels = {
    recognize: '识别中',
    grade: '批改中',
    summarize: '分析中',
    teach: '讲解中',
    practice: '练习中',
    wrap_up: '总结中',
  };
  return labels[phase] || '';
}
