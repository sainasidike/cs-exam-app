import { callZhipuVision, callZhipuAI, fileToBase64Public } from './ocrService.js';

export async function batchGrade(papers, answerTemplate, onProgress) {
  const results = [];
  const concurrency = 2;
  let completed = 0;

  for (let i = 0; i < papers.length; i += concurrency) {
    const batch = papers.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(paper => gradeSinglePaper(paper, answerTemplate))
    );
    results.push(...batchResults);
    completed += batch.length;
    if (onProgress) onProgress(completed, papers.length);
  }

  return results;
}

async function gradeSinglePaper(paper, answerTemplate) {
  try {
    const imageBase64List = [];
    for (const file of paper.images) {
      if (typeof file === 'string') {
        const resp = await fetch(file);
        const blob = await resp.blob();
        imageBase64List.push(await fileToBase64Public(blob));
      } else {
        imageBase64List.push(await fileToBase64Public(file));
      }
    }

    let prompt = '批改这份试卷。识别学生姓名。每题判断对错并给分。';
    if (answerTemplate) {
      prompt += `标准答案：${JSON.stringify(answerTemplate)}。对照标准答案批改。`;
    }
    prompt += ' JSON格式（只返回合法JSON）：{"studentName":"姓名","score":总分,"questions":[{"number":1,"content":"题目","userAnswer":"学生答案","correctAnswer":"正确答案","correct":true/false,"score":分值,"topic":"知识点"}]}';

    const content = await callZhipuVision(imageBase64List, prompt);
    let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    const parsed = JSON.parse(jsonStr);

    return {
      ...paper,
      studentName: parsed.studentName || paper.studentName || '未识别',
      score: parsed.score || 0,
      gradeResult: { questions: parsed.questions || [] },
      status: 'graded',
    };
  } catch (e) {
    return {
      ...paper,
      studentName: paper.studentName || '未识别',
      score: null,
      gradeResult: null,
      status: 'error',
      error: e.message,
    };
  }
}

export async function generateExamPaper(options) {
  const { subject, grade, types, difficulty, count, weakTopics } = options;

  let prompt = `作为K12出题专家，为${grade}${subject}生成一份完整试卷。`;
  prompt += `难度：${difficulty}。`;
  if (types) prompt += `题型要求：${types}。`;
  if (count) prompt += `共${count}题。`;
  if (weakTopics?.length > 0) {
    prompt += `重点针对以下薄弱知识点出题：${weakTopics.join('、')}。`;
  }
  prompt += `JSON格式（只返回合法JSON）：{"title":"试卷标题","totalScore":100,"questions":[{"number":1,"type":"选择题/填空题/简答题","content":"题目内容","options":["A. xxx","B. xxx","C. xxx","D. xxx"],"answer":"正确答案","score":分值,"topic":"知识点","explanation":"解析"}]}`;

  const messages = [
    { role: 'system', content: 'K12出题专家，生成高质量试卷。只返回JSON。' },
    { role: 'user', content: prompt },
  ];

  const content = await callZhipuAI(messages);
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return { title: `${grade}${subject}测试卷`, totalScore: 100, questions: [] };
  }
}

export async function generateTeachingSuggestion(weakTopics) {
  if (!weakTopics || weakTopics.length === 0) return '';
  const prompt = `根据以下班级薄弱知识点，给出教学调整建议（200字内）：\n${weakTopics.map(t => `${t.topic}：错误率${t.errorRate}%，典型错误：${t.typicalWrong.join('、')}`).join('\n')}`;

  const messages = [
    { role: 'system', content: '你是教学顾问，给出简洁实用的教学改进建议。' },
    { role: 'user', content: prompt },
  ];

  const content = await callZhipuAI(messages);
  return content;
}
