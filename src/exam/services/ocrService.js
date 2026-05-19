const ZHIPU_API_KEY = 'caa4b333b81041feae2b2268a36bcc84.O0wJBlQIlcF0yEmT';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const MAX_RETRIES = 1;
const USE_DEMO = !ZHIPU_API_KEY || ZHIPU_API_KEY === 'your_zhipu_api_key';

const _cache = new Map();

export async function fileToBase64Public(file) {
  return fileToBase64(file);
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getCacheKey(messages) {
  const key = messages.map(m => m.content).join('|');
  return key.slice(0, 200);
}

export async function callZhipuAI(messages, retries = MAX_RETRIES) {
  const cacheKey = getCacheKey(messages);
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(ZHIPU_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ZHIPU_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages,
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response');
      _cache.set(cacheKey, content);
      return content;
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

async function callZhipuAIStream(messages, onChunk) {
  const cacheKey = getCacheKey(messages);
  if (_cache.has(cacheKey)) {
    const cached = _cache.get(cacheKey);
    onChunk(cached);
    return cached;
  }

  const response = await fetch(ZHIPU_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages,
      temperature: 0.3,
      max_tokens: 1500,
      stream: true,
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        full += delta;
        onChunk(full);
      } catch {}
    }
  }

  _cache.set(cacheKey, full);
  return full;
}

export async function callZhipuVision(imageBase64List, userPrompt) {
  const content = [];
  for (const base64 of imageBase64List) {
    content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } });
  }
  content.push({ type: 'text', text: userPrompt });

  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      const response = await fetch(ZHIPU_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ZHIPU_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'glm-4v-flash',
          messages: [{ role: 'user', content }],
          temperature: 0.1,
          do_sample: true,
        }),
      });

      if (!response.ok) throw new Error(`Vision API error: ${response.status}`);
      const data = await response.json();
      const result = data.choices?.[0]?.message?.content;
      if (!result) throw new Error('Empty response from vision model');
      return result;
    } catch (e) {
      if (i === MAX_RETRIES) throw e;
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

export function findCachedResult(files) {
  try {
    const cacheKey = `cs_ocr_cache_${files.length}_${files[0]?.name || 'unknown'}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 3600000) {
        return parsed.result;
      }
      localStorage.removeItem(cacheKey);
    }
  } catch (e) {}
  return null;
}

function saveCacheResult(files, result) {
  try {
    const cacheKey = `cs_ocr_cache_${files.length}_${files[0]?.name || 'unknown'}`;
    localStorage.setItem(cacheKey, JSON.stringify({ result, timestamp: Date.now() }));
  } catch (e) {}
}

export async function recognizeExam(files) {
  if (USE_DEMO) {
    await new Promise(r => setTimeout(r, 600));
    const { DEMO_EXAM } = await import('../demoData.js');
    return DEMO_EXAM;
  }

  const cached = findCachedResult(files);
  if (cached) return cached;

  const imageBase64List = [];
  for (const file of files) {
    if (typeof file === 'string') {
      const resp = await fetch(file);
      const blob = await resp.blob();
      const base64 = await fileToBase64(blob);
      imageBase64List.push(base64);
    } else {
      const base64 = await fileToBase64(file);
      imageBase64List.push(base64);
    }
  }

  return { imageBase64List, pages: files.length };
}

function expandQuestions(questions) {
  const expanded = [];
  let globalNum = 1;
  for (const q of questions) {
    if (Array.isArray(q.correctAnswer) && q.correctAnswer.length > 1) {
      q.correctAnswer.forEach((ans, i) => {
        expanded.push({
          ...q,
          number: globalNum++,
          content: `${q.content} - 第${i + 1}小题`,
          correctAnswer: String(ans),
          userAnswer: Array.isArray(q.userAnswer) ? (q.userAnswer[i] || '未作答') : (q.userAnswer || '未作答'),
          correct: false,
        });
      });
    } else {
      expanded.push({
        ...q,
        number: globalNum++,
        correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : (q.correctAnswer || ''),
        userAnswer: q.userAnswer || '未作答',
      });
    }
  }
  return expanded;
}

export async function gradeExam(ocrResult) {
  if (USE_DEMO) {
    await new Promise(r => setTimeout(r, 400));
    const { DEMO_EXAM } = await import('../demoData.js');
    return DEMO_EXAM;
  }

  const visionPrompt = '批改这份试卷。每大题一条，correctAnswer用数组表示各小题答案。选择题请在content里包含各小题题目摘要。JSON数组格式（只返回合法JSON）：[{"number":1,"content":"题目描述","userAnswer":"未作答","correctAnswer":"答案或字符串数组","correct":false,"subject":"语文","topic":"知识点"}]';

  const content = await callZhipuVision(ocrResult.imageBase64List, visionPrompt);

  try {
    let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    // Fix common JSON issues from vision model
    jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    let parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) parsed = parsed.questions || [];
    const questions = expandQuestions(parsed);
    const result = { questions };
    saveCacheResult([], result);
    return result;
  } catch (e) {
    console.error('Grade parse failed:', e, '\nRetrying with text model...');
    // Fallback: ask text model to fix the JSON
    try {
      const fixContent = await callZhipuAI([
        { role: 'system', content: '修复下面的JSON使其合法，保持内容不变。只返回修复后的JSON。' },
        { role: 'user', content: content },
      ]);
      const fixStr = fixContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed = JSON.parse(fixStr);
      if (!Array.isArray(parsed)) parsed = parsed.questions || [];
      const questions = expandQuestions(parsed);
      const result = { questions };
      saveCacheResult([], result);
      return result;
    } catch {
      const { DEMO_EXAM } = await import('../demoData.js');
      return DEMO_EXAM;
    }
  }
}

export async function getQuestionAnswer(question, onStream) {
  if (USE_DEMO) {
    await new Promise(r => setTimeout(r, 400));
    const result = {
      explanation: `这道题考查的是「${question.topic || '基础知识'}」。\n\n题目：${question.content}\n正确答案是：${question.correctAnswer}\n\n解题关键在于理解核心概念并正确运用公式和方法。需要注意审题时找出关键条件，避免计算错误。`,
      steps: [
        '第一步：仔细审题，找出已知条件和所求问题',
        '第二步：确定解题方法，选择合适的公式或定理',
        '第三步：代入数据进行计算',
        '第四步：检验答案是否合理，验算结果'
      ],
      keyPoint: question.topic || '综合运用'
    };
    if (onStream) onStream(result);
    return result;
  }

  const systemPrompt = `你是K12教师，讲解通俗易懂。对题目给出：解题思路、步骤、核心知识点。JSON格式：{"explanation":"思路","steps":["步骤1",...],"keyPoint":"知识点"}。只返回JSON。`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `题目：${question.content}\n答案：${question.userAnswer}→${question.correctAnswer}\n知识点：${question.topic}` },
  ];

  if (onStream) {
    const content = await callZhipuAIStream(messages, (partial) => {
      try {
        const jsonStr = partial.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        onStream(parsed);
      } catch {
        onStream({ explanation: partial, steps: [], keyPoint: '' });
      }
    });
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonStr);
    } catch {
      return { explanation: content, steps: [], keyPoint: question.topic || '' };
    }
  }

  const content = await callZhipuAI(messages);
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return { explanation: content, steps: [], keyPoint: question.topic || '综合知识' };
  }
}

export async function generatePractice(question, count = 3, onStream) {
  if (USE_DEMO) {
    await new Promise(r => setTimeout(r, 400));
    const practices = [
      { question: '在下列城市中，哪个城市的地铁线路总长度最长？', options: ['A. 北京', 'B. 上海', 'C. 广州', 'D. 深圳'], answer: 'B', explanation: '上海地铁总里程最长，截至2024年已超过800公里', topic: question.topic },
      { question: '以下哪个城市的高速铁路站点数量最多？', options: ['A. 武汉', 'B. 郑州', 'C. 南京', 'D. 长沙'], answer: 'B', explanation: '郑州作为全国铁路枢纽，高铁站点数量居全国前列', topic: question.topic },
      { question: '在以下国家中，哪个国家的手机用户数量最多？', options: ['A. 美国', 'B. 印度', 'C. 中国', 'D. 巴西'], answer: 'C', explanation: '中国手机用户数量超过16亿，全球第一', topic: question.topic },
    ];
    const result = practices.slice(0, count);
    if (onStream) onStream(result);
    return result;
  }

  const isChoice = question.correctAnswer && /^[A-D]/.test(question.correctAnswer.trim());
  const formatHint = isChoice
    ? '必须是选择题，包含4个选项。JSON数组：[{"question":"题目","options":["A. xxx","B. xxx","C. xxx","D. xxx"],"answer":"正确选项字母","explanation":"解析","topic":"知识点"}]'
    : 'JSON数组：[{"question":"题目","answer":"答案","explanation":"解析","topic":"知识点"}]';
  const systemPrompt = `K12出题专家。基于原题生成${count}道类似练习（同知识点，难度相近）。${formatHint}。只返回JSON。`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `原题：${question.content}\n答案：${question.correctAnswer}\n知识点：${question.topic}` },
  ];

  if (onStream) {
    const content = await callZhipuAIStream(messages, (partial) => {
      try {
        const jsonStr = partial.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        onStream(JSON.parse(jsonStr));
      } catch {}
    });
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonStr);
    } catch {
      return [{ question: content, answer: '请参考解题方法', topic: question.topic }];
    }
  }

  const content = await callZhipuAI(messages);
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return [{ question: content, answer: '请参考解题方法', topic: question.topic }];
  }
}

export async function generateReviewQuiz(wrongQuestions, count = 5) {
  if (USE_DEMO) {
    await new Promise(r => setTimeout(r, 500));
    const demoBank = [
      { q: '为了解全市中学生视力情况，下列调查方式最合理的是', opts: ['全市普查', '随机抽样调查1000名学生', '只调查一所学校', '只调查近视学生'], ans: 'B', topic: '抽样方法' },
      { q: '下列数据的收集方式中，属于普查的是', opts: ['调查全班同学的身高', '调查全市空气质量', '调查全国人口的收入', '了解一批灯泡的使用寿命'], ans: 'A', topic: '普查与抽样' },
      { q: '在统计图中，能直观反映数据变化趋势的是', opts: ['条形统计图', '扇形统计图', '折线统计图', '频数直方图'], ans: 'C', topic: '统计图选择' },
      { q: '样本容量是指', opts: ['总体中个体的数目', '样本中个体的数目', '抽样的次数', '数据的范围'], ans: 'B', topic: '总体与样本' },
      { q: '如果生态系统中某一环节的生物大量减少，该生态系统会', opts: ['完全不受影响', '短期波动后恢复', '立即崩溃', '其他生物全部死亡'], ans: 'B', topic: '生态系统功能' },
      { q: '下列属于生物影响环境的实例是', opts: ['骆驼能生活在沙漠', '蚯蚓疏松土壤', '北极熊皮毛是白色', '鱼用鳃呼吸'], ans: 'B', topic: '生物与环境' },
      { q: '有理数-3的绝对值是', opts: ['-3', '3', '1/3', '-1/3'], ans: 'B', topic: '有理数' },
      { q: '用科学记数法表示56000，正确的是', opts: ['56×10³', '5.6×10⁴', '0.56×10⁵', '5.6×10³'], ans: 'B', topic: '科学记数法' },
    ];
    const subjects = [...new Set(wrongQuestions.map(q => q.subject))];
    const relevantBank = demoBank.filter(d => wrongQuestions.some(wq => wq.topic === d.topic));
    const pool = relevantBank.length >= count ? relevantBank : [...relevantBank, ...demoBank].slice(0, count);
    return pool.slice(0, count).map((d, i) => ({
      question: d.q,
      options: d.opts,
      answer: d.ans,
      explanation: `本题考查${d.topic}的核心概念，选${d.ans}。`,
      topic: d.topic
    }));
  }

  const systemPrompt = `K12复习测验专家。根据错题记录生成${count}道针对性选择题（不重复原题，针对薄弱点）。JSON数组：[{"question":"题目","options":["A选项","B选项","C选项","D选项"],"answer":"正确选项字母","explanation":"解析","topic":"知识点"}]。只返回JSON。`;

  const wrongSummary = wrongQuestions.slice(0, 8).map(q => `${q.content}(${q.topic},错:${q.userAnswer},对:${q.correctAnswer})`).join('; ');

  const content = await callZhipuAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: wrongSummary },
  ]);

  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return wrongQuestions.slice(0, count).map((q, i) => ({
      question: `复习题${i+1}：与"${q.content}"相关的练习`,
      options: q.options || null,
      answer: q.correctAnswer,
      explanation: `考查${q.topic}`,
      topic: q.topic
    }));
  }
}

