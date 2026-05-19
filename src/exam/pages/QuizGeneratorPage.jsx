import { useState } from 'react';
import { generateExamPaper } from '../services/batchGradeService.js';
import { getExams, computeStats } from '../services/teacherService.js';

export default function QuizGeneratorPage({ onBack }) {
  const [form, setForm] = useState({
    subject: '语文',
    grade: '三年级',
    difficulty: '中等',
    count: '10',
    types: '选择题5道+填空题3道+简答题2道',
    useWeak: false,
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let weakTopics = [];
      if (form.useWeak) {
        const exams = getExams();
        if (exams.length > 0 && exams[0].papers) {
          const stats = computeStats(exams[0].papers);
          weakTopics = stats?.weakTopics?.map(t => t.topic) || [];
        }
      }
      const paper = await generateExamPaper({
        subject: form.subject,
        grade: form.grade,
        difficulty: form.difficulty,
        count: parseInt(form.count) || 10,
        types: form.types,
        weakTopics,
      });
      setResult(paper);
    } catch (e) {
      console.error('Generate failed:', e);
    }
    setGenerating(false);
  };

  const handleExportText = () => {
    if (!result) return;
    let text = `${result.title}\n总分：${result.totalScore}分\n\n`;
    result.questions.forEach(q => {
      text += `${q.number}. ${q.content} (${q.score}分)\n`;
      if (q.options) q.options.forEach(o => { text += `   ${o}\n`; });
      text += '\n';
    });
    text += '\n--- 答案 ---\n';
    result.questions.forEach(q => {
      text += `${q.number}. ${q.answer}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (result) {
    return (
      <div className="teacher-page">
        <div className="teacher-header">
          <button className="teacher-back-btn" onClick={() => setResult(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="teacher-header-title">试卷预览</h1>
          <button className="teacher-add-btn" onClick={handleExportText}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>

        <div className="teacher-content">
          <div className="teacher-paper-preview">
            <h2 className="teacher-paper-title">{result.title}</h2>
            <p className="teacher-paper-info">总分：{result.totalScore}分</p>

            {result.questions?.length > 0 ? (
              <div className="teacher-questions-list">
                {result.questions.map(q => (
                  <div key={q.number} className="teacher-question-card">
                    <div className="teacher-question-header">
                      <span className="teacher-question-num">{q.number}.</span>
                      <span className="teacher-question-type">{q.type}</span>
                      <span className="teacher-question-score">{q.score}分</span>
                    </div>
                    <p className="teacher-question-content">{q.content}</p>
                    {q.options && (
                      <div className="teacher-question-options">
                        {q.options.map((o, i) => <p key={i}>{o}</p>)}
                      </div>
                    )}
                    <div className="teacher-question-answer">
                      <span>答案：{q.answer}</span>
                    </div>
                    {q.explanation && <p className="teacher-question-explanation">解析：{q.explanation}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="teacher-empty">
                <p>生成失败，请重试</p>
              </div>
            )}
          </div>

          <div className="teacher-btn-row">
            <button className="teacher-btn-secondary" onClick={() => setResult(null)}>重新生成</button>
            <button className="teacher-btn-primary" onClick={handleExportText}>导出试卷</button>
          </div>
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
        <h1 className="teacher-header-title">智能组卷</h1>
        <div style={{width: 20}} />
      </div>

      <div className="teacher-content">
        <div className="teacher-form-group">
          <label>学科</label>
          <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
            <option>语文</option><option>数学</option><option>英语</option>
            <option>科学</option><option>道德与法治</option>
          </select>
        </div>

        <div className="teacher-form-group">
          <label>年级</label>
          <select value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
            <option>一年级</option><option>二年级</option><option>三年级</option>
            <option>四年级</option><option>五年级</option><option>六年级</option>
            <option>七年级</option><option>八年级</option><option>九年级</option>
          </select>
        </div>

        <div className="teacher-form-group">
          <label>难度</label>
          <div className="teacher-radio-group">
            {['基础', '中等', '拔高'].map(d => (
              <button key={d} className={`teacher-radio-btn ${form.difficulty === d ? 'active' : ''}`}
                onClick={() => setForm({...form, difficulty: d})}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="teacher-form-group">
          <label>题目数量</label>
          <input type="number" value={form.count} onChange={e => setForm({...form, count: e.target.value})} min="3" max="30" />
        </div>

        <div className="teacher-form-group">
          <label>题型要求</label>
          <input value={form.types} onChange={e => setForm({...form, types: e.target.value})} placeholder="如：选择题5道+填空题3道" />
        </div>

        <div className="teacher-form-group">
          <label className="teacher-checkbox-label">
            <input type="checkbox" checked={form.useWeak} onChange={e => setForm({...form, useWeak: e.target.checked})} />
            针对班级薄弱知识点出题
          </label>
        </div>

        <button className="teacher-btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? '正在生成试卷...' : '生成试卷'}
        </button>
      </div>
    </div>
  );
}
