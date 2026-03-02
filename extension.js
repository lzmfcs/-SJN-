// === 冬雪SJN渲染器 v1.1 for SillyTavern ===
// 作者：沈嘉南 | 适配：SillyTavern v1.6+
// 功能：前端渲染增强（圆角/模糊/光晕/动画）、消息管理、面板拖拽

class DongxueRendererExtension extends TavernExtension {
  constructor() {
    super();
    this.name = '❄️ 冬雪SJN渲染器';
    this.version = '1.1.0';
    this.author = '沈嘉南';
    this.id = 'dxxrq';
    this.panel = null;
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;

    // 面板 HTML（内联，避免外部依赖）
    this.panelHtml = `
      <div class="tool-header">
        <span class="tool-title">❄️ 冬雪渲染器</span>
        <button class="tool-close">×</button>
      </div>

      <div class="panel-content">
        <div class="group">界面美化</div>
        <div class="item"><label>面板透明度</label><input type="range" min="30" max="100" value="85" id="opacity"><span id="val-opacity">85%</span></div>
        <div class="item"><label>毛玻璃强度</label><input type="range" min="0" max="20" value="12" id="blur-strength"><span id="val-blur">12px</span></div>
        <div class="item"><label>圆角强度</label><input type="range" min="0" max="30" value="16" id="round"><span id="val-round">16px</span></div>

        <div class="group">特效开关</div>
        <div class="item"><label>动画效果</label><input type="checkbox" id="anim" checked></div>
        <div class="item"><label>光晕特效</label><input type="checkbox" id="light" checked></div>
        <div class="item"><label>背景模糊</label><input type="checkbox" id="bg-blur" checked></div>
        <div class="item"><label>自动滚屏</label><input type="checkbox" id="autoscroll" checked></div>

        <div class="group">快捷工具</div>
        <div class="item-row">
          <button id="btn-clear">清空聊天</button>
          <button id="btn-copy">复制对话</button>
          <button id="btn-reload">重载界面</button>
        </div>
      </div>
    `;
  }

  // ✅ SillyTavern 要求：onLoad 必须存在
  onLoad() {
    console.log('[冬雪渲染器] 已加载');
    this.createPanel();

    // 🔹 添加右下角快捷按钮（关键！解决“找不到入口”问题）
    this.addFloatingButton();
  }

  // ✅ 创建面板（确保 ID 正确 + 默认显示）
  createPanel() {
    if (document.getElementById(this.id)) return;

    this.panel = document.createElement('div');
    this.panel.id = this.id;
    this.panel.innerHTML = this.panelHtml;
    this.panel.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 360px;
      max-height: 90vh;
      overflow-y: auto;
      background: rgba(30, 30, 45, 0.85);
      border-radius: 16px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      font-family: 'Segoe UI', sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 99999;
      padding: 12px;
      display: block;
    `;
    document.body.appendChild(this.panel);

    this.initDrag();
    this.bindEvents();
  }

  // ✅ 拖拽功能（原生实现）
  initDrag() {
    const header = this.panel.querySelector('.tool-header');
    const closeBtn = this.panel.querySelector('.tool-close');

    header.onmousedown = (e) => {
      this.dragging = true;
      this.offsetX = e.clientX - this.panel.offsetLeft;
      this.offsetY = e.clientY - this.panel.offsetTop;
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
      e.preventDefault();
    };

    closeBtn.onclick = () => {
      this.panel.style.display = 'none';
      this.onUnload(); // 清理
    };
  }

  onMouseMove = (e) => {
    if (!this.dragging) return;
    this.panel.style.left = `${e.clientX - this.offsetX}px`;
    this.panel.style.top = `${e.clientY - this.offsetY}px`;
  };

  onMouseUp = () => {
    this.dragging = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  // ✅ 绑定所有事件（无 $ 依赖！）
  bindEvents() {
    const ctx = getContext(); // SillyTavern 提供的上下文

    // 透明度
    const opacityEl = document.getElementById('opacity');
    const valOpacityEl = document.getElementById('val-opacity');
    opacityEl.oninput = () => {
      const v = opacityEl.value;
      valOpacityEl.textContent = `${v}%`;
      this.panel.style.background = `rgba(30, 30, 45, ${v / 100 * 0.85})`;
    };

    // 模糊
    const blurEl = document.getElementById('blur-strength');
    const valBlurEl = document.getElementById('val-blur');
    blurEl.oninput = () => {
      const v = blurEl.value;
      valBlurEl.textContent = `${v}px`;
      this.panel.style.backdropFilter = `blur(${v}px)`;
      this.panel.style.webkitBackdropFilter = `blur(${v}px)`;
    };

    // 圆角
    const roundEl = document.getElementById('round');
    const valRoundEl = document.getElementById('val-round');
    roundEl.oninput = () => {
      const v = roundEl.value;
      valRoundEl.textContent = `${v}px`;
      this.panel.style.borderRadius = `${v}px`;
    };

    // 特效开关
    const toggleClass = (elId, className) => {
      const el = document.getElementById(elId);
      el.onchange = () => {
        document.body.classList.toggle(className, el.checked);
      };
    };

    toggleClass('anim', 'no-anim');
    toggleClass('light', 'no-light');
    toggleClass('bg-blur', 'no-bg-blur');
    toggleClass('autoscroll', 'no-autoscroll'); // （你可自行实现滚动逻辑）

    // 快捷工具
    document.getElementById('btn-clear').onclick = () => {
      if (confirm('确定清空当前聊天记录？')) {
        ctx.chat = [];
        ctx.displayChat();
      }
    };

    document.getElementById('btn-copy').onclick = () => {
      const text = ctx.chat.map(msg => `${msg.name}: ${msg.mes}`).join('\n\n');
      navigator.clipboard.writeText(text).then(() => {
        toastr?.success?.('已复制全部对话到剪贴板') || alert('已复制');
      });
    };

    document.getElementById('btn-reload').onclick = () => location.reload();
  }

  // ✅ 添加右下角浮动按钮（用户必点入口！）
  addFloatingButton() {
    const btn = document.createElement('button');
    btn.id = 'dxxrq-launch-btn';
    btn.textContent = '❄️';
    btn.title = '打开冬雪渲染器设置';
    btn.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      width: 44px; height: 44px;
      background: #4a4a6a; color: white;
      border: none; border-radius: 50%;
      font-size: 20px; cursor: pointer;
      z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    btn.onclick = () => {
      if (this.panel) {
        this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none';
      }
    };
    document.body.appendChild(btn);
  }

  // ✅ 卸载清理
  onUnload() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    const btn = document.getElementById('dxxrq-launch-btn');
    if (btn) btn.remove();
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    console.log('[冬雪渲染器] 已卸载');
  }
}

// ✅ 必须注册！且文件名必须是 extension.js
TavernExtension.register(new DongxueRendererExtension());
