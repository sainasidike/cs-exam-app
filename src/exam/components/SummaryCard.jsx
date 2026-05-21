export default function SummaryCard({ data }) {
  const { total, correct, wrong, scorePercent, weakTopics, allTopics, wrongQuestions = [] } = data;

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

      {wrongQuestions.length > 0 && (
        <div className="cv-summary-wrong-list">
          {wrongQuestions.map((q, i) => (
            <div key={i} className="cv-summary-wrong-item">
              <div className="cv-summary-wrong-top">
                <span className="cv-summary-wrong-num">第{q.number || i + 1}题</span>
                {q.topic && <span className="cv-summary-wrong-topic">{q.topic}</span>}
              </div>
              <p className="cv-summary-wrong-content">{q.content || q.question}</p>
              <div className="cv-summary-wrong-answers">
                <div className="cv-summary-wrong-ans wrong">
                  <span className="cv-summary-wrong-ans-label">你的答案</span>
                  <span className="cv-summary-wrong-ans-val">{q.userAnswer || '—'}</span>
                </div>
                <div className="cv-summary-wrong-ans correct">
                  <span className="cv-summary-wrong-ans-label">正确答案</span>
                  <span className="cv-summary-wrong-ans-val">{q.correctAnswer || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
