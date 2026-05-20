const NOTEBOOK_KEY = 'cs_ai_notebook';

export function getNotebook() {
  try {
    return JSON.parse(localStorage.getItem(NOTEBOOK_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveNotebook(notes) {
  try {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(notes.slice(0, 500)));
  } catch (e) {
    console.warn('Failed to save notebook:', e);
  }
}

export function addNotes(newNotes) {
  const existing = getNotebook();
  const existingKeys = new Set(existing.map(n => `${n.subject}_${n.topic}_${n.content}`));
  const filtered = newNotes.filter(n => !existingKeys.has(`${n.subject}_${n.topic}_${n.content}`));
  if (filtered.length === 0) return existing;
  const updated = [...filtered, ...existing];
  saveNotebook(updated);
  return updated;
}

export function addNote(note) {
  const existing = getNotebook();
  existing.unshift({
    ...note,
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    addedAt: new Date().toISOString(),
    reviewCount: 0,
    nextReview: getNextReviewDate(0),
    mastery: 0,
  });
  saveNotebook(existing);
  return existing;
}

export function updateNote(id, updates) {
  const notes = getNotebook();
  const idx = notes.findIndex(n => n.id === id);
  if (idx >= 0) {
    notes[idx] = { ...notes[idx], ...updates };
    saveNotebook(notes);
  }
  return notes;
}

export function deleteNote(id) {
  const notes = getNotebook().filter(n => n.id !== id);
  saveNotebook(notes);
  return notes;
}

export function markReviewed(id) {
  const notes = getNotebook();
  const idx = notes.findIndex(n => n.id === id);
  if (idx >= 0) {
    notes[idx].reviewCount = (notes[idx].reviewCount || 0) + 1;
    notes[idx].mastery = Math.min(100, (notes[idx].mastery || 0) + 15);
    notes[idx].nextReview = getNextReviewDate(notes[idx].reviewCount);
    notes[idx].lastReview = new Date().toISOString();
    saveNotebook(notes);
  }
  return notes;
}

export function getDueNotes() {
  const notes = getNotebook();
  const today = new Date().toISOString().split('T')[0];
  return notes.filter(n => !n.nextReview || n.nextReview <= today);
}

export function getNotesBySubject(subject) {
  return getNotebook().filter(n => n.subject === subject);
}

export function getNotebookStats() {
  const notes = getNotebook();
  const subjects = {};
  notes.forEach(n => {
    const s = n.subject || '其他';
    if (!subjects[s]) subjects[s] = { total: 0, mastered: 0 };
    subjects[s].total++;
    if ((n.mastery || 0) >= 80) subjects[s].mastered++;
  });
  return { total: notes.length, subjects, dueCount: getDueNotes().length };
}

function getNextReviewDate(reviewCount) {
  const intervals = [1, 2, 4, 7, 15, 30];
  const days = intervals[Math.min(reviewCount, intervals.length - 1)];
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function extractNotesFromQuestions(questions) {
  const noteMap = new Map();
  questions.forEach(q => {
    const topic = q.topic;
    if (!topic) return;
    const key = `${q.subject || '综合'}_${topic}`;
    if (noteMap.has(key)) {
      noteMap.get(key)._questions.push(q);
      return;
    }
    noteMap.set(key, {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      subject: q.subject || '综合',
      topic,
      type: guessNoteType(q),
      content: '',
      source: 'exam_auto',
      addedAt: new Date().toISOString(),
      reviewCount: 0,
      nextReview: getNextReviewDate(0),
      mastery: 0,
      _questions: [q],
    });
  });
  return Array.from(noteMap.values());
}

export async function enrichNotesWithAI(notes) {
  const { callZhipuAI } = await import('./ocrService.js');
  const needsEnrich = (n) => !n.content || n.content.startsWith('考点：') || n.content.endsWith('核心概念与应用方法') || n.content.endsWith('的核心概念');
  const topicGroups = notes.filter(needsEnrich);
  if (topicGroups.length === 0) return notes;

  const contentMap = new Map();
  const BATCH_SIZE = 6;

  for (let i = 0; i < topicGroups.length; i += BATCH_SIZE) {
    const batch = topicGroups.slice(i, i + BATCH_SIZE);
    const topicList = batch.map(n => {
      const qs = n._questions || [];
      const example = qs[0]?.content || '';
      return `${n.topic}（${n.subject}${example ? '，例：' + example.slice(0, 30) : ''}）`;
    }).join('；');

    try {
      const messages = [
        { role: 'system', content: '为以下K12知识点各写一段总结（40-80字）：定义+要点+易错点。JSON：[{"topic":"名","content":"总结"}]。只返回JSON。' },
        { role: 'user', content: topicList },
      ];
      const response = await callZhipuAI(messages);
      const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) parsed = [parsed];
      parsed.forEach(p => contentMap.set(p.topic, p.content));
    } catch (e) {
      console.warn('Note enrichment batch failed:', e.message);
    }
  }

  return notes.map(n => {
    const enriched = contentMap.get(n.topic);
    const { _questions, ...cleanNote } = n;
    return { ...cleanNote, content: enriched || cleanNote.content || `${n.topic}的核心概念` };
  });
}

function guessNoteType(question) {
  const content = (question.content || '') + (question.topic || '');
  if (/公式|定理|方程/.test(content)) return 'formula';
  if (/单词|词汇|vocabulary/i.test(content)) return 'word';
  if (/规则|法则|定律/.test(content)) return 'rule';
  return 'concept';
}
