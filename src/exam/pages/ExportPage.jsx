import { useState, useEffect } from 'react';
import { getExams } from '../services/teacherService.js';

export default function ExportPage({ onBack, exam }) {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(exam || null);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const all = getExams();
    setExams(all);
    if (!selectedExam && all.length > 0) setSelectedExam(all[0]);
  }, []);

  const handleExportCSV = () => {
    if (!selectedExam?.papers) return;
    let csv = '序号,姓名,分数,状态\n';
    const sorted = [...selectedExam.papers].sort((a, b) => (b.score || 0) - (a.score || 0));
    sorted.forEach((p, i) => {
      csv += `${i + 1},${p.studentName},${p.score || ''},${p.status === 'graded' ? '已批' : '失败'}\n`;
    });

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExam.title || '成绩单'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  const handleExportReport = () => {
    if (!selectedExam) return;
    const stats = selectedExam.stats;
    let text = `===== 班级成绩报告 =====\n`;
    text += `考试：${selectedExam.title}\n`;
    text += `日期：${new Date(selectedExam.date).toLocaleDateString('zh-CN')}\n\n`;

    if (stats) {
      text += `--- 统计概览 ---\n`;
      text += `平均分：${stats.avg}  最高分：${stats.max}  最低分：${stats.min}\n`;
      text += `及格率：${stats.passRate}%  优秀率：${stats.excellentRate}%\n\n`;

      if (stats.weakTopics?.length > 0) {
        text += `--- 薄弱知识点 ---\n`;
        stats.weakTopics.forEach((t, i) => {
          text += `${i + 1}. ${t.topic} - 错误率${t.errorRate}%\n`;
        });
        text += '\n';
      }
    }

    text += `--- 学生成绩 ---\n`;
    const sorted = [...(selectedExam.papers || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
    sorted.forEach((p, i) => {
      text += `${i + 1}. ${p.studentName} - ${p.score || '--'}分\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExam.title || '报告'}_报告.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  const handleGenerateParentNotice = () => {
    if (!selectedExam?.papers) return;
    let text = `各位家长好：\n\n以下是本次「${selectedExam.title}」的成绩通知：\n\n`;

    const sorted = [...selectedExam.papers].filter(p => p.score != null).sort((a, b) => b.score - a.score);
    sorted.forEach(p => {
      const weakQs = p.gradeResult?.questions?.filter(q => !q.correct)?.slice(0, 2) || [];
      const weakStr = weakQs.map(q => q.topic).filter(Boolean).join('、');
      text += `${p.studentName}：${p.score}分`;
      if (weakStr) text += `（需加强：${weakStr}）`;
      text += '\n';
    });

    if (selectedExam.stats) {
      text += `\n班级平均分：${selectedExam.stats.avg}分，及格率：${selectedExam.stats.passRate}%\n`;
    }
    text += `\n请家长关注孩子的薄弱知识点，配合复习。谢谢！`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `家长通知_${selectedExam.title || ''}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  return (
    <div className="teacher-page">
      <div className="teacher-header">
        <button className="teacher-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="teacher-header-title">导出与分享</h1>
        <div style={{width: 20}} />
      </div>

      <div className="teacher-content">
        {exams.length > 1 && (
          <div className="teacher-form-group">
            <label>选择考试</label>
            <select value={selectedExam?.id || ''} onChange={e => { setSelectedExam(exams.find(ex => ex.id === e.target.value)); setExported(false); }}>
              {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
        )}

        {!selectedExam ? (
          <div className="teacher-empty">
            <p>暂无可导出的考试数据</p>
          </div>
        ) : (
          <div className="teacher-export-options">
            <div className="teacher-export-card" onClick={handleExportCSV}>
              <div className="teacher-export-icon" style={{background: '#E8F5E9'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
              </div>
              <div className="teacher-export-info">
                <span className="teacher-export-title">导出成绩单 (CSV)</span>
                <span className="teacher-export-desc">可用Excel打开，含姓名和分数</span>
              </div>
            </div>

            <div className="teacher-export-card" onClick={handleExportReport}>
              <div className="teacher-export-icon" style={{background: '#E3F2FD'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M8 18v-4"/><path d="M16 18v-2"/></svg>
              </div>
              <div className="teacher-export-info">
                <span className="teacher-export-title">导出班级报告</span>
                <span className="teacher-export-desc">包含统计数据和薄弱知识点分析</span>
              </div>
            </div>

            <div className="teacher-export-card" onClick={handleGenerateParentNotice}>
              <div className="teacher-export-icon" style={{background: '#FFF3E0'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
              </div>
              <div className="teacher-export-info">
                <span className="teacher-export-title">生成家长通知</span>
                <span className="teacher-export-desc">每位学生的成绩+薄弱点，可发群</span>
              </div>
            </div>

            {exported && (
              <div className="teacher-export-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                已导出成功
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
