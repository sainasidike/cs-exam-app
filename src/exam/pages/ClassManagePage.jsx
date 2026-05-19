import { useState, useEffect } from 'react';
import { getClasses, addClass, updateClass, deleteClass } from '../services/teacherService.js';

export default function ClassManagePage({ onBack }) {
  const [classes, setClasses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', grade: '', students: '' });

  useEffect(() => { setClasses(getClasses()); }, []);

  const handleSave = () => {
    if (!form.name.trim()) return;
    const studentList = form.students.split(/[,，\n]/).map(s => s.trim()).filter(Boolean)
      .map((name, i) => ({ id: `s_${Date.now()}_${i}`, name, seatNo: i + 1 }));

    if (editId) {
      const updated = updateClass(editId, { name: form.name, grade: form.grade, students: studentList });
      setClasses(updated);
    } else {
      const updated = addClass({ name: form.name, grade: form.grade, students: studentList });
      setClasses(updated);
    }
    setShowAdd(false);
    setEditId(null);
    setForm({ name: '', grade: '', students: '' });
  };

  const handleEdit = (cls) => {
    setEditId(cls.id);
    setForm({ name: cls.name, grade: cls.grade || '', students: cls.students.map(s => s.name).join('，') });
    setShowAdd(true);
  };

  const handleDelete = (id) => {
    const updated = deleteClass(id);
    setClasses(updated);
  };

  return (
    <div className="teacher-page">
      <div className="teacher-header">
        <button className="teacher-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="teacher-header-title">班级管理</h1>
        <button className="teacher-add-btn" onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: '', grade: '', students: '' }); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {showAdd && (
        <div className="teacher-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="teacher-modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? '编辑班级' : '新建班级'}</h3>
            <div className="teacher-form-group">
              <label>班级名称</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="如：三年级2班" />
            </div>
            <div className="teacher-form-group">
              <label>年级</label>
              <input value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} placeholder="如：三年级" />
            </div>
            <div className="teacher-form-group">
              <label>学生名单（逗号分隔）</label>
              <textarea value={form.students} onChange={e => setForm({...form, students: e.target.value})} placeholder="王小明，李小红，张三..." rows={4} />
            </div>
            <div className="teacher-modal-actions">
              <button className="teacher-btn-cancel" onClick={() => setShowAdd(false)}>取消</button>
              <button className="teacher-btn-confirm" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}

      <div className="teacher-content">
        {classes.length === 0 ? (
          <div className="teacher-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p>暂无班级</p>
            <p className="teacher-empty-hint">点击右上角 + 创建班级</p>
          </div>
        ) : (
          <div className="teacher-class-list">
            {classes.map(cls => (
              <div key={cls.id} className="teacher-class-card">
                <div className="teacher-class-info">
                  <span className="teacher-class-name">{cls.name}</span>
                  <span className="teacher-class-meta">{cls.grade} · {cls.students?.length || 0}人</span>
                </div>
                <div className="teacher-class-actions">
                  <button className="teacher-icon-btn" onClick={() => handleEdit(cls)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="teacher-icon-btn" onClick={() => handleDelete(cls.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
