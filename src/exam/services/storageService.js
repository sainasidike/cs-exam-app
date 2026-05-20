const KEYS = {
  HISTORY: 'cs_exam_history',
  WRONG: 'cs_exam_wrong',
  MASTERY: 'cs_exam_mastery',
  MASTERY_HISTORY: 'cs_exam_mastery_history',
  REDO_LOG: 'cs_exam_redo_log',
  LIBRARY: 'cs_exam_library',
};

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];
  } catch {
    return [];
  }
}

export function saveHistory(data) {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(data.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to save history:', e);
  }
}

export function getWrongQuestions() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.WRONG)) || [];
  } catch {
    return [];
  }
}

export function saveWrongQuestions(data) {
  try {
    localStorage.setItem(KEYS.WRONG, JSON.stringify(data.slice(0, 200)));
  } catch (e) {
    console.warn('Failed to save wrong questions:', e);
  }
}

export function getTopicMastery() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.MASTERY)) || {};
  } catch {
    return {};
  }
}

export function updateTopicMastery(topic, correct) {
  const mastery = getTopicMastery();
  if (!mastery[topic]) {
    mastery[topic] = { mastery: 50, attempts: 0 };
  }
  mastery[topic].attempts += 1;
  const delta = correct ? 5 : -10;
  mastery[topic].mastery = Math.min(100, Math.max(0, mastery[topic].mastery + delta));

  try {
    localStorage.setItem(KEYS.MASTERY, JSON.stringify(mastery));
  } catch (e) {
    console.warn('Failed to save mastery:', e);
  }

  appendMasteryHistory(topic, mastery[topic].mastery);
  return mastery;
}

export function getMasteryHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.MASTERY_HISTORY)) || {};
  } catch {
    return {};
  }
}

export function appendMasteryHistory(topic, value) {
  const history = getMasteryHistory();
  if (!history[topic]) history[topic] = [];
  const today = new Date().toISOString().split('T')[0];
  const last = history[topic][history[topic].length - 1];
  if (last && last.date === today) {
    last.value = value;
  } else {
    history[topic].push({ date: today, value });
  }
  if (history[topic].length > 30) history[topic] = history[topic].slice(-30);
  try {
    localStorage.setItem(KEYS.MASTERY_HISTORY, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save mastery history:', e);
  }
}

export function getRedoLog() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.REDO_LOG)) || [];
  } catch {
    return [];
  }
}

export function appendRedoLog(total, mastered) {
  const log = getRedoLog();
  log.push({ date: new Date().toISOString().split('T')[0], total, mastered });
  try {
    localStorage.setItem(KEYS.REDO_LOG, JSON.stringify(log.slice(-50)));
  } catch (e) {
    console.warn('Failed to save redo log:', e);
  }
}

// === 试卷库 ===
export function getExamLibrary() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.LIBRARY)) || [];
  } catch {
    return [];
  }
}

export function saveExamToLibrary(record) {
  const lib = getExamLibrary();
  const existing = lib.findIndex(r => r.id === record.id);
  if (existing >= 0) {
    lib[existing] = { ...lib[existing], ...record };
  } else {
    lib.unshift(record);
  }
  try {
    localStorage.setItem(KEYS.LIBRARY, JSON.stringify(lib.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to save exam library:', e);
  }
  return lib;
}

export function updateExamInLibrary(id, updates) {
  const lib = getExamLibrary();
  const idx = lib.findIndex(r => r.id === id);
  if (idx >= 0) {
    lib[idx] = { ...lib[idx], ...updates };
    try {
      localStorage.setItem(KEYS.LIBRARY, JSON.stringify(lib));
    } catch (e) {
      console.warn('Failed to update exam:', e);
    }
  }
  return lib;
}

export function deleteExamFromLibrary(id) {
  const lib = getExamLibrary().filter(r => r.id !== id);
  try {
    localStorage.setItem(KEYS.LIBRARY, JSON.stringify(lib));
  } catch (e) {
    console.warn('Failed to delete exam:', e);
  }
  return lib;
}

export function saveExamResult(examId, gradeResult) {
  try {
    localStorage.setItem(`cs_exam_result_${examId}`, JSON.stringify(gradeResult));
  } catch (e) {
    console.warn('Failed to save exam result:', e);
  }
}

export function getExamResult(examId) {
  try {
    return JSON.parse(localStorage.getItem(`cs_exam_result_${examId}`));
  } catch {
    return null;
  }
}

// === 按试卷隔离的数据 ===
export function getExamMessages(examId) {
  try {
    return JSON.parse(localStorage.getItem(`cs_exam_msgs_${examId}`)) || [];
  } catch { return []; }
}

export function saveExamMessages(examId, messages) {
  try {
    localStorage.setItem(`cs_exam_msgs_${examId}`, JSON.stringify(messages.slice(-200)));
  } catch {}
}

export function getExamNotes(examId) {
  try {
    return JSON.parse(localStorage.getItem(`cs_exam_notes_${examId}`)) || [];
  } catch { return []; }
}

export function saveExamNotes(examId, notes) {
  try {
    localStorage.setItem(`cs_exam_notes_${examId}`, JSON.stringify(notes.slice(0, 100)));
  } catch {}
}

export function getExamWrong(examId) {
  try {
    return JSON.parse(localStorage.getItem(`cs_exam_wrong_${examId}`)) || [];
  } catch { return []; }
}

export function saveExamWrong(examId, wrong) {
  try {
    localStorage.setItem(`cs_exam_wrong_${examId}`, JSON.stringify(wrong.slice(0, 100)));
  } catch {}
}

export function getExamProgress(examId) {
  try {
    return JSON.parse(localStorage.getItem(`cs_exam_progress_${examId}`));
  } catch { return null; }
}

export function saveExamProgress(examId, progress) {
  try {
    localStorage.setItem(`cs_exam_progress_${examId}`, JSON.stringify(progress));
  } catch {}
}

// === 练习卷 ===
export function savePracticePaper(paper) {
  try {
    const key = 'cs_practice_papers';
    const papers = JSON.parse(localStorage.getItem(key)) || [];
    papers.unshift(paper);
    localStorage.setItem(key, JSON.stringify(papers.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to save practice paper:', e);
  }
}

export function getPracticePapers() {
  try {
    return JSON.parse(localStorage.getItem('cs_practice_papers')) || [];
  } catch {
    return [];
  }
}

export function getPracticePaper(id) {
  return getPracticePapers().find(p => p.id === id) || null;
}

export function clearAllData() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
