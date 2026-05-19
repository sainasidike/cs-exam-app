import { useState, useEffect } from 'react';
import { getExamLibrary, deleteExamFromLibrary, getExamResult } from '../services/storageService.js';

const DEMO_LIBRARY = [
  { id: 'lib_1', title: '七年级数学期末', subject: '数学', date: '2026-01-05', pages: 2, status: 'graded', score: 82, totalQuestions: 15, correctCount: 12 },
  { id: 'lib_2', title: '单元测试3', subject: '数学', date: '2026-03-12', pages: 2, status: 'graded', score: 91, totalQuestions: 10, correctCount: 9 },
  { id: 'lib_3', title: '八年级英语期中', subject: '英语', date: '2026-04-15', pages: 3, status: 'graded', score: 76, totalQuestions: 20, correctCount: 15 },
  { id: 'lib_4', title: '数学周考', subject: '数学', date: '2026-04-08', pages: 1, status: 'saved' },
  { id: 'lib_5', title: '语文阅读理解', subject: '语文', date: '2026-03-20', pages: 2, status: 'graded', score: 88, totalQuestions: 8, correctCount: 7 },
  { id: 'lib_6', title: '物理力学测试', subject: '物理', date: '2026-02-28', pages: 2, status: 'graded', score: 70, totalQuestions: 12, correctCount: 8 },
];

export default function ExamLibrary({ onBack, onOpenExam }) {
  const [library, setLibrary] = useState([]);
  const [activeSubject, setActiveSubject] = useState('全部');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const saved = getExamLibrary();
    setLibrary(saved.length > 0 ? saved : DEMO_LIBRARY);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const subjects = ['全部', ...new Set(library.map(r => r.subject || '未分类'))];
  const filtered = activeSubject === '全部' ? library : library.filter(r => r.subject === activeSubject);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const updated = deleteExamFromLibrary(id);
    setLibrary(updated.length > 0 ? updated : DEMO_LIBRARY);
    showToast('已删除');
  };

  const handleItemClick = (exam) => {
    const result = getExamResult(exam.id);
    if (onOpenExam) {
      onOpenExam(exam, result);
    }
  };

  return (
    <div className="el-page">
      {toast && <div className="cs-toast">{toast}</div>}
      <div className="el-header">
        <button className="el-back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="el-header-title">我的试卷库</div>
        <div className="el-header-count">{library.length}份</div>
      </div>

      <div className="el-tabs">
        {subjects.map(s => (
          <button key={s} className={`el-tab ${s === activeSubject ? 'active' : ''}`} onClick={() => setActiveSubject(s)}>
            {s}
            {s !== '全部' && <span className="el-tab-count">{library.filter(r => r.subject === s).length}</span>}
          </button>
        ))}
      </div>

      <div className="el-list">
        {filtered.length > 0 ? filtered.map(exam => (
          <div key={exam.id} className="el-item" onClick={() => handleItemClick(exam)}>
            <div className="el-item-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={exam.status === 'graded' ? '#4CAF50' : '#999'} strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                {exam.status === 'graded' && <path d="M9 15l2 2 4-4" strokeWidth="2"/>}
              </svg>
            </div>
            <div className="el-item-info">
              <span className="el-item-title">{exam.title}</span>
              <span className="el-item-meta">
                {exam.date} · {exam.pages}页 · {exam.status === 'graded' ? '已批改' : '仅收藏'}
              </span>
            </div>
            {exam.status === 'graded' && (
              <div className={`el-item-score ${exam.score >= 80 ? 'good' : exam.score >= 60 ? 'ok' : 'bad'}`}>
                {exam.score}分
              </div>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" style={{flexShrink:0, marginLeft:4}}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )) : (
          <div className="el-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>还没有试卷</p>
            <p className="el-empty-hint">拍照批改试卷后会自动保存到这里</p>
          </div>
        )}
      </div>
    </div>
  );
}
