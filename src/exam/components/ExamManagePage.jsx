import { useState, useMemo } from 'react';
import { getExamLibrary, deleteExamFromLibrary } from '../services/storageService.js';
import { EXAM_DOCUMENTS } from '../cachedExams.js';

export default function ExamManagePage({ onBack, onSelectExam }) {
  const [searchText, setSearchText] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('全部');
  const [sortBy, setSortBy] = useState('lastStudied');
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [records, setRecords] = useState(() => getExamLibrary());

  const allExams = useMemo(() => {
    return records.map(record => {
      const doc = EXAM_DOCUMENTS.find(d => d.id === record.id);
      return {
        ...record,
        thumb: record.thumb || doc?.thumb || null,
      };
    });
  }, [records]);

  const subjects = useMemo(() => {
    const set = new Set(allExams.map(e => e.subject).filter(Boolean));
    return ['全部', ...Array.from(set)];
  }, [allExams]);

  const filtered = useMemo(() => {
    let list = allExams;
    if (subjectFilter !== '全部') {
      list = list.filter(e => e.subject === subjectFilter);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.subject || '').toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'lastStudied') {
        return (b.lastStudied || '').localeCompare(a.lastStudied || '');
      }
      if (sortBy === 'scoreHigh') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'scoreLow') return (a.score || 0) - (b.score || 0);
      return (b.gradedAt || '').localeCompare(a.gradedAt || '');
    });
    return list;
  }, [allExams, subjectFilter, searchText, sortBy]);

  const handleDelete = (id) => {
    deleteExamFromLibrary(id);
    setRecords(getExamLibrary());
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBatchDelete = () => {
    selected.forEach(id => deleteExamFromLibrary(id));
    setRecords(getExamLibrary());
    setSelected(new Set());
    setEditMode(false);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="em-page">
      <div className="em-header">
        <button className="em-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="em-header-title">我的试卷</div>
        <button className="em-edit-btn" onClick={() => { setEditMode(!editMode); setSelected(new Set()); }}>
          {editMode ? '完成' : '编辑'}
        </button>
      </div>

      <div className="em-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          className="em-search-input"
          placeholder="搜索试卷名称/学科"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="em-filters">
        <div className="em-subject-tabs">
          {subjects.map(s => (
            <button
              key={s}
              className={`em-subject-tab ${subjectFilter === s ? 'active' : ''}`}
              onClick={() => setSubjectFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="em-sort-row">
        <span className="em-count">{filtered.length} 份试卷</span>
        <select className="em-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="lastStudied">最近学习</option>
          <option value="scoreHigh">得分高→低</option>
          <option value="scoreLow">得分低→高</option>
          <option value="gradedAt">批改时间</option>
        </select>
      </div>

      <div className="em-list">
        {filtered.length === 0 && (
          <div className="em-empty">
            <p>暂无试卷记录</p>
            <p className="em-empty-sub">扫描或批改试卷后会自动出现在这里</p>
          </div>
        )}
        {filtered.map(exam => (
          <div key={exam.id} className="em-item" onClick={() => !editMode && onSelectExam?.(exam)}>
            {editMode && (
              <div className={`em-checkbox ${selected.has(exam.id) ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); toggleSelect(exam.id); }}>
                {selected.has(exam.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
            )}
            {exam.thumb && <img className="em-thumb" src={exam.thumb} alt="" />}
            {!exam.thumb && (
              <div className="em-thumb-placeholder">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
            )}
            <div className="em-item-info">
              <span className="em-item-title">{exam.title}</span>
              <span className="em-item-meta">{exam.subject} · {exam.total}题 · {exam.lastStudied || exam.gradedAt}</span>
            </div>
            <div className="em-item-right">
              <span className={`em-item-score ${exam.score >= 80 ? 'high' : exam.score >= 60 ? 'mid' : 'low'}`}>{exam.score}%</span>
              {exam.wrong > 0 && <span className="em-item-wrong">{exam.wrong}题错</span>}
            </div>
          </div>
        ))}
      </div>

      {editMode && (
        <div className="em-batch-bar">
          <button className="em-batch-select-all" onClick={() => {
            if (selected.size === filtered.length) {
              setSelected(new Set());
            } else {
              setSelected(new Set(filtered.map(e => e.id)));
            }
          }}>
            {selected.size === filtered.length ? '取消全选' : '全选'}
          </button>
          <span className="em-batch-count">已选 {selected.size} 份</span>
          <button className="em-batch-delete" disabled={selected.size === 0} onClick={handleBatchDelete}>删除</button>
        </div>
      )}
    </div>
  );
}
