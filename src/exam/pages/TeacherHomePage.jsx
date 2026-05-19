import { useState, useEffect } from 'react';
import { getClasses, getExams } from '../services/teacherService.js';

export default function TeacherHomePage({ onBack, onBatchGrade, onClassManage, onReport, onQuizGen, onExport }) {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    setClasses(getClasses());
    setExams(getExams());
  }, []);

  const recentExams = exams.slice(0, 5);

  return (
    <div className="teacher-page">
      <div className="teacher-header">
        <button className="teacher-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="teacher-header-title">教师工作台</h1>
        <div style={{width: 20}} />
      </div>

      <div className="teacher-grid">
        <div className="teacher-grid-item" onClick={onBatchGrade}>
          <div className="teacher-grid-icon" style={{background: '#E8F5E9'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          </div>
          <span>批量批改</span>
        </div>
        <div className="teacher-grid-item" onClick={onReport}>
          <div className="teacher-grid-icon" style={{background: '#E3F2FD'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          </div>
          <span>成绩看板</span>
        </div>
        <div className="teacher-grid-item" onClick={onQuizGen}>
          <div className="teacher-grid-icon" style={{background: '#FFF3E0'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <span>智能组卷</span>
        </div>
        <div className="teacher-grid-item" onClick={onClassManage}>
          <div className="teacher-grid-icon" style={{background: '#F3E5F5'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <span>班级管理</span>
        </div>
      </div>

      <div className="teacher-section">
        <div className="teacher-section-header">
          <span className="teacher-section-title">最近批改</span>
          {exams.length > 5 && <span className="teacher-section-more" onClick={onReport}>查看全部</span>}
        </div>

        {recentExams.length === 0 ? (
          <div className="teacher-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>暂无批改记录</p>
            <p className="teacher-empty-hint">点击"批量批改"开始</p>
          </div>
        ) : (
          <div className="teacher-exam-list">
            {recentExams.map(exam => {
              const gradedCount = exam.papers?.filter(p => p.status === 'graded').length || 0;
              const totalCount = exam.papers?.length || 0;
              const avg = exam.stats?.avg || '--';
              return (
                <div key={exam.id} className="teacher-exam-row" onClick={() => onReport && onReport(exam.id)}>
                  <div className="teacher-exam-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="teacher-exam-info">
                    <span className="teacher-exam-title">{exam.title}</span>
                    <span className="teacher-exam-meta">{gradedCount}/{totalCount}人已批 · 平均{avg}分</span>
                  </div>
                  <span className="teacher-exam-date">{new Date(exam.date).toLocaleDateString('zh-CN')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
