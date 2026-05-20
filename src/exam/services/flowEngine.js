import { recognizeExam, gradeExam, getQuestionAnswer, generatePractice, callZhipuAI, getCachedNotes } from './ocrService.js';
import { saveWrongQuestions, getWrongQuestions, updateTopicMastery, saveExamToLibrary, saveExamResult, getExamResult, getExamNotes, getExamWrong, saveExamMessages, saveExamNotes, saveExamWrong, saveExamProgress } from './storageService.js';
import { addNotes, extractNotesFromQuestions, enrichNotesWithAI } from './notebookService.js';

const PHASES = ['idle', 'recognize', 'grade', 'summarize', 'teach', 'practice', 'wrap_up'];

export function createFlowEngine({ onMessage, onPhaseChange, onComplete }) {
  let state = {
    phase: 'idle',
    examId: null,
    examData: null,
    gradeResult: null,
    wrongQueue: [],
    currentWrongIndex: 0,
    teachingLevel: 1,
    sessionStats: { taught: 0, practiced: 0, correct: 0, notesAdded: 0 },
    conversationHistory: [],
    paused: false,
    cancelled: false,
    lastPracticeBase: null,
  };

  function emit(msg) {
    if (state.cancelled) return;
    state.conversationHistory.push(msg);
    onMessage(msg);
    persistMessages();
  }

  function persistMessages() {
    if (state.examId) {
      const toSave = state.conversationHistory.filter(m => !m.loading);
      saveExamMessages(state.examId, toSave);
    }
  }

  function setPhase(phase) {
    state.phase = phase;
    onPhaseChange?.(phase);
  }

  async function start(files, examId, cachedResult) {
    state.cancelled = false;
    state.paused = false;
    state.examId = examId || `exam_${Date.now()}`;
    state.conversationHistory = [];
    state.sessionStats = { taught: 0, practiced: 0, correct: 0, notesAdded: 0 };
    state.currentWrongIndex = 0;
    state.wrongQueue = [];

    if (cachedResult) {
      setPhase('summarize');
      emit({ type: 'ai_text', content: '正在分析试卷...', phase: 'summarize', loading: true });
      state.gradeResult = cachedResult;
      await runSummarize(cachedResult);
    } else if (files && files.length > 0) {
      setPhase('recognize');
      emit({ type: 'ai_text', content: '正在识别试卷内容...', phase: 'recognize', loading: true });
      await runRecognize(files);
    } else {
      emit({ type: 'ai_error', content: '没有可分析的试卷。请返回扫描一份新试卷，或选择一份已有试卷。' });
    }
  }

  async function runRecognize(files) {
    try {
      const ocrResult = await recognizeExam(files);
      state.examData = ocrResult;

      if (state.cancelled) return;
      emit({ type: 'ai_text', content: '正在批改...', phase: 'grade', loading: true });
      setPhase('grade');
      await runGrade(ocrResult);
    } catch (e) {
      emit({ type: 'ai_error', content: '识别失败，请重新拍照。建议平放试卷，光线充足。', error: e.message });
    }
  }

  async function runGrade(ocrResult) {
    try {
      const result = await gradeExam(ocrResult);
      state.gradeResult = result;

      if (state.cancelled) return;
      setPhase('summarize');
      await runSummarize(result);
    } catch (e) {
      emit({ type: 'ai_error', content: '批改出错，请重试。', error: e.message });
    }
  }

  async function runSummarize(result) {
    await new Promise(r => setTimeout(r, 600));
    if (state.cancelled) return;
    const questions = result.questions || [];
    const total = questions.length;
    const correct = questions.filter(q => q.correct).length;
    const wrong = questions.filter(q => !q.correct);
    const scorePercent = total > 0 ? Math.round(correct / total * 100) : 0;

    const topicMap = {};
    wrong.forEach(q => {
      const t = q.topic || '未分类';
      topicMap[t] = (topicMap[t] || 0) + 1;
    });
    const weakTopics = Object.entries(topicMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const allTopics = [...new Set(questions.map(q => q.topic).filter(Boolean))];

    const rawNotes = extractNotesFromQuestions(questions);
    let notes;
    const cachedNotes = result._cachedNotes || getCachedNotes(questions);
    if (cachedNotes) {
      notes = rawNotes.map(n => {
        const { _questions, ...cleanNote } = n;
        const cached = cachedNotes[n.topic];
        return { ...cleanNote, content: cached || `${n.topic}的核心概念与应用方法` };
      });
    } else {
      notes = await enrichNotesWithAI(rawNotes);
    }
    addNotes(notes);
    state.sessionStats.notesAdded = notes.length;

    const examId = state.examId;

    if (notes.length > 0) {
      saveExamNotes(examId, notes);
    }

    if (wrong.length > 0) {
      const wrongWithMeta = wrong.map(q => ({
        ...q,
        id: Date.now() + Math.random(),
        addedAt: new Date().toISOString(),
      }));
      saveExamWrong(examId, wrongWithMeta);

      const existingWrong = getWrongQuestions();
      const existingIds = new Set(existingWrong.map(q => q.content));
      const newWrong = wrongWithMeta.filter(q => !existingIds.has(q.content));
      if (newWrong.length > 0) {
        saveWrongQuestions([...newWrong, ...existingWrong]);
      }
    }

    state.wrongQueue = wrong;
    state.currentWrongIndex = 0;

    const subject = questions[0]?.subject || '综合';

    const examRecordId = state.examId || `exam_${Date.now()}`;
    saveExamToLibrary({
      id: examRecordId,
      title: result.title || `${subject}试卷`,
      subject,
      total,
      correct,
      wrong: wrong.length,
      score: scorePercent,
      gradedAt: new Date().toISOString().split('T')[0],
      lastStudied: new Date().toISOString().split('T')[0],
    });
    saveExamResult(examRecordId, result);

    emit({
      type: 'ai_summary',
      data: {
        subject,
        total,
        correct,
        wrong: wrong.length,
        scorePercent,
        weakTopics,
        allTopics,
        notesAdded: notes.length,
        wrongAdded: wrong.length,
      },
      phase: 'summarize',
    });

    if (wrong.length === 0) {
      emit({ type: 'ai_text', content: '全部正确！你很棒！要不要试试根据考点出几道挑战题？', phase: 'summarize' });
      emit({ type: 'ai_action', actions: [
        { id: 'challenge', label: '来几道挑战题' },
        { id: 'done', label: '今天就到这' },
      ], phase: 'summarize' });
    } else {
      emit({ type: 'ai_text', content: `检测到 ${wrong.length} 道错题，我来逐题给你讲解。准备好了吗？`, phase: 'summarize' });
      emit({ type: 'ai_action', actions: [
        { id: 'start_teach', label: '开始讲解' },
        { id: 'skip_to_practice', label: '直接练习' },
      ], phase: 'summarize' });
    }
  }

  async function runTeach() {
    if (state.currentWrongIndex >= state.wrongQueue.length) {
      await runWrapUp();
      return;
    }

    setPhase('teach');
    const question = state.wrongQueue[state.currentWrongIndex];

    emit({
      type: 'ai_teach_intro',
      content: `错题 ${state.currentWrongIndex + 1}/${state.wrongQueue.length}`,
      question,
      phase: 'teach',
    });

    emit({ type: 'ai_text', content: '正在生成解析...', phase: 'teach', loading: true });

    try {
      const answer = await getQuestionAnswer(question);
      emit({
        type: 'ai_explanation',
        question,
        explanation: answer.explanation,
        steps: answer.steps,
        keyPoint: answer.keyPoint,
        phase: 'teach',
      });

      state.sessionStats.taught++;

      emit({ type: 'ai_action', actions: [
        { id: 'understood', label: '我懂了，做练习' },
        { id: 'ask_more', label: '还有疑问' },
        { id: 'next_question', label: '跳过，下一题' },
      ], phase: 'teach' });
    } catch (e) {
      emit({ type: 'ai_text', content: '解析生成失败，跳到下一题。', phase: 'teach' });
      state.currentWrongIndex++;
      await runTeach();
    }
  }

  async function runPractice(baseQuestion) {
    setPhase('practice');
    const question = baseQuestion || state.lastPracticeBase || state.wrongQueue[state.currentWrongIndex];

    if (!question) {
      emit({ type: 'ai_text', content: '没有可用的题目来生成练习。', phase: 'practice' });
      await runWrapUp();
      return;
    }

    state.lastPracticeBase = question;
    emit({ type: 'ai_text', content: '正在生成练习题...', phase: 'practice', loading: true });

    try {
      const practices = await generatePractice(question, 1);
      const pq = practices[0];
      if (pq) {
        emit({
          type: 'ai_practice',
          question: pq,
          phase: 'practice',
        });
      } else {
        emit({ type: 'ai_text', content: '暂时没有找到合适的练习题，我们看下一道错题。', phase: 'practice' });
        state.currentWrongIndex++;
        await runTeach();
      }
    } catch (e) {
      emit({ type: 'ai_text', content: '练习题生成失败，继续下一题。', phase: 'practice' });
      state.currentWrongIndex++;
      await runTeach();
    }
  }

  async function runWrapUp() {
    setPhase('wrap_up');
    const { taught, practiced, correct, notesAdded } = state.sessionStats;
    const wrongCount = state.wrongQueue.length;

    emit({
      type: 'ai_wrap_up',
      data: {
        taught,
        practiced,
        correct,
        wrongCount,
        notesAdded,
        weakTopics: [...new Set(state.wrongQueue.map(q => q.topic).filter(Boolean))].slice(0, 3),
      },
      phase: 'wrap_up',
    });

    emit({ type: 'ai_text', content: '今天的学习结束了！明天记得复习薄弱知识点。', phase: 'wrap_up' });
    emit({ type: 'ai_action', actions: [
      { id: 'review_wrong', label: '查看错题' },
      { id: 'done_exit', label: '返回主页' },
    ], phase: 'wrap_up' });
    onComplete?.(state.sessionStats);
  }

  async function handleUserAction(actionId, data) {
    if (state.cancelled) return;

    switch (actionId) {
      case 'start_teach':
        await runTeach();
        break;
      case 'skip_to_practice':
        await runPractice();
        break;
      case 'understood':
        await runPractice();
        break;
      case 'ask_more':
        emit({ type: 'ai_text', content: '请告诉我你哪一步不理解？', phase: state.phase });
        emit({ type: 'ai_input_needed', placeholder: '描述你的疑问...', phase: state.phase });
        break;
      case 'next_question':
        state.currentWrongIndex++;
        await runTeach();
        break;
      case 'practice_answer':
        await handlePracticeAnswer(data);
        break;
      case 'practice_next':
        state.currentWrongIndex++;
        await runTeach();
        break;
      case 'practice_retry':
        await runPractice(state.lastPracticeBase);
        break;
      case 'challenge':
        await runChallengeMode();
        break;
      case 'done':
        await runWrapUp();
        break;
      case 'review_wrong':
      case 'done_exit':
        break;
      default:
        break;
    }
  }

  async function handleUserMessage(text) {
    if (state.cancelled) return;
    emit({ type: 'user_text', content: text });

    const question = state.wrongQueue[state.currentWrongIndex] || state.lastPracticeBase || state.wrongQueue[0];
    const currentPhase = state.phase;

    let systemContent;
    if (question) {
      systemContent = `你是K12教师。学生正在学习这道题：${question.content}，正确答案：${question.correctAnswer}，知识点：${question.topic || '综合'}。请用通俗易懂的语言回答学生的疑问。直接回答，不要用JSON格式。`;
    } else {
      systemContent = '你是K12教师。请用通俗易懂的语言回答学生的学习疑问。直接回答，不要用JSON格式。';
    }

    emit({ type: 'ai_text', content: '让我来解答你的疑问...', phase: currentPhase, loading: true });

    try {
      const messages = [
        { role: 'system', content: systemContent },
        { role: 'user', content: text },
      ];
      const response = await callZhipuAI(messages);
      emit({ type: 'ai_text', content: response, phase: currentPhase });

      if (currentPhase === 'teach') {
        emit({ type: 'ai_action', actions: [
          { id: 'understood', label: '我懂了，做练习' },
          { id: 'next_question', label: '下一题' },
        ], phase: currentPhase });
      }
      emit({ type: 'ai_input_needed', placeholder: '继续提问...', phase: currentPhase });
    } catch (e) {
      emit({ type: 'ai_text', content: '回答生成失败，请重试。', phase: currentPhase });
      emit({ type: 'ai_input_needed', placeholder: '重新提问...', phase: currentPhase });
    }
  }

  async function handlePracticeAnswer(data) {
    const { selected, correct, question } = data;
    state.sessionStats.practiced++;
    if (correct) {
      state.sessionStats.correct++;
      updateTopicMastery(question.topic || '综合', true);
      emit({ type: 'ai_feedback', correct: true, content: '回答正确！很好！', phase: 'practice' });
    } else {
      updateTopicMastery(question.topic || '综合', false);
      emit({ type: 'ai_feedback', correct: false, content: `回答错误。正确答案是 ${question.answer}。${question.explanation || ''}`, phase: 'practice' });
    }

    emit({ type: 'ai_action', actions: [
      { id: 'practice_next', label: '下一题' },
      { id: 'practice_retry', label: '再来一道类似的' },
      { id: 'ask_more', label: '还有疑问' },
    ], phase: 'practice' });
    emit({ type: 'ai_input_needed', placeholder: '对这道练习题有疑问？直接输入...', phase: 'practice' });
  }

  async function runChallengeMode() {
    setPhase('practice');
    const questions = state.gradeResult?.questions || [];
    const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))];
    const topicStr = topics.slice(0, 3).join('、');

    emit({ type: 'ai_text', content: `根据考点「${topicStr}」出一道挑战题：`, phase: 'practice' });

    try {
      const baseQ = questions[0] || { content: '综合练习', topic: topics[0], correctAnswer: '' };
      state.lastPracticeBase = baseQ;
      const practices = await generatePractice(baseQ, 1);
      const pq = practices[0];
      if (pq) {
        emit({ type: 'ai_practice', question: pq, phase: 'practice' });
      }
    } catch (e) {
      emit({ type: 'ai_text', content: '挑战题生成失败。', phase: 'practice' });
      await runWrapUp();
    }
  }

  function restore(examId, gradeResult, savedMessages) {
    state.cancelled = false;
    state.paused = false;
    state.examId = examId;
    state.conversationHistory = savedMessages ? [...savedMessages] : [];

    const result = gradeResult || getExamResult(examId);
    state.gradeResult = result;

    const msgs = savedMessages || [];
    const teachCount = msgs.filter(m => m.type === 'ai_teach_intro').length;
    const feedbackCount = msgs.filter(m => m.type === 'ai_feedback').length;
    state.sessionStats.taught = teachCount;
    state.sessionStats.practiced = feedbackCount;
    state.sessionStats.correct = msgs.filter(m => m.type === 'ai_feedback' && m.correct).length;

    if (result) {
      const questions = result.questions || [];
      state.wrongQueue = questions.filter(q => !q.correct);
      if (teachCount === 0) {
        state.currentWrongIndex = 0;
      } else {
        state.currentWrongIndex = Math.min(teachCount - 1, Math.max(state.wrongQueue.length - 1, 0));
      }

      const existingNotes = getExamNotes(examId);
      if (existingNotes.length === 0 && questions.length > 0) {
        const rawNotes = extractNotesFromQuestions(questions);
        const cachedNotes = result._cachedNotes || getCachedNotes(questions);
        if (cachedNotes) {
          const notes = rawNotes.map(n => {
            const { _questions, ...cleanNote } = n;
            return { ...cleanNote, content: cachedNotes[n.topic] || `${n.topic}的核心概念` };
          });
          if (notes.length > 0) saveExamNotes(examId, notes);
          addNotes(notes);
        }
      }

      const existingWrong = getExamWrong(examId);
      if (existingWrong.length === 0 && state.wrongQueue.length > 0) {
        const wrongWithMeta = state.wrongQueue.map(q => ({
          ...q,
          id: Date.now() + Math.random(),
          addedAt: new Date().toISOString(),
        }));
        saveExamWrong(examId, wrongWithMeta);
      }
    }

    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.phase === 'teach') setPhase('teach');
    else if (lastMsg?.phase === 'practice') setPhase('practice');
    else if (lastMsg?.phase === 'wrap_up') setPhase('wrap_up');
    else setPhase('summarize');
  }

  function cancel() {
    state.cancelled = true;
    setPhase('idle');
  }

  function getState() {
    return { ...state };
  }

  return {
    start,
    restore,
    handleUserAction,
    handleUserMessage,
    cancel,
    getState,
  };
}
