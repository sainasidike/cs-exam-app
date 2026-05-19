const KEYS = {
  CLASSES: 'cs_teacher_classes',
  EXAMS: 'cs_teacher_exams',
  MODE: 'cs_teacher_mode',
};

export function getTeacherMode() {
  return localStorage.getItem(KEYS.MODE) === 'true';
}

export function setTeacherMode(on) {
  localStorage.setItem(KEYS.MODE, on ? 'true' : 'false');
}

export function getClasses() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.CLASSES)) || [];
  } catch { return []; }
}

export function saveClasses(classes) {
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
}

export function addClass(cls) {
  const classes = getClasses();
  classes.push({ ...cls, id: cls.id || Date.now().toString(36) });
  saveClasses(classes);
  return classes;
}

export function updateClass(id, updates) {
  const classes = getClasses();
  const idx = classes.findIndex(c => c.id === id);
  if (idx >= 0) classes[idx] = { ...classes[idx], ...updates };
  saveClasses(classes);
  return classes;
}

export function deleteClass(id) {
  const classes = getClasses().filter(c => c.id !== id);
  saveClasses(classes);
  return classes;
}

export function getExams() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.EXAMS)) || [];
  } catch { return []; }
}

export function saveExams(exams) {
  localStorage.setItem(KEYS.EXAMS, JSON.stringify(exams));
}

export function addExam(exam) {
  const exams = getExams();
  exams.unshift({ ...exam, id: exam.id || Date.now().toString(36), date: new Date().toISOString() });
  saveExams(exams);
  return exams;
}

export function updateExam(id, updates) {
  const exams = getExams();
  const idx = exams.findIndex(e => e.id === id);
  if (idx >= 0) exams[idx] = { ...exams[idx], ...updates };
  saveExams(exams);
  return exams;
}

export function deleteExam(id) {
  const exams = getExams().filter(e => e.id !== id);
  saveExams(exams);
  return exams;
}

export function computeStats(papers) {
  if (!papers || papers.length === 0) return null;
  const scores = papers.filter(p => p.score != null).map(p => p.score);
  if (scores.length === 0) return null;
  const sorted = [...scores].sort((a, b) => a - b);
  const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10;
  const max = sorted[sorted.length - 1];
  const min = sorted[0];
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const passCount = scores.filter(s => s >= 60).length;
  const excellentCount = scores.filter(s => s >= 90).length;
  const passRate = Math.round(passCount / scores.length * 100);
  const excellentRate = Math.round(excellentCount / scores.length * 100);

  const distribution = { '90+': 0, '80-89': 0, '70-79': 0, '60-69': 0, '<60': 0 };
  scores.forEach(s => {
    if (s >= 90) distribution['90+']++;
    else if (s >= 80) distribution['80-89']++;
    else if (s >= 70) distribution['70-79']++;
    else if (s >= 60) distribution['60-69']++;
    else distribution['<60']++;
  });

  const topicErrors = {};
  papers.forEach(p => {
    if (!p.gradeResult?.questions) return;
    p.gradeResult.questions.forEach(q => {
      if (!q.correct) {
        const t = q.topic || '未分类';
        if (!topicErrors[t]) topicErrors[t] = { topic: t, errorCount: 0, total: 0, typicalWrong: [] };
        topicErrors[t].errorCount++;
        if (topicErrors[t].typicalWrong.length < 3 && q.userAnswer) {
          topicErrors[t].typicalWrong.push(q.userAnswer);
        }
      }
      const t = q.topic || '未分类';
      if (!topicErrors[t]) topicErrors[t] = { topic: t, errorCount: 0, total: 0, typicalWrong: [] };
      topicErrors[t].total++;
    });
  });
  const weakTopics = Object.values(topicErrors)
    .map(t => ({ ...t, errorRate: Math.round(t.errorCount / t.total * 100) }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5);

  return { avg, max, min, median, passRate, excellentRate, distribution, weakTopics, totalStudents: scores.length };
}
