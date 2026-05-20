import { useState, useEffect } from 'react';
import { getNotebook, deleteNote, getNotebookStats } from '../services/notebookService.js';
import { generateFromNotebook } from '../services/practiceScheduler.js';
import { savePracticePaper } from '../services/storageService.js';

export default function NotebookView({ onBack, onPractice, onSavePaper, onTabChange }) {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('全部');
  const [generating, setGenerating] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState(null);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceMessage, setPracticeMessage] = useState('');

  useEffect(() => {
    setNotes(getNotebook());
  }, []);

  const subjects = ['全部', ...new Set(notes.map(n => n.subject || '其他'))];
  const filtered = filter === '全部' ? notes : notes.filter(n => (n.subject || '其他') === filter);
  const stats = getNotebookStats();

  const handleDelete = (id) => {
    const updated = deleteNote(id);
    setNotes(updated);
  };

  const handleGenPractice = async () => {
    setGenerating(true);
    try {
      const targetNotes = filtered.length > 0 ? filtered : notes;
      const noteIds = targetNotes.slice(0, 5).map(n => n.id);
      const result = await generateFromNotebook(noteIds, 5);
      if (result.questions && result.questions.length > 0) {
        setPracticeQuestions(result.questions);
        setPracticeMessage(result.message);
        setPracticeAnswers({});
      } else {
        onPractice?.(result);
      }
    } catch {
    } finally {
      setGenerating(false);
    }
  };

  const handlePracticeSelect = (qIndex, letter) => {
    if (practiceAnswers[qIndex] !== undefined) return;
    setPracticeAnswers(prev => ({ ...prev, [qIndex]: letter }));
  };

  const handleSavePaper = () => {
    if (!practiceQuestions || practiceQuestions.length === 0) return;
    const topics = [...new Set(practiceQuestions.map(q => q.topic).filter(Boolean))];
    const subject = practiceQuestions[0]?.subject || topics[0] || '综合';
    const paper = {
      id: `practice_${Date.now()}`,
      title: `笔记练习 - ${topics.slice(0, 2).join('、') || subject}`,
      subject,
      questions: practiceQuestions,
      date: new Date().toLocaleDateString('zh-CN'),
      _from: 'notebook',
    };
    savePracticePaper(paper);
    onSavePaper?.(paper);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'formula': return '📐';
      case 'word': return '📝';
      case 'rule': return '📏';
      case 'method': return '🔧';
      default: return '💡';
    }
  };


  if (practiceQuestions) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const answeredCount = Object.keys(practiceAnswers).length;
    const correctTotal = Object.entries(practiceAnswers).filter(([i, ans]) => ans === practiceQuestions[i]?.answer).length;

    return (
      <div className="nb-page">
        <div className="nb-header">
          <button className="nb-back-btn" onClick={() => setPracticeQuestions(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="nb-header-title">笔记练习</div>
          <div className="nb-header-stats">{answeredCount}/{practiceQuestions.length}</div>
        </div>

        {practiceMessage && <div className="nb-practice-msg">{practiceMessage}</div>}

        <div className="nb-practice-list">
          {practiceQuestions.map((q, qIdx) => {
            const answered = practiceAnswers[qIdx] !== undefined;
            const userAns = practiceAnswers[qIdx];
            return (
              <div key={qIdx} className="nb-practice-card">
                <div className="nb-practice-q-header">
                  <span className="nb-practice-q-num">{qIdx + 1}</span>
                  {q.topic && <span className="nb-practice-q-topic">{q.topic}</span>}
                </div>
                <p className="nb-practice-q-text">{q.question}</p>
                {q.options && q.options.length > 0 && (
                  <div className="nb-practice-options">
                    {q.options.map((opt, oIdx) => {
                      const letter = letters[oIdx];
                      const optText = opt.replace(/^[A-F][.、]\s*/, '');
                      let cls = 'nb-practice-opt';
                      if (answered) {
                        if (letter === q.answer) cls += ' nb-opt-correct';
                        else if (letter === userAns && letter !== q.answer) cls += ' nb-opt-wrong';
                        else cls += ' nb-opt-dimmed';
                      }
                      return (
                        <button key={oIdx} className={cls} onClick={() => handlePracticeSelect(qIdx, letter)} disabled={answered}>
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

        <div className="nb-practice-bottom">
          <div className="nb-practice-result-actions">
            <button className="nb-practice-save-btn" onClick={handleSavePaper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              保存为试卷
            </button>
            <button className="nb-practice-again-btn" onClick={handleGenPractice} disabled={generating}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
              {generating ? '生成中...' : '重新生成'}
            </button>
          </div>
          {answeredCount === practiceQuestions.length && (
            <div className="nb-practice-result-text">
              完成！正确 {correctTotal}/{practiceQuestions.length} 题
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="nb-page">
      <div className="nb-header">
        <button className="nb-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="nb-header-title">AI 笔记本</div>
        <div className="nb-header-stats">{stats.total}个知识点</div>
      </div>

      <div className="nb-stats-bar">
        <span className="nb-stat-item">{stats.total} 个知识点</span>
      </div>

      <div className="nb-tabs">
        {subjects.map(s => (
          <button key={s} className={`nb-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s}
            {s !== '全部' && <span className="nb-tab-count">{notes.filter(n => (n.subject || '其他') === s).length}</span>}
          </button>
        ))}
      </div>

      <div className="nb-list">
        {filtered.length === 0 ? (
          <div className="nb-empty">
            <p>暂无笔记</p>
            <p className="nb-empty-hint">扫描试卷后，AI 会自动提取知识点到这里</p>
          </div>
        ) : (
          filtered.map(note => (
            <div key={note.id} className="nb-card">
              <div className="nb-card-top">
                <span className="nb-card-icon">{getTypeIcon(note.type)}</span>
                <span className="nb-card-topic">{note.topic}</span>
                <span className="nb-card-subject">{note.subject}</span>
                <button className="nb-btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <p className="nb-card-content">{note.content}</p>
            </div>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="nb-bottom-actions">
          <button className="nb-practice-btn" onClick={handleGenPractice} disabled={generating}>
            {generating ? '生成中...' : '根据笔记生成练习'}
          </button>
        </div>
      )}

      <div className="cv-bottom-tabs">
        <button className="cv-tab" onClick={() => onTabChange?.('chat')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>对话</span>
        </button>
        <button className="cv-tab active">
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
