export default function QuestionCard({ question, label }) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="cv-card cv-question-card">
      {label && <div className="cv-question-label">{label}</div>}
      <div className="cv-question-meta">
        <span className="cv-q-subject">{question.subject || '数学'}</span>
        {question.topic && <span className="cv-q-topic">{question.topic}</span>}
      </div>
      <p className="cv-question-content">{question.content}</p>

      {question.options && question.options.length > 0 && (
        <div className="cv-question-options">
          {question.options.map((opt, i) => {
            const letter = letters[i];
            const isUser = letter === question.userAnswer;
            const isCorrect = letter === question.correctAnswer;
            let cls = 'cv-q-option';
            if (isCorrect) cls += ' cv-q-correct';
            else if (isUser) cls += ' cv-q-wrong';
            return (
              <div key={i} className={cls}>
                <span className="cv-q-opt-letter">{letter}</span>
                <span className="cv-q-opt-text">{opt}</span>
                {isUser && !isCorrect && <span className="cv-q-opt-mark">✗ 你的答案</span>}
                {isCorrect && <span className="cv-q-opt-mark">✓ 正确答案</span>}
              </div>
            );
          })}
        </div>
      )}

      {!question.options && (
        <div className="cv-question-answer-row">
          <div className="cv-answer-item cv-answer-wrong">
            <span className="cv-answer-label">你的答案</span>
            <span className="cv-answer-val">{question.userAnswer || '未作答'}</span>
          </div>
          <div className="cv-answer-item cv-answer-correct">
            <span className="cv-answer-label">正确答案</span>
            <span className="cv-answer-val">{question.correctAnswer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
