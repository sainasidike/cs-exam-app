import { useState } from 'react';

export default function SummaryCard({ data }) {
  const { total, correct, wrong, scorePercent, allTopics, wrongQuestions = [] } = data;
  const [wrongIdx, setWrongIdx] = useState(0);

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
      {allTopics && allTopics.length > 0 && (
        <div className="cv-summary-topics-inline">
          <span className="cv-topics-label-inline">考点覆盖：</span>
          <span className="cv-topics-text-inline">
            {allTopics.length > 5 ? allTopics.slice(0, 5).join('、') + '等' : allTopics.join('、')}
          </span>
        </div>
      )}

      {wrongQuestions.length > 0 && (() => {
        const q = wrongQuestions[wrongIdx];
        return (
          <div className="cv-summary-wrong-carousel">
            <div className="cv-summary-wrong-nav">
              <span className="cv-summary-wrong-indicator">错题 {wrongIdx + 1}/{wrongQuestions.length}</span>
              <div className="cv-summary-wrong-btns">
                <button
                  className="cv-summary-wrong-btn"
                  disabled={wrongIdx === 0}
                  onClick={() => setWrongIdx(wrongIdx - 1)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button
                  className="cv-summary-wrong-btn"
                  disabled={wrongIdx === wrongQuestions.length - 1}
                  onClick={() => setWrongIdx(wrongIdx + 1)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
            <div className="cv-summary-wrong-item">
              <div className="cv-summary-wrong-top">
                <span className="cv-summary-wrong-num">第{q.number || wrongIdx + 1}题</span>
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
          </div>
        );
      })()}
    </div>
  );
}
