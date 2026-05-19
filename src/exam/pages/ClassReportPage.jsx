import { useState, useEffect } from 'react';
import { getExams, computeStats } from '../services/teacherService.js';
import { generateTeachingSuggestion } from '../services/batchGradeService.js';

export default function ClassReportPage({ onBack, examId, onExport }) {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [suggestion, setSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    const allExams = getExams();
    setExams(allExams);
    if (examId) {
      setSelectedExam(allExams.find(e => e.id === examId) || allExams[0] || null);
    } else {
      setSelectedExam(allExams[0] || null);
    }
  }, [examId]);

  const stats = selectedExam?.stats || (selectedExam?.papers ? computeStats(selectedExam.papers) : null);
  const papers = selectedExam?.papers || [];
  const sortedPapers = [...papers].filter(p => p.score != null).sort((a, b) => b.score - a.score);

  const handleGetSuggestion = async () => {
    if (!stats?.weakTopics?.length) return;
    setLoadingSuggestion(true);
    try {
      const text = await generateTeachingSuggestion(stats.weakTopics);
      setSuggestion(text);
    } catch { setSuggestion('获取建议失败，请重试'); }
    setLoadingSuggestion(false);
  };

  const maxDist = stats ? Math.max(...Object.values(stats.distribution), 1) : 1;

  return (
    <div className="teacher-page">
      <div className="teacher-header">
        <button className="teacher-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="teacher-header-title">成绩看板</h1>
        {onExport && (
          <button className="teacher-add-btn" onClick={() => onExport(selectedExam)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        )}
      </div>

      {exams.length > 1 && (
        <div className="teacher-exam-tabs">
          {exams.slice(0, 5).map(e => (
            <button key={e.id} className={`teacher-exam-tab ${selectedExam?.id === e.id ? 'active' : ''}`}
              onClick={() => { setSelectedExam(e); setSuggestion(''); }}>
              {e.title?.slice(0, 8)}
            </button>
          ))}
        </div>
      )}

      <div className="teacher-content">
        {!stats ? (
          <div className="teacher-empty">
            <p>暂无成绩数据</p>
            <p className="teacher-empty-hint">完成批量批改后可查看成绩报告</p>
          </div>
        ) : (
          <>
            <div className="teacher-stat-row">
              <div className="teacher-stat-card">
                <span className="teacher-stat-value">{stats.avg}</span>
                <span className="teacher-stat-label">平均分</span>
              </div>
              <div className="teacher-stat-card">
                <span className="teacher-stat-value">{stats.max}</span>
                <span className="teacher-stat-label">最高分</span>
              </div>
              <div className="teacher-stat-card">
                <span className="teacher-stat-value">{stats.min}</span>
                <span className="teacher-stat-label">最低分</span>
              </div>
              <div className="teacher-stat-card">
                <span className="teacher-stat-value">{stats.passRate}%</span>
                <span className="teacher-stat-label">及格率</span>
              </div>
            </div>

            <div className="teacher-section">
              <div className="teacher-section-header">
                <span className="teacher-section-title">分数分布</span>
              </div>
              <div className="teacher-chart-bar">
                {Object.entries(stats.distribution).map(([label, count]) => (
                  <div key={label} className="teacher-bar-item">
                    <div className="teacher-bar-fill" style={{height: `${count / maxDist * 100}%`}}>
                      <span className="teacher-bar-count">{count}</span>
                    </div>
                    <span className="teacher-bar-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {stats.weakTopics?.length > 0 && (
              <div className="teacher-section">
                <div className="teacher-section-header">
                  <span className="teacher-section-title">⚠ 薄弱知识点</span>
                </div>
                <div className="teacher-weak-list">
                  {stats.weakTopics.map((t, i) => (
                    <div key={i} className="teacher-weak-item">
                      <span className="teacher-weak-rank">{i + 1}</span>
                      <div className="teacher-weak-info">
                        <span className="teacher-weak-topic">{t.topic}</span>
                        <span className="teacher-weak-meta">错误率 {t.errorRate}% · {t.errorCount}人错误</span>
                      </div>
                      <div className="teacher-weak-bar">
                        <div className="teacher-weak-bar-fill" style={{width: `${t.errorRate}%`}} />
                      </div>
                    </div>
                  ))}
                </div>

                {!suggestion && (
                  <button className="teacher-btn-secondary" onClick={handleGetSuggestion} disabled={loadingSuggestion}>
                    {loadingSuggestion ? '生成中...' : 'AI 教学建议'}
                  </button>
                )}
                {suggestion && (
                  <div className="teacher-suggestion-box">
                    <h4>教学调整建议</h4>
                    <p>{suggestion}</p>
                  </div>
                )}
              </div>
            )}

            <div className="teacher-section">
              <div className="teacher-section-header">
                <span className="teacher-section-title">学生排名</span>
                <span className="teacher-section-more">{stats.totalStudents}人</span>
              </div>
              <div className="teacher-student-list">
                {sortedPapers.map((p, i) => (
                  <div key={p.id} className="teacher-student-row">
                    <span className={`teacher-student-rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
                    <span className="teacher-student-name">{p.studentName}</span>
                    <span className="teacher-student-score">{p.score}分</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
