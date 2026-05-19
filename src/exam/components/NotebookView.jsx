import { useState, useEffect } from 'react';
import { getNotebook, deleteNote, markReviewed, getNotebookStats } from '../services/notebookService.js';
import { generateFromNotebook } from '../services/practiceScheduler.js';

export default function NotebookView({ onBack, onPractice }) {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('全部');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setNotes(getNotebook());
  }, []);

  const subjects = ['全部', ...new Set(notes.map(n => n.subject || '其他'))];
  const filtered = filter === '全部' ? notes : notes.filter(n => (n.subject || '其他') === filter);
  const stats = getNotebookStats();

  const handleDelete = (id) => {
    const updated = deleteNote(id);
    setNotes(updated);
  };

  const handleReview = (id) => {
    const updated = markReviewed(id);
    setNotes(updated);
  };

  const handleGenPractice = async () => {
    setGenerating(true);
    try {
      const result = await generateFromNotebook(null, 5);
      onPractice?.(result);
    } catch {
    } finally {
      setGenerating(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'formula': return '📐';
      case 'word': return '📝';
      case 'rule': return '📏';
      case 'method': return '🔧';
      default: return '💡';
    }
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return '#4CAF50';
    if (mastery >= 50) return '#FF9800';
    return '#f44336';
  };

  return (
    <div className="nb-page">
      <div className="nb-header">
        <button className="nb-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="nb-header-title">AI 笔记本</div>
        <div className="nb-header-stats">{stats.total}个知识点</div>
      </div>

      <div className="nb-stats-bar">
        <span className="nb-stat-item">📒 {stats.total} 总计</span>
        <span className="nb-stat-item">🔔 {stats.dueCount} 待复习</span>
      </div>

      <div className="nb-tabs">
        {subjects.map(s => (
          <button key={s} className={`nb-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s}
            {s !== '全部' && <span className="nb-tab-count">{notes.filter(n => (n.subject || '其他') === s).length}</span>}
          </button>
        ))}
      </div>

      <div className="nb-list">
        {filtered.length === 0 ? (
          <div className="nb-empty">
            <p>暂无笔记</p>
            <p className="nb-empty-hint">扫描试卷后，AI 会自动提取知识点到这里</p>
          </div>
        ) : (
          filtered.map(note => (
            <div key={note.id} className="nb-card">
              <div className="nb-card-top">
                <span className="nb-card-icon">{getTypeIcon(note.type)}</span>
                <span className="nb-card-topic">{note.topic}</span>
                <span className="nb-card-subject">{note.subject}</span>
              </div>
              <p className="nb-card-content">{note.content}</p>
              <div className="nb-card-bottom">
                <div className="nb-mastery-bar">
                  <div className="nb-mastery-fill" style={{ width: `${note.mastery || 0}%`, background: getMasteryColor(note.mastery || 0) }}></div>
                </div>
                <span className="nb-mastery-text">{note.mastery || 0}%</span>
                <div className="nb-card-actions">
                  <button className="nb-btn-review" onClick={() => handleReview(note.id)}>已复习</button>
                  <button className="nb-btn-delete" onClick={() => handleDelete(note.id)}>删除</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="nb-bottom-actions">
          <button className="nb-practice-btn" onClick={handleGenPractice} disabled={generating}>
            {generating ? '生成中...' : '根据笔记生成练习'}
          </button>
        </div>
      )}
    </div>
  );
}
