export default function ExplanationCard({ question, explanation, steps, keyPoint }) {
  return (
    <div className="cv-card cv-explanation-card">
      <div className="cv-exp-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span className="cv-exp-title">解题思路</span>
      </div>

      <p className="cv-exp-text">{explanation}</p>

      {steps && steps.length > 0 && (
        <div className="cv-exp-steps">
          <div className="cv-exp-steps-title">解题步骤</div>
          {steps.map((step, i) => (
            <div key={i} className="cv-exp-step">
              <span className="cv-step-num">{i + 1}</span>
              <span className="cv-step-text">{step}</span>
            </div>
          ))}
        </div>
      )}

      {keyPoint && (
        <div className="cv-exp-keypoint">
          <span className="cv-kp-label">核心知识点</span>
          <span className="cv-kp-value">{keyPoint}</span>
        </div>
      )}
    </div>
  );
}
