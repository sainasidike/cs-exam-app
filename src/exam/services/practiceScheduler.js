import { getWrongQuestions } from './storageService.js';
import { getNotebook, getDueNotes } from './notebookService.js';
import { generatePractice, generateReviewQuiz, callZhipuAI } from './ocrService.js';

export async function generateDailyPractice(count = 5) {
  const wrong = getWrongQuestions();
  const dueNotes = getDueNotes();

  if (wrong.length === 0 && dueNotes.length === 0) {
    return { type: 'daily', questions: [], message: '暂无需要复习的内容，继续保持！' };
  }

  const sources = [];
  if (wrong.length > 0) {
    const sampled = wrong.sort(() => Math.random() - 0.5).slice(0, Math.ceil(count * 0.6));
    sources.push(...sampled);
  }

  if (dueNotes.length > 0 && sources.length < count) {
    const noteTopics = dueNotes.slice(0, count - sources.length).map(n => ({
      content: `关于${n.topic}的练习`,
      topic: n.topic,
      subject: n.subject,
      correctAnswer: '',
    }));
    sources.push(...noteTopics);
  }

  try {
    const questions = await generateReviewQuiz(sources.slice(0, 8), count);
    return { type: 'daily', questions, message: `今日练习 ${count} 题，针对薄弱知识点` };
  } catch {
    return { type: 'daily', questions: [], message: '练习生成失败，请稍后重试' };
  }
}

export async function generateWeeklyPractice(count = 10) {
  const wrong = getWrongQuestions();
  if (wrong.length < 3) {
    return { type: 'weekly', questions: [], message: '错题不足，暂时无法生成周练' };
  }

  const topicCounts = {};
  wrong.forEach(q => {
    const t = q.topic || '未分类';
    topicCounts[t] = (topicCounts[t] || 0) + 1;
  });
  const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  const weakTopics = sorted.slice(0, 5).map(([t]) => t);

  const relevantWrong = wrong.filter(q => weakTopics.includes(q.topic));
  try {
    const questions = await generateReviewQuiz(relevantWrong.slice(0, 10), count);
    return { type: 'weekly', questions, message: `本周重点复习：${weakTopics.slice(0, 3).join('、')}` };
  } catch {
    return { type: 'weekly', questions: [], message: '周练生成失败' };
  }
}

export async function generateExamPrep(subjects, count = 15) {
  const wrong = getWrongQuestions();
  const notebook = getNotebook();

  const relevantWrong = subjects
    ? wrong.filter(q => subjects.includes(q.subject))
    : wrong;
  const relevantNotes = subjects
    ? notebook.filter(n => subjects.includes(n.subject))
    : notebook;

  const topicCounts = {};
  relevantWrong.forEach(q => {
    topicCounts[q.topic || '未分类'] = (topicCounts[q.topic || '未分类'] || 0) + 1;
  });
  relevantNotes.forEach(n => {
    if ((n.mastery || 0) < 60) {
      topicCounts[n.topic] = (topicCounts[n.topic] || 0) + 1;
    }
  });

  const weakTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);

  const subjectStr = subjects ? subjects.join('、') : '综合';
  const systemPrompt = `K12考前冲刺出题专家。根据学生薄弱知识点出${count}道高质量题目（选择题为主），覆盖重点难点。难度中等偏上。JSON数组：[{"question":"题目","options":["A. xxx","B. xxx","C. xxx","D. xxx"],"answer":"正确选项字母","explanation":"解析","topic":"知识点","difficulty":"medium/hard"}]。只返回JSON。`;

  try {
    const content = await callZhipuAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `学科：${subjectStr}\n薄弱知识点：${weakTopics.join('、')}\n历史错题：${relevantWrong.slice(0, 5).map(q => q.content).join('；')}` },
    ]);
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(jsonStr);
    return { type: 'exam_prep', questions, message: `考前冲刺 ${count} 题：重点攻克 ${weakTopics.slice(0, 3).join('、')}` };
  } catch {
    const fallback = await generateReviewQuiz(relevantWrong.slice(0, 10), count);
    return { type: 'exam_prep', questions: fallback, message: '考前冲刺练习' };
  }
}

export async function generateFromNotebook(noteIds, count = 5) {
  const notebook = getNotebook();
  const selectedNotes = noteIds
    ? notebook.filter(n => noteIds.includes(n.id))
    : getDueNotes().slice(0, 5);

  if (selectedNotes.length === 0) {
    return { type: 'notebook', questions: [], message: '没有选中的知识点' };
  }

  const topics = selectedNotes.map(n => n.topic).join('、');
  const subject = selectedNotes[0]?.subject || '综合';

  const systemPrompt = `K12出题专家。根据知识点出${count}道选择题。JSON数组：[{"question":"题目","options":["A. xxx","B. xxx","C. xxx","D. xxx"],"answer":"正确选项字母","explanation":"解析","topic":"知识点"}]。只返回JSON。`;

  try {
    const content = await callZhipuAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `学科：${subject}\n知识点：${topics}` },
    ]);
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(jsonStr);
    return { type: 'notebook', questions, message: `根据笔记「${topics}」生成练习` };
  } catch {
    return { type: 'notebook', questions: [], message: '练习生成失败' };
  }
}

export async function generateFromWrongQuestions(wrongIds, count = 5) {
  const wrong = getWrongQuestions();
  const selected = wrongIds
    ? wrong.filter(q => wrongIds.includes(q.id))
    : wrong.slice(0, 8);

  if (selected.length === 0) {
    return { type: 'wrong', questions: [], message: '没有选中的错题' };
  }

  try {
    const questions = await generateReviewQuiz(selected, count);
    return { type: 'wrong', questions, message: `针对 ${selected.length} 道错题生成练习` };
  } catch {
    return { type: 'wrong', questions: [], message: '练习生成失败' };
  }
}

export function getPracticeRecommendation() {
  const wrong = getWrongQuestions();
  const dueNotes = getDueNotes();

  if (wrong.length === 0 && dueNotes.length === 0) {
    return null;
  }

  if (dueNotes.length >= 5) {
    return { type: 'daily', reason: `有 ${dueNotes.length} 个知识点需要复习` };
  }
  if (wrong.length >= 10) {
    return { type: 'weekly', reason: `累计 ${wrong.length} 道错题，建议集中练习` };
  }
  if (wrong.length > 0) {
    return { type: 'daily', reason: `${wrong.length} 道错题待消化` };
  }
  return null;
}
