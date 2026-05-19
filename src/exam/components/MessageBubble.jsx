export default function MessageBubble({ content, role, loading }) {
  return (
    <div className={`cv-bubble cv-bubble-${role}`}>
      {role === 'ai' && (
        <div className="cv-bubble-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
            <path d="M12 2a7 7 0 017 7v1a7 7 0 01-14 0V9a7 7 0 017-7z"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          </svg>
        </div>
      )}
      <div className={`cv-bubble-content ${loading ? 'cv-bubble-loading' : ''}`}>
        {loading && <span className="cv-typing-dots"><span/><span/><span/></span>}
        <span className="cv-bubble-text">{content}</span>
      </div>
    </div>
  );
}
