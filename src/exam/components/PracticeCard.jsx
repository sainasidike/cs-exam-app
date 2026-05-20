import { useState } from 'react';

export default function PracticeCard({ question, onAnswer, answered }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(answered || false);
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const handleSelect = (letter) => {
    if (revealed) return;
    setSelected(letter);
    setRevealed(true);
    onAnswer(question, letter);
  };

  return (
    <div className="cv-card cv-practice-card">
      <div className="cv-prac-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span className="cv-prac-label">练习</span>
        {question.topic && <span className="cv-prac-topic">{question.topic}</span>}
      </div>

      <p className="cv-prac-question">{question.question}</p>

      {question.options && question.options.length > 0 ? (
        <div className="cv-prac-options">
          {question.options.map((opt, i) => {
            const letter = letters[i];
            const optText = opt.replace(/^[A-F][.、]\s*/, '');
            let cls = 'cv-prac-option';
            if (revealed) {
              if (letter === question.answer) cls += ' cv-prac-correct';
              else if (letter === selected && letter !== question.answer) cls += ' cv-prac-wrong';
              else cls += ' cv-prac-dimmed';
            } else if (selected === letter) {
              cls += ' cv-prac-selected';
            }
            return (
              <button key={i} className={cls} onClick={() => handleSelect(letter)} disabled={revealed}>
                <span className="cv-prac-letter">{letter}</span>
                <span className="cv-prac-text">{optText}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="cv-prac-fill">
          {!revealed && (
            <button className="cv-prac-reveal-btn" onClick={() => { setRevealed(true); onAnswer(question, ''); }}>
              查看答案
            </button>
          )}
          {revealed && (
            <div className="cv-prac-answer-reveal">
              <span className="cv-prac-exp-label">答案：</span>{question.answer}
            </div>
          )}
        </div>
      )}

      {revealed && question.explanation && (
        <div className="cv-prac-explanation">
          <span className="cv-prac-exp-label">解析：</span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}
