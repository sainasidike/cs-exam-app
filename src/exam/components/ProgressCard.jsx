export default function ProgressCard({ data }) {
  const { taught, practiced, correct, wrongCount, notesAdded, weakTopics } = data;
  const accuracy = practiced > 0 ? Math.round(correct / practiced * 100) : 0;

  return (
    <div className="cv-card cv-progress-card">
      <div className="cv-prog-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span className="cv-prog-title">本次学习总结</span>
      </div>

      <div className="cv-prog-grid">
        <div className="cv-prog-item">
          <span className="cv-prog-num">{taught}</span>
          <span className="cv-prog-label">讲解题目</span>
        </div>
        <div className="cv-prog-item">
          <span className="cv-prog-num">{practiced}</span>
          <span className="cv-prog-label">练习题目</span>
        </div>
        <div className="cv-prog-item">
          <span className="cv-prog-num">{accuracy}%</span>
          <span className="cv-prog-label">练习正确率</span>
        </div>
        <div className="cv-prog-item">
          <span className="cv-prog-num">{notesAdded}</span>
          <span className="cv-prog-label">新增知识点</span>
        </div>
      </div>

      {weakTopics && weakTopics.length > 0 && (
        <div className="cv-prog-suggest">
          <span className="cv-prog-suggest-label">💡 建议复习</span>
          <div className="cv-prog-suggest-list">
            {weakTopics.map(t => <span key={t} className="cv-prog-topic-chip">{t}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
