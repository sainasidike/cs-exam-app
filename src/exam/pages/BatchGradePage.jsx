import { useState, useEffect } from 'react';
import { getClasses, getExams, addExam, updateExam, computeStats } from '../services/teacherService.js';
import { batchGrade } from '../services/batchGradeService.js';

export default function BatchGradePage({ onBack, onReport }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [papers, setPapers] = useState([]);
  const [grading, setGrading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateFile, setTemplateFile] = useState(null);

  useEffect(() => {
    const c = getClasses();
    setClasses(c);
    if (c.length > 0) setSelectedClass(c[0]);
  }, []);

  const handleAddPapers = (e) => {
    if (e.target.files.length > 0) {
      const newPapers = Array.from(e.target.files).map((file, i) => ({
        id: `p_${Date.now()}_${i}`,
        images: [file],
        studentName: '',
        status: 'pending',
      }));
      setPapers(prev => [...prev, ...newPapers]);
    }
    e.target.value = '';
  };

  const handleTemplateChange = (e) => {
    if (e.target.files[0]) setTemplateFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleRemovePaper = (id) => {
    setPapers(prev => prev.filter(p => p.id !== id));
  };

  const handleStartGrade = async () => {
    if (papers.length === 0) return;
    setGrading(true);
    setProgress({ done: 0, total: papers.length });

    try {
      const graded = await batchGrade(papers, null, (done, total) => {
        setProgress({ done, total });
      });

      const stats = computeStats(graded);
      const title = examTitle || `${selectedClass?.name || ''}考试 ${new Date().toLocaleDateString('zh-CN')}`;
      const exam = { title, classId: selectedClass?.id, papers: graded, stats };
      addExam(exam);
      setResults({ papers: graded, stats, title });
    } catch (e) {
      console.error('Batch grade error:', e);
    }
    setGrading(false);
  };

  if (results) {
    return (
      <div className="teacher-page">
        <div className="teacher-header">
          <button className="teacher-back-btn" onClick={() => setResults(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="teacher-header-title">批改完成</h1>
          <button className="teacher-add-btn" onClick={onBack}>完成</button>
        </div>

        <div className="teacher-content">
          <div className="teacher-result-summary">
            <div className="teacher-stat-row">
              <div className="teacher-stat-card">
                <span className="teacher-stat-value">{results.stats?.avg || '--'}</span>
                <span className="teacher-stat-label">平均分</span>
              </div>
              <div className="teacher-stat-card">
                <span className="teacher-stat-value">{results.stats?.max || '--'}</span>
                <span className="teacher-stat-label">最高分</span>
              </div>
              <div className="teacher-stat-card">
                <span className="teacher-stat-value">{results.stats?.passRate || '--'}%</span>
                <span className="teacher-stat-label">及格率</span>
              </div>
            </div>
          </div>

          <div className="teacher-section">
            <div className="teacher-section-header">
              <span className="teacher-section-title">学生成绩</span>
            </div>
            <div className="teacher-student-list">
              {results.papers.map((p, i) => (
                <div key={p.id} className={`teacher-student-row ${p.status === 'error' ? 'error' : ''}`}>
                  <span className="teacher-student-rank">{i + 1}</span>
                  <span className="teacher-student-name">{p.studentName}</span>
                  <span className="teacher-student-score">{p.status === 'error' ? '批改失败' : `${p.score}分`}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="teacher-btn-primary" onClick={() => onReport && onReport()}>查看详细报告</button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-page">
      <div className="teacher-header">
        <button className="teacher-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="teacher-header-title">批量批改</h1>
        <div style={{width: 20}} />
      </div>

      <div className="teacher-content">
        <div className="teacher-form-group">
          <label>选择班级</label>
          <select value={selectedClass?.id || ''} onChange={e => setSelectedClass(classes.find(c => c.id === e.target.value))}>
            {classes.length === 0 && <option value="">暂无班级</option>}
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.students?.length || 0}人)</option>)}
          </select>
        </div>

        <div className="teacher-form-group">
          <label>考试名称</label>
          <input value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="如：期末语文测试" />
        </div>

        <div className="teacher-form-group">
          <label className="teacher-checkbox-label">
            <input type="checkbox" checked={useTemplate} onChange={e => setUseTemplate(e.target.checked)} />
            使用答案模板（先拍标准答案）
          </label>
          {useTemplate && (
            <div className="teacher-template-area">
              {templateFile ? (
                <span className="teacher-template-name">{templateFile.name}</span>
              ) : (
                <label className="teacher-upload-btn">
                  拍摄/选择标准答案
                  <input type="file" accept="image/*" hidden onChange={handleTemplateChange} />
                </label>
              )}
            </div>
          )}
        </div>

        <div className="teacher-section">
          <div className="teacher-section-header">
            <span className="teacher-section-title">试卷照片 ({papers.length}份)</span>
            <label className="teacher-add-paper-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              添加
              <input type="file" accept="image/*" multiple hidden onChange={handleAddPapers} />
            </label>
          </div>

          {papers.length === 0 ? (
            <label className="teacher-upload-area">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <p>点击拍照或选择试卷图片</p>
              <p className="teacher-empty-hint">支持一次选择多张</p>
              <input type="file" accept="image/*" multiple hidden onChange={handleAddPapers} />
            </label>
          ) : (
            <div className="teacher-paper-grid">
              {papers.map(p => (
                <div key={p.id} className="teacher-paper-thumb">
                  <img src={URL.createObjectURL(p.images[0])} alt="" />
                  <button className="teacher-paper-remove" onClick={() => handleRemovePaper(p.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {grading ? (
          <div className="teacher-progress">
            <div className="teacher-progress-bar">
              <div className="teacher-progress-fill" style={{width: `${progress.total > 0 ? (progress.done / progress.total * 100) : 0}%`}} />
            </div>
            <span className="teacher-progress-text">正在批改 {progress.done}/{progress.total}...</span>
          </div>
        ) : (
          <button className="teacher-btn-primary" onClick={handleStartGrade} disabled={papers.length === 0}>
            开始批量批改 ({papers.length}份)
          </button>
        )}
      </div>
    </div>
  );
}
