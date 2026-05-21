export default function SummaryCard({ data }) {
  const { subject, total, correct, wrong, scorePercent, weakTopics, allTopics, notesAdded, wrongAdded } = data;

  return (
    <div className="cv-card cv-summary-card">
      <div className="cv-summary-header">
        <div className="cv-summary-score">
          <span className="cv-score-num">{scorePercent}%</span>
          <span className="cv-score-label">得分率</span>
        </div>
        <div className="cv-summary-stats">
          <div className="cv-stat-row">
            <span className="cv-stat-label">总题数</span>
            <span className="cv-stat-value">{total}题</span>
          </div>
          <div className="cv-stat-row">
            <span className="cv-stat-label">正确</span>
            <span className="cv-stat-value cv-stat-correct">{correct}题</span>
          </div>
          <div className="cv-stat-row">
            <span className="cv-stat-label">错误</span>
            <span className="cv-stat-value cv-stat-wrong">{wrong}题</span>
          </div>
        </div>
      </div>

      {weakTopics.length > 0 && (
        <div className="cv-summary-weak">
          <span className="cv-weak-label">🔴 薄弱知识点</span>
          <div className="cv-weak-list">
            {weakTopics.map(([topic, count]) => (
              <span key={topic} className="cv-weak-chip">{topic}({count}题)</span>
            ))}
          </div>
        </div>
      )}

      {allTopics && allTopics.length > 0 && (
        <div className="cv-summary-topics">
          <span className="cv-topics-label">考点覆盖</span>
          <span className="cv-topics-text">
            {allTopics.length > 5 ? allTopics.slice(0, 5).join('、') + '等' : allTopics.join('、')}
          </span>
        </div>
      )}

    </div>
  );
}
