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
        <div className="ld-hero-badge">CS 文档 Agent Skill</div>
        <h1>AI 试卷批改助手</h1>
        <p className="ld-hero-subtitle">拍照上传试卷，AI 10秒出分。<br/>把"批改+讲解+练习"一步到位——标出哪些错、为什么错、怎么练。</p>
        <button className="ld-try-btn" onClick={onStart}>立即体验 Demo</button>
      </div>

      <div className="ld-container">

        {/* 解决什么问题 */}
        <div className="ld-section">
          <div className="ld-section-title">解决什么问题</div>
          <div className="ld-section-desc">家长每天都在遇到的辅导困境</div>
          <div className="ld-pain-grid">
            <div className="ld-pain-card">
              <div className="ld-pain-icon">😫</div>
              <div className="ld-pain-title">批改太累</div>
              <div className="ld-pain-desc">下班回家还得翻答案册逐题对照，碰到应用题自己都算不明白</div>
            </div>
            <div className="ld-pain-card">
              <div className="ld-pain-icon">😰</div>
              <div className="ld-pain-title">讲不清楚</div>
              <div className="ld-pain-desc">知道错了但说不清为什么错，辅导到崩溃孩子还是不理解</div>
            </div>
            <div className="ld-pain-card">
              <div className="ld-pain-icon">📚</div>
              <div className="ld-pain-title">练习低效</div>
              <div className="ld-pain-desc">买了练习册广撒网，孩子会的反复做，不会的还是不会</div>
            </div>
            <div className="ld-pain-card">
              <div className="ld-pain-icon">😤</div>
              <div className="ld-pain-title">不知薄弱点</div>
              <div className="ld-pain-desc">错题散落各处，不清楚孩子到底哪个知识点有问题</div>
            </div>
          </div>
        </div>

        <div className="ld-divider" />

        {/* 用户故事 */}
        <div className="ld-section">
          <div className="ld-section-title">一张试卷的完整旅程</div>
          <div className="ld-section-desc">跟着小明妈妈，看一张数学试卷如何被"榨干"价值</div>
          <div className="ld-story-intro">
            <p>周三晚上9点，小明妈妈下班到家。书包里翻出一张皱巴巴的数学试卷——「数据的收集与整理」单元测试，老师批了个大大的<strong>50分</strong>。</p>
            <p className="ld-story-intro-quote">"这孩子统计图选择题全对，怎么后面分析题全错了？到底哪里没搞懂？"</p>
            <p>她决定搞清楚问题出在哪，然后让小明针对性地练。以前这事儿得翻答案册对半天，今天她打开了扫描全能王。</p>
          </div>

          <div className="ld-story-timeline">
            <div className="ld-story-row left">
              <div className="ld-story-text">
                <div className="ld-story-step-title">拍照导入</div>
                <div className="ld-story-step-narr">"试卷批改在哪？"——工具箱里一眼就看到了。</div>
                <div className="ld-story-step-desc">打开扫描全能王 → 工具箱 → 试卷批改。对着试卷咔嚓两下，正反面都拍进去。AI 3秒自动识别出"七年级 · 数学 · 试卷"。</div>
                <div className="ld-story-step-feature">
                  <span className="ld-story-tag">扫描识别</span>
                  <span className="ld-story-tag">AI智能分类</span>
                </div>
              </div>
              <div className="ld-story-axis"><div className="ld-story-step-num">1</div></div>
              <div className="ld-story-img-side"><img src="/screenshots/step1-entry.png" alt="试卷入口页" /></div>
            </div>

            <div className="ld-story-row right">
              <div className="ld-story-img-side"><img src="/screenshots/step3-grading.png" alt="批改结果" /></div>
              <div className="ld-story-axis"><div className="ld-story-step-num">2</div></div>
              <div className="ld-story-text">
                <div className="ld-story-step-title">10秒出分，薄弱点现形</div>
                <div className="ld-story-step-narr">"原来是这几个知识点不行！"</div>
                <div className="ld-story-step-desc">点「智能批改」，10秒后结果出来：50分，对5错5。一看薄弱知识点——抽样方法0%、总体与样本0%、折线统计图0%。</div>
                <div className="ld-story-step-highlight">前5道基础概念全对，后5道复杂分析全错。不是不努力，是分析能力没跟上。</div>
                <div className="ld-story-step-feature">
                  <span className="ld-story-tag">视觉识别批改</span>
                  <span className="ld-story-tag">薄弱点分析</span>
                  <span className="ld-story-tag">错题归因</span>
                </div>
              </div>
            </div>

            <div className="ld-story-row left">
              <div className="ld-story-text">
                <div className="ld-story-step-title">错题一键收录</div>
                <div className="ld-story-step-narr">"先存下来，周末让他对着错题复习。"</div>
                <div className="ld-story-step-desc">点「错题全部加入错题本」，5道错题自动按知识点分类归入错题本。以后打开就能看，不用再翻纸质试卷了。</div>
                <div className="ld-story-step-feature">
                  <span className="ld-story-tag">智能错题本</span>
                  <span className="ld-story-tag">知识点分类</span>
                  <span className="ld-story-tag">永久保存</span>
                </div>
              </div>
              <div className="ld-story-axis"><div className="ld-story-step-num">3</div></div>
              <div className="ld-story-img-side placeholder" />
            </div>

            <div className="ld-story-row right">
              <div className="ld-story-img-side"><img src="/screenshots/step4-blank.png" alt="空白卷" /></div>
              <div className="ld-story-axis"><div className="ld-story-step-num">4</div></div>
              <div className="ld-story-text">
                <div className="ld-story-step-title">空白卷：擦掉答案再做一遍</div>
                <div className="ld-story-step-narr">"这张卷子他得重新做一遍，但原卷已经写满了……"</div>
                <div className="ld-story-step-desc">点「生成空白卷」，AI自动把手写内容擦除，生成干净版试卷。保存后转Word，打印出来放书桌上。周六上午，小明重做了一遍——这次得了80分。</div>
                <div className="ld-story-step-feature">
                  <span className="ld-story-tag">去手写处理</span>
                  <span className="ld-story-tag">保存/打印</span>
                  <span className="ld-story-tag">转Word</span>
                </div>
              </div>
            </div>

            <div className="ld-story-row left">
              <div className="ld-story-text">
                <div className="ld-story-step-title">举一反三：再来10道新题</div>
                <div className="ld-story-step-narr">"光做原题不够，得换几道同类型的试试。"</div>
                <div className="ld-story-step-desc">点「举一反三」，AI分析原卷的题型结构和考查知识点，生成10道全新题目。自动排版成题目卷2页 + 答案卷1页，打印出来当本周练习。</div>
                <div className="ld-story-step-highlight">以前买一本练习册30块，大部分题孩子已经会了。现在AI只出他不会的题，免费且精准。</div>
                <div className="ld-story-step-feature">
                  <span className="ld-story-tag">AI出题</span>
                  <span className="ld-story-tag">同类型变式</span>
                  <span className="ld-story-tag">自动排版</span>
                </div>
              </div>
              <div className="ld-story-axis"><div className="ld-story-step-num">5</div></div>
              <div className="ld-story-img-side"><img src="/screenshots/step5-practice.png" alt="练习卷" /></div>
            </div>

            <div className="ld-story-row right">
              <div className="ld-story-img-side"><img src="/screenshots/step6-library.png" alt="试卷库" /></div>
              <div className="ld-story-axis"><div className="ld-story-step-num">6</div></div>
              <div className="ld-story-text">
                <div className="ld-story-step-title">三天后：随时回来看</div>
                <div className="ld-story-step-narr">"上次那张卷子批改结果在哪来着？"</div>
                <div className="ld-story-step-desc">打开「我的试卷库」，所有批改过的试卷、收藏的空白卷、生成的练习卷都在一处。点击就能看结果，或者重新进入操作台继续做别的操作。</div>
                <div className="ld-story-step-feature">
                  <span className="ld-story-tag">收藏管理</span>
                  <span className="ld-story-tag">历史记录</span>
                  <span className="ld-story-tag">随时回看</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ld-story-summary">
            <p>从拿到试卷到出分、找到薄弱点、重做、出新题、存档——全程不到5分钟。</p>
            <strong>一张试卷的价值，被彻底榨干。</strong>
          </div>
        </div>

        <div className="ld-divider" />

        {/* 核心功能 */}
        <div className="ld-section">
          <div className="ld-section-title">六大核心能力</div>
          <div className="ld-section-desc">每个能力对应故事中的一个关键动作</div>
          <div className="ld-feat-grid">
            <div className="ld-feat-card">
              <div className="ld-feat-num">1</div>
              <h3>智能批改</h3>
              <p>拍照上传 → AI 10秒出分，逐题标对错，定位薄弱知识点</p>
            </div>
            <div className="ld-feat-card">
              <div className="ld-feat-num">2</div>
              <h3>深度讲解</h3>
              <p>每道错题给出解题思路、步骤拆解，家长照着就能讲明白</p>
            </div>
            <div className="ld-feat-card">
              <div className="ld-feat-num">3</div>
              <h3>举一反三</h3>
              <p>基于试卷生成同类型新题，自动分页排版，打印即用</p>
            </div>
            <div className="ld-feat-card">
              <div className="ld-feat-num">4</div>
              <h3>生成空白卷</h3>
              <p>AI去除手写痕迹，生成干净试卷让孩子重做一遍</p>
            </div>
            <div className="ld-feat-card">
              <div className="ld-feat-num">5</div>
              <h3>智能错题本</h3>
              <p>错题按知识点自动归集，追踪掌握度变化</p>
            </div>
            <div className="ld-feat-card">
              <div className="ld-feat-num">6</div>
              <h3>试卷库管理</h3>
              <p>收藏、历史记录、随时回看，所有试卷一处管理</p>
            </div>
          </div>
        </div>

        <div className="ld-divider" />

        {/* 支持学科 */}
        <div className="ld-section">
          <div className="ld-section-title">支持多学科多题型</div>
          <div className="ld-section-desc">覆盖 K12 主流考试场景</div>
          <div className="ld-tag-wrap">
            <span className="ld-tag">语文</span>
            <span className="ld-tag">数学</span>
            <span className="ld-tag">英语</span>
            <span className="ld-tag">科学</span>
            <span className="ld-tag">道德与法治</span>
            <span className="ld-tag">选择题</span>
            <span className="ld-tag">填空题</span>
            <span className="ld-tag">判断题</span>
            <span className="ld-tag">简答题</span>
            <span className="ld-tag">应用题</span>
            <span className="ld-tag">阅读理解</span>
            <span className="ld-tag">作文</span>
          </div>
        </div>

        <div className="ld-divider" />

        {/* 与CS结合 */}
        <div className="ld-section">
          <div className="ld-section-title">与扫描全能王的结合</div>
          <div className="ld-section-desc">文档 Agent Skill 的教育场景验证</div>
          <div className="ld-cs-grid">
            <div className="ld-cs-card">
              <h4>扫描即触发</h4>
              <p>CS扫描完成后，底部出现"试卷助手"入口，一键进入批改流程</p>
            </div>
            <div className="ld-cs-card">
              <h4>工具箱入口</h4>
              <p>工具箱页增加"试卷批改"技能卡片，一键直达</p>
            </div>
            <div className="ld-cs-card">
              <h4>价值延伸</h4>
              <p>从"扫描存档"到"扫描+批改+学习"，提升文档智能化深度</p>
            </div>
            <div className="ld-cs-card">
              <h4>可复制模式</h4>
              <p>同一架构可扩展到医疗报告解读、合同审查等Agent Skill</p>
            </div>
          </div>
        </div>

        <div className="ld-divider" />

        {/* 技术方案 */}
        <div className="ld-section">
          <div className="ld-section-title">技术方案</div>
          <table className="ld-tech-table">
            <thead><tr><th>模块</th><th>方案</th></tr></thead>
            <tbody>
              <tr><td>视觉识别</td><td>ZhipuAI GLM-4V-Flash 多模态模型</td></tr>
              <tr><td>文本 LLM</td><td>GLM-4-Flash（讲解/练习生成）</td></tr>
              <tr><td>前端框架</td><td>React 19 + Vite 6，单文件状态机架构</td></tr>
              <tr><td>数据存储</td><td>localStorage（Demo阶段），可扩展后端</td></tr>
              <tr><td>批改策略</td><td>单次Vision调用 + 前端题目展开，10秒内出分</td></tr>
            </tbody>
          </table>
        </div>

        {/* 状态栏 */}
        <div className="ld-status-bar">
          <div className="ld-status-item"><div className="ld-status-val">v1</div><div className="ld-status-label">当前版本</div></div>
          <div className="ld-status-item"><div className="ld-status-val">5</div><div className="ld-status-label">核心功能</div></div>
          <div className="ld-status-item"><div className="ld-status-val">5+</div><div className="ld-status-label">学科覆盖</div></div>
          <div className="ld-status-item"><div className="ld-status-val">10s</div><div className="ld-status-label">批改速度</div></div>
        </div>

      </div>

      {/* 底部 CTA */}
      <div className="ld-bottom">
        <button className="ld-try-btn" onClick={onStart}>立即体验 Demo</button>
        <p className="ld-bottom-hint">无需注册，体验完整批改流程</p>
      </div>

      <div className="ld-footer">AI 试卷批改助手 Demo v1 · 2026-05 · CS 产品团队</div>
    </div>
  );
}
