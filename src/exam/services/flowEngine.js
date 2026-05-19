import { recognizeExam, gradeExam, getQuestionAnswer, generatePractice, callZhipuAI } from './ocrService.js';
import { saveWrongQuestions, getWrongQuestions, updateTopicMastery } from './storageService.js';
import { addNotes, extractNotesFromQuestions } from './notebookService.js';

const PHASES = ['idle', 'recognize', 'grade', 'summarize', 'teach', 'practice', 'wrap_up'];

export function createFlowEngine({ onMessage, onPhaseChange, onComplete }) {
  let state = {
    phase: 'idle',
    examData: null,
    gradeResult: null,
    wrongQueue: [],
    currentWrongIndex: 0,
    teachingLevel: 1,
    sessionStats: { taught: 0, practiced: 0, correct: 0, notesAdded: 0 },
    conversationHistory: [],
    paused: false,
    cancelled: false,
  };

  function emit(msg) {
    if (state.cancelled) return;
    state.conversationHistory.push(msg);
    onMessage(msg);
  }

  function setPhase(phase) {
    state.phase = phase;
    onPhaseChange?.(phase);
  }

  async function start(files, cachedExamId, cachedResult) {
    state.cancelled = false;
    state.paused = false;

    if (cachedResult) {
      state.gradeResult = cachedResult;
      setPhase('summarize');
      await runSummarize(cachedResult);
    } else if (files && files.length > 0) {
      setPhase('recognize');
      await runRecognize(files);
    }
  }

  async function runRecognize(files) {
    emit({ type: 'ai_text', content: '正在识别试卷...', phase: 'recognize' });
    emit({ type: 'ai_progress', label: '识别中', progress: 0, total: 100, phase: 'recognize' });

    try {
      const ocrResult = await recognizeExam(files);
      state.examData = ocrResult;

      emit({ type: 'ai_progress', label: '识别中', progress: 100, total: 100, phase: 'recognize' });

      const pageCount = files.length;
      emit({ type: 'ai_text', content: `识别完成！检测到 ${pageCount} 页试卷内容。`, phase: 'recognize' });

      if (state.cancelled) return;
      setPhase('grade');
      await runGrade(ocrResult);
    } catch (e) {
      emit({ type: 'ai_error', content: '识别失败，请重新拍照。建议平放试卷，光线充足。', error: e.message });
    }
  }

  async function runGrade(ocrResult) {
    emit({ type: 'ai_text', content: '开始批改...', phase: 'grade' });
    emit({ type: 'ai_progress', label: '批改中', progress: 0, total: 100, phase: 'grade' });

    try {
      const result = await gradeExam(ocrResult);
      state.gradeResult = result;

      emit({ type: 'ai_progress', label: '批改中', progress: 100, total: 100, phase: 'grade' });

      if (state.cancelled) return;
      setPhase('summarize');
      await runSummarize(result);
    } catch (e) {
      emit({ type: 'ai_error', content: '批改出错，请重试。', error: e.message });
    }
  }

  async function runSummarize(result) {
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

    const notes = extractNotesFromQuestions(questions);
    addNotes(notes);
    state.sessionStats.notesAdded = notes.length;

    if (wrong.length > 0) {
      const existingWrong = getWrongQuestions();
      const existingIds = new Set(existingWrong.map(q => q.content));
      const newWrong = wrong.filter(q => !existingIds.has(q.content)).map(q => ({
        ...q,
        id: Date.now() + Math.random(),
        addedAt: new Date().toISOString(),
      }));
      if (newWrong.length > 0) {
        saveWrongQuestions([...newWrong, ...existingWrong]);
      }
    }

    state.wrongQueue = wrong;
    state.currentWrongIndex = 0;

    const subject = questions[0]?.subject || '综合';

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
        { id: 'done', label: '稍后再看' },
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

  async function runPractice() {
    setPhase('practice');
    const question = state.wrongQueue[state.currentWrongIndex];

    emit({ type: 'ai_text', content: '来做一道类似的练习：', phase: 'practice' });

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
        emit({ type: 'ai_text', content: '请告诉我你哪一步不理解？', phase: 'teach' });
        emit({ type: 'ai_input_needed', placeholder: '描述你的疑问...', phase: 'teach' });
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
        state.sessionStats.practiced++;
        await runTeach();
        break;
      case 'practice_retry':
        await runPractice();
        break;
      case 'challenge':
        await runChallengeMode();
        break;
      case 'done':
        await runWrapUp();
        break;
      default:
        break;
    }
  }

  async function handleUserMessage(text) {
    if (state.cancelled) return;
    emit({ type: 'user_text', content: text });

    if (state.phase === 'teach') {
      const question = state.wrongQueue[state.currentWrongIndex];
      emit({ type: 'ai_text', content: '让我来解答你的疑问...', phase: 'teach', loading: true });

      try {
        const messages = [
          { role: 'system', content: `你是K12教师。学生正在做这道题：${question.content}，正确答案：${question.correctAnswer}。请用通俗易懂的语言回答学生的疑问。直接回答，不要用JSON格式。` },
          { role: 'user', content: text },
        ];
        const response = await callZhipuAI(messages);
        emit({ type: 'ai_text', content: response, phase: 'teach' });
        emit({ type: 'ai_action', actions: [
          { id: 'understood', label: '我懂了，做练习' },
          { id: 'ask_more', label: '继续提问' },
          { id: 'next_question', label: '下一题' },
        ], phase: 'teach' });
      } catch (e) {
        emit({ type: 'ai_text', content: '回答生成失败，请重试。', phase: 'teach' });
      }
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
    ], phase: 'practice' });
  }

  async function runChallengeMode() {
    setPhase('practice');
    const questions = state.gradeResult?.questions || [];
    const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))];
    const topicStr = topics.slice(0, 3).join('、');

    emit({ type: 'ai_text', content: `根据考点「${topicStr}」出一道挑战题：`, phase: 'practice' });

    try {
      const baseQ = questions[0] || { content: '综合练习', topic: topics[0], correctAnswer: '' };
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

  function cancel() {
    state.cancelled = true;
    setPhase('idle');
  }

  function getState() {
    return { ...state };
  }

  return {
    start,
    handleUserAction,
    handleUserMessage,
    cancel,
    getState,
  };
}
