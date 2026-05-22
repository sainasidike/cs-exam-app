import { useState, useEffect } from 'react';

export default function LandingPage({ onStart, showBack }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className={`landing-page ${visible ? 'visible' : ''}`}>

      {/* Hero */}
      <div className="ld-hero">
        {showBack && (
          <button className="ld-back-btn" onClick={onStart}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        <h1>拍试卷存档？<br/>不如拍完就批改。</h1>
        <p className="ld-hero-subtitle">扫描全能王 × AI<br/>10秒出分，逐题讲解，练到会为止。</p>
        <button className="ld-try-btn" onClick={onStart}>立即体验</button>
      </div>

      <div className="ld-container">

        {/* 用户真实声音 */}
        <div className="ld-section">
          <div className="ld-section-title">CS内的家长用户说</div>
          <div className="ld-persona-list">
            <div className="ld-persona-item">
              <span className="ld-persona-quote">"</span>
              <span>孩子试卷丢了或忘记带回，找其他家长拍来试卷，导入扫描全能王去除手写字迹或提升清晰度，然后打印出来让他重做。</span>
            </div>
            <div className="ld-persona-item">
              <span className="ld-persona-quote">"</span>
              <span>孩子没带作业回家，我和其他同学家长会用扫描全能王将作业扫描成电子版互相分享。</span>
            </div>
            <div className="ld-persona-item">
              <span className="ld-persona-quote">"</span>
              <span>给孩子请了一对一辅导，我需要扫描批改后的试卷做分析，用来联系家长做反馈和回访。</span>
            </div>
          </div>
          <p className="ld-persona-hook">你已经在用扫描全能王管理试卷了——现在，它能帮你更进一步。</p>
        </div>

        {/* 已经在用 AI 辅导的家长 */}
        <div className="ld-section">
          <div className="ld-section-title">还有些家长，已经在用 AI 辅导</div>
          <div className="ld-persona-list">
            <div className="ld-persona-item">
              <span className="ld-persona-quote">"</span>
              <span>平时用AI帮孩子分析错题，直接拍照上传，让 AI 讲解思路。</span>
            </div>
            <div className="ld-persona-item">
              <span className="ld-persona-quote">"</span>
              <span>平时用 AI 拍照核对答案，考前还会让 AI 出几道同类题型，给学生练习。</span>
            </div>
          </div>
          <p className="ld-persona-hook">拍照→AI讲解→出题练习，你已经在这么做了——我们把它变成一步到位。</p>
        </div>

        {/* 对比：以前 vs 现在 */}
        <div className="ld-section">
          <div className="ld-section-title">从存档到学习</div>
          <div className="ld-compare">
            <div className="ld-compare-col before">
              <div className="ld-compare-header">以前</div>
              <div className="ld-compare-item">翻答案册逐题对，半小时</div>
              <div className="ld-compare-item">知道错了，讲不明白</div>
              <div className="ld-compare-item">买练习册广撒网，会的反复做</div>
              <div className="ld-compare-item">错题抄本子，坚持不了3天</div>
              <div className="ld-compare-item">不知道哪个知识点薄弱</div>
            </div>
            <div className="ld-compare-col after">
              <div className="ld-compare-header">现在</div>
              <div className="ld-compare-item">拍一张照，10秒出分</div>
              <div className="ld-compare-item">AI逐步拆解，孩子跟着走</div>
              <div className="ld-compare-item">只练不会的，3道就够</div>
              <div className="ld-compare-item">自动收录，掌握后自动移除</div>
              <div className="ld-compare-item">知识点掌握度实时追踪</div>
            </div>
          </div>
        </div>

        {/* 用户故事 */}
        <div className="ld-section">
          <div className="ld-section-title">晚饭后的5分钟</div>
          <div className="ld-story-screenshots">
            <img src="/screenshots/story-left.png" alt="批改结果" />
            <img src="/screenshots/story-right.png" alt="AI讲解" />
          </div>
          <div className="ld-story">
            <p className="ld-story-scene">周三晚上8点，刚收拾完碗筷。儿子把数学试卷揉成一团塞在书包最底下——<strong>58分</strong>。</p>
            <p className="ld-story-scene">你想帮他看看错在哪，翻开试卷——应用题的解题步骤你也看不太懂了。</p>
            <p className="ld-story-scene">你打开扫描全能王，对着试卷拍了一张。皱巴巴的卷子自动去阴影、矫正，每个字都看得清清楚楚。</p>
            <div className="ld-story-beats">
              <div className="ld-story-beat">
                <span className="ld-story-time">10秒后</span>
                <span className="ld-story-what">5道错题自动标出，薄弱点：分数运算、行程问题</span>
              </div>
              <div className="ld-story-beat">
                <span className="ld-story-time">第2分钟</span>
                <span className="ld-story-what">你把手机递给儿子，AI正在一步步讲第3大题——比你讲得有耐心</span>
              </div>
              <div className="ld-story-beat">
                <span className="ld-story-time">第4分钟</span>
                <span className="ld-story-what">他说"哦！原来要先算速度差"，AI马上出了2道类似的练</span>
              </div>
              <div className="ld-story-beat">
                <span className="ld-story-time">第5分钟</span>
                <span className="ld-story-what">练完了，对了1道，错的自动进错题本。你全程没发火</span>
              </div>
            </div>
            <div className="ld-story-later">
              <p><strong>周六早上</strong>，手机提醒：本周5道错题待巩固。</p>
              <p>儿子花了8分钟做完，答对4道——自动移除。错题本只剩1道。</p>
              <p><strong>两周后</strong>，月考卷拿回来。行程问题——满分。你没请家教，也没吼他。</p>
            </div>
          </div>
        </div>

        {/* CS天然优势 */}
        <div className="ld-section">
          <div className="ld-section-title">扫描全能王的天然优势</div>
          <div className="ld-advantage-list">
            <div className="ld-advantage-item">
              <div className="ld-advantage-icon">📱</div>
              <div className="ld-advantage-text">
                <strong>你已经在用它拍试卷</strong>
                <span>从"拍完存档"到"拍完就学"，零额外动作</span>
              </div>
            </div>
            <div className="ld-advantage-item">
              <div className="ld-advantage-icon">✨</div>
              <div className="ld-advantage-text">
                <strong>扫描质量碾压手机直拍</strong>
                <span>去阴影、智能裁切、增强清晰度，识别准确率远高于竞品</span>
              </div>
            </div>
            <div className="ld-advantage-item">
              <div className="ld-advantage-icon">🔗</div>
              <div className="ld-advantage-text">
                <strong>不用再装任何App</strong>
                <span>一个入口，从扫描到批改到学习，完整闭环</span>
              </div>
            </div>
            <div className="ld-advantage-item">
              <div className="ld-advantage-icon">💡</div>
              <div className="ld-advantage-text">
                <strong>不是让你换工具</strong>
                <span>是让你现有的工具变更强</span>
              </div>
            </div>
          </div>
        </div>

        {/* 数据亮点 */}
        <div className="ld-stats-bar">
          <div className="ld-stats-item">
            <div className="ld-stats-val">10秒</div>
            <div className="ld-stats-label">出分速度</div>
          </div>
          <div className="ld-stats-item">
            <div className="ld-stats-val">85%</div>
            <div className="ld-stats-label">错题消化率</div>
          </div>
          <div className="ld-stats-item">
            <div className="ld-stats-val">5+</div>
            <div className="ld-stats-label">学科覆盖</div>
          </div>
        </div>

      </div>

    </div>
  );
}
