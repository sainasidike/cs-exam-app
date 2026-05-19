export const DEMO_EXAM = {
  questions: [
    { number: 1, content: '收集数据后，在描述数据时，为"显示部分在总体中所占的百分比"，适宜采用', correct: true, userAnswer: 'B', correctAnswer: 'B', subject: '数学', topic: '统计图选择' },
    { number: 2, content: '为了了解某地区老年人的健康状况，分别做了4种不同的抽样调查，你认为抽样比较合理的是', correct: false, userAnswer: 'B', correctAnswer: 'D', subject: '数学', topic: '抽样方法' },
    { number: 3, content: '要调查下列问题，适合采用全面调查(普查)的是', correct: true, userAnswer: 'C', correctAnswer: 'C', subject: '数学', topic: '普查与抽样' },
    { number: 4, content: '为了解某校1500名学生的体重情况，从中抽取了100名学生的体重，下面说法正确的是', correct: false, userAnswer: 'A', correctAnswer: 'D', subject: '数学', topic: '总体与样本' },
    { number: 5, content: '如图是一所学校对学生上学方式进行调查后，根据调查结果绘制了一个不完整的统计图，其中"其他"部分所对的圆心角度数是36°，则"步行"部分所占的百分比是', correct: true, userAnswer: 'C', correctAnswer: 'C', subject: '数学', topic: '扇形统计图' },
    { number: 6, content: '（2023·杭州萧山期末）小明、小聪参加了100米跑的5期集训，每期集训结束时进行测试，根据测试成绩绘制成如图折线统计图，则下列判断正确的是', correct: false, userAnswer: 'A', correctAnswer: 'D', subject: '数学', topic: '折线统计图' },
    { number: 7, content: '（2024·北京东城校级期中）下列调查方式中，你认为最合适的是', correct: true, userAnswer: 'B', correctAnswer: 'B', subject: '数学', topic: '调查方式选择' },
    { number: 8, content: '希望中学七年级四个班的学生去阳光公园义务植树，已知在每小时内，5个女生种3棵树，3个男生种5棵树，各班学生人数如图所示，则植树最多的班级是', correct: false, userAnswer: 'C', correctAnswer: 'D', subject: '数学', topic: '统计图应用' },
    { number: 9, content: '观察如图所示的频数直方图，其中组界为99.5~124.5这一组的频数为', correct: true, userAnswer: 'C', correctAnswer: 'C', subject: '数学', topic: '频数直方图' },
    { number: 10, content: '随着初中学业水平考试的临近，某校连续四个月开展了学科知识模拟测试，并将测试成绩整理，绘制了如图所示的统计图，下列四个结论不正确的是', correct: false, userAnswer: 'B', correctAnswer: 'C', subject: '数学', topic: '统计图综合分析' },
  ]
};

export const DEMO_HISTORY = [
  { title: '七年级数学·数据的收集与整理', score: 60, date: '2026-05-11', total: 10, correct: 6 },
  { title: '七年级数学·几何初步', score: 85, date: '2026-05-08', total: 10, correct: 8 },
  { title: '七年级数学·一元一次方程', score: 90, date: '2026-05-05', total: 10, correct: 9 },
  { title: '七年级数学·有理数混合运算', score: 72, date: '2026-05-03', total: 10, correct: 7 },
  { title: '七年级语文·古诗文默写', score: 78, date: '2026-05-01', total: 8, correct: 6 },
  { title: '七年级数学·绝对值与相反数', score: 65, date: '2026-04-29', total: 10, correct: 6 },
  { title: '七年级英语·Unit 5测试', score: 82, date: '2026-04-28', total: 12, correct: 10 },
  { title: '七年级数学·整式加减', score: 55, date: '2026-04-25', total: 10, correct: 5 },
];

export const DEMO_WRONG_QUESTIONS = [
  { id: 1, content: '为了了解某地区老年人的健康状况，抽样比较合理的是', userAnswer: 'B', correctAnswer: 'D', subject: '数学', topic: '抽样方法', addedAt: '2026-05-11T10:00:00Z',
    options: ['在公园调查跳广场舞的老年人', '在医院调查看病的老年人', '在养老院调查住院的老年人', '利用派出所户籍信息随机调查'] },
  { id: 2, content: '为了解某校1500名学生的体重情况，从中抽取了100名学生的体重，说法正确的是', userAnswer: 'A', correctAnswer: 'D', subject: '数学', topic: '总体与样本', addedAt: '2026-05-11T10:00:00Z',
    options: ['1500名学生是总体', '每个学生是个体', '100名学生是样本', '样本容量为100'] },
  { id: 3, content: '小明、小聪100米跑5期集训折线统计图，判断正确的是', userAnswer: 'A', correctAnswer: 'D', subject: '数学', topic: '折线统计图', addedAt: '2026-05-11T10:00:00Z',
    options: ['小明成绩一直比小聪好', '小聪的成绩波动更大', '第3期两人成绩相同', '小明的成绩越来越稳定'] },
  { id: 4, content: '七年级四个班义务植树，植树最多的班级是', userAnswer: 'C', correctAnswer: 'D', subject: '数学', topic: '统计图应用', addedAt: '2026-05-11T10:00:00Z',
    options: ['一班', '二班', '三班', '四班'] },
  { id: 5, content: '某校连续四个月模拟测试统计图，下列结论不正确的是', userAnswer: 'B', correctAnswer: 'C', subject: '数学', topic: '统计图综合分析', addedAt: '2026-05-11T10:00:00Z',
    options: ['数学成绩逐月提高', '四月份语文成绩最低', '英语成绩始终高于语文', '数学进步幅度最大'] },
];

export const DEMO_TOPIC_MASTERY = {
  '统计图选择': { mastery: 85, attempts: 4 },
  '抽样方法': { mastery: 40, attempts: 3 },
  '普查与抽样': { mastery: 80, attempts: 5 },
  '总体与样本': { mastery: 35, attempts: 2 },
  '扇形统计图': { mastery: 88, attempts: 4 },
  '折线统计图': { mastery: 42, attempts: 3 },
  '调查方式选择': { mastery: 78, attempts: 4 },
  '统计图应用': { mastery: 38, attempts: 2 },
  '频数直方图': { mastery: 75, attempts: 3 },
  '统计图综合分析': { mastery: 30, attempts: 2 },
};

export const DEMO_MASTERY_HISTORY = {
  '抽样方法': [
    { date: '2026-04-28', value: 50 }, { date: '2026-05-01', value: 45 },
    { date: '2026-05-05', value: 35 }, { date: '2026-05-11', value: 40 },
  ],
  '总体与样本': [
    { date: '2026-05-01', value: 50 }, { date: '2026-05-08', value: 40 },
    { date: '2026-05-11', value: 35 },
  ],
  '折线统计图': [
    { date: '2026-04-25', value: 30 }, { date: '2026-05-01', value: 35 },
    { date: '2026-05-05', value: 38 }, { date: '2026-05-11', value: 42 },
  ],
  '统计图选择': [
    { date: '2026-04-25', value: 60 }, { date: '2026-05-01', value: 70 },
    { date: '2026-05-08', value: 80 }, { date: '2026-05-11', value: 85 },
  ],
  '普查与抽样': [
    { date: '2026-04-28', value: 65 }, { date: '2026-05-05', value: 75 },
    { date: '2026-05-11', value: 80 },
  ],
};

export const DEMO_REDO_LOG = [
  { date: '2026-05-05', total: 5, mastered: 3 },
  { date: '2026-05-08', total: 4, mastered: 2 },
  { date: '2026-05-11', total: 6, mastered: 4 },
];
