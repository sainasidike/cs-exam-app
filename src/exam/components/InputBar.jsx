import { useState, useRef, useEffect } from 'react';

export default function InputBar({ placeholder, onSend }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form className="cv-input-bar" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className="cv-input-field"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder || '输入你的问题...'}
      />
      <button className="cv-send-btn" type="submit" disabled={!text.trim()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </form>
  );
}
