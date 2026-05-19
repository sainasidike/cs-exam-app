export default function ActionButtons({ actions, onAction }) {
  return (
    <div className="cv-actions">
      {actions.map(a => (
        <button
          key={a.id}
          className={`cv-action-btn ${a.id === actions[0].id ? 'cv-action-btn-primary' : ''}`}
          onClick={() => onAction(a.id)}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
