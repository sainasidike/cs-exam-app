import { useState } from 'react';

export default function ActionButtons({ actions, onAction, disabled }) {
  const [clicked, setClicked] = useState(false);
  const isDisabled = disabled || clicked;

  const handleClick = (id) => {
    if (isDisabled) return;
    setClicked(true);
    onAction(id);
  };

  return (
    <div className={`cv-actions ${isDisabled ? 'cv-actions-disabled' : ''}`}>
      {actions.map(a => (
        <button
          key={a.id}
          className={`cv-action-btn ${a.id === actions[0].id ? 'cv-action-btn-primary' : ''}`}
          onClick={() => handleClick(a.id)}
          disabled={isDisabled}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
