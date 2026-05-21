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

        {/* 对比：以前 vs 现在 */}
        <div className="ld-section">
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

        <div className="ld-divider" />

        {/* 用户故事 */}
        <div className="ld-section">
          <div className="ld-section-title">一个晚上的5分钟</div>
          <div className="ld-story">
            <p className="ld-story-scene">周三晚上，小雨妈妈下班到家。书包里翻出一张语文试卷——<strong>52分</strong>。</p>
            <p className="ld-story-scene">她打开扫描全能王，对着试卷拍了一张。</p>
            <div className="ld-story-beat">
              <span className="ld-story-time">10秒后</span>
              <span className="ld-story-what">4道错题标红，薄弱点：字音辨析、词义理解</span>
            </div>
            <div className="ld-story-beat">
              <span className="ld-story-time">第2分钟</span>
              <span className="ld-story-what">点"开始讲解"，把手机递给孩子。AI像家教一样一步步讲第6题</span>
            </div>
            <div className="ld-story-beat">
              <span className="ld-story-time">第4分钟</span>
              <span className="ld-story-what">孩子说"懂了"，AI出了3道同类型练习题</span>
            </div>
            <div className="ld-story-beat">
              <span className="ld-story-time">第5分钟</span>
              <span className="ld-story-what">做完练习，对了2道。错的那道自动进错题本</span>
            </div>
            <div className="ld-story-later">
              <p><strong>周六</strong>，手机提醒：本周4道错题待巩固。</p>
              <p>小雨做完，答对3道——自动移除。错题本从4道变成1道。</p>
              <p><strong>下周</strong>，新试卷拿回来。同样的知识点——这次全对了。</p>
            </div>
          </div>
        </div>

        <div className="ld-divider" />

        {/* 为什么是扫描全能王 */}
        <div className="ld-section">
          <div className="ld-section-title">为什么不用搜题App？</div>
          <div className="ld-diff-table">
            <div className="ld-diff-row header">
              <div className="ld-diff-cell"></div>
              <div className="ld-diff-cell">搜题App</div>
              <div className="ld-diff-cell highlight">扫描全能王</div>
            </div>
            <div className="ld-diff-row">
              <div className="ld-diff-cell label">模式</div>
              <div className="ld-diff-cell">拍一道题，搜答案</div>
              <div className="ld-diff-cell highlight">拍整张试卷，全局诊断</div>
            </div>
            <div className="ld-diff-row">
              <div className="ld-diff-cell label">结果</div>
              <div className="ld-diff-cell">给答案，自己看懂</div>
              <div className="ld-diff-cell highlight">逐题讲解 + 练习，练到会</div>
            </div>
            <div className="ld-diff-row">
              <div className="ld-diff-cell label">错题</div>
              <div className="ld-diff-cell">自己手动抄</div>
              <div className="ld-diff-cell highlight">自动收录、自动消化</div>
            </div>
            <div className="ld-diff-row">
              <div className="ld-diff-cell label">视角</div>
              <div className="ld-diff-cell">这道题答案是什么</div>
              <div className="ld-diff-cell highlight">孩子哪个知识点不行</div>
            </div>
            <div className="ld-diff-row">
              <div className="ld-diff-cell label">成本</div>
              <div className="ld-diff-cell">装App + 注册 + 付费</div>
              <div className="ld-diff-cell highlight">你已经装了，多按一步</div>
            </div>
          </div>
          <div className="ld-diff-summary">
            搜题App解决的是"这道题答案是什么"。<br/>
            <strong>我们解决的是"这张试卷暴露了什么问题，怎么彻底解决"。</strong>
          </div>
        </div>

        <div className="ld-divider" />

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

      {/* 底部 CTA */}
      <div className="ld-bottom">
        <button className="ld-try-btn" onClick={onStart}>立即体验</button>
        <p className="ld-bottom-hint">下次拍试卷的时候，多点一步试试</p>
      </div>
    </div>
  );
}
