import { TavernExtension, getRequestHeaders, getContext, modules } from '../../../../extensions.js';

class DongxueRendererExtension extends TavernExtension {
  constructor() {
    super();
    this.name = '❄️ 冬雪SJN渲染器';
    this.version = '1.0.0';
    this.author = '沈嘉南';
    this.id = 'dxxrq'; // 插件的唯一ID
    this.panelHtml = `
      <div class="tool-header">
        <span class="tool-title">❄️ 冬雪SJN渲染器</span>
        <div class="tool-controls">
          <button class="tool-close">×</button>
        </div>
      </div>
      <div class="tool-body">
        <div class="group">渲染性能</div>
        <div class="item"><label>渲染层数</label><input type="range" min="1" max="8" value="4" id="render-layers"><span id="val-layers">4</span></div>
        <div class="item"><label>帧率限制</label><input type="range" min="30" max="144" value="60" id="fps-limit"><span id="val-fps">60</span></div>
        <div class="item"><label>消息保留数量</label><input type="range" min="10" max="200" value="50" id="msg-limit"><span id="val-msg">50</span></div>
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
        <div class="item-row"><button id="btn-clear">清空聊天</button><button id="btn-copy">复制对话</button><button id="btn-reload">重载界面</button></div>
      </div>`;
  }

  // 扩展加载时执行
  onLoad() {
    console.log('冬雪SJN渲染器 加载成功。');
    // 使用toastr提示，比alert更友好
    toastr.info(
      '此插件仅发布在Saros社区，禁止二传、商用！',
      '大家好，我是作者沈嘉南',
      { timeOut: 5000, positionClass: "toast-top-center" }
    );

    // 动态加载CSS
    modules.importCss(this.baseUrl + 'style.css');

    // 创建并显示面板
    this.createPanel();
  }

  // 扩展卸载时执行 (用于清理)
  onUnload() {
    console.log('冬雪SJN渲染器 已卸载。');
    const panel = document.getElementById(this.id);
    if (panel) {
      panel.remove();
    }
    // 还需要移除全局的拖拽事件监听器
    document.onmousemove = null;
    document.onmouseup = null;
  }

  // 创建渲染面板
  createPanel() {
    if (document.getElementById(this.id)) return;

    const panel = document.createElement('div');
    panel.id = this.id;
    panel.innerHTML = this.panelHtml;
    document.body.appendChild(panel);

    this.initDrag(panel);
    this.bindAll(panel);
  }

  // 拖拽功能 (作为类的方法)
  initDrag(panel) {
    const header = panel.querySelector('.tool-header');
    let dragging = false, sx = 0, sy = 0, ix = panel.offsetLeft, iy = panel.offsetTop;

    const onMouseMove = e => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      panel.style.left = ix + dx + 'px';
      panel.style.top = iy + dy + 'px';
    };

    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    header.onmousedown = e => {
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      ix = panel.offsetLeft;
      iy = panel.offsetTop;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };
  }

  // 所有功能绑定 (作为类的方法)
  bindAll(panel) {
    const context = getContext();
    const $ = id => panel.querySelector(`#${id}`);

    // 透明度
    $('opacity').oninput = () => {
      const value = $('opacity').value;
      $('val-opacity').textContent = `${value}%`;
      panel.style.background = `rgba(30, 30, 45, ${value/100 * 0.85})`; // 调整背景色的透明度
    };

    // 模糊
    $('blur-strength').oninput = () => {
      const value = $('blur-strength').value;
      $('val-blur').textContent = `${value}px`;
      panel.style.backdropFilter = `blur(${value}px)`;
      panel.style.webkitBackdropFilter = `blur(${value}px)`;
    };

    // 圆角
    $('round').oninput = () => {
        const value = $('round').value;
        $('val-round').textContent = `${value}px`;
        panel.style.borderRadius = `${value}px`;
        panel.querySelector('.tool-body button').style.borderRadius = `${Math.min(value, 8)}px`;
    };

    // 特效开关 (示例, 你需要自己实现这些CSS变量或类名的具体效果)
    $('anim').onchange = () => document.body.classList.toggle('no-anim', !$('anim').checked);
    $('light').onchange = () => document.body.classList.toggle('no-light', !$('light').checked);
    $('bg-blur').onchange = () => document.body.classList.toggle('no-bg-blur', !$('bg-blur').checked);

    // 快捷工具
    $('btn-clear').onclick = () => {
      if (confirm('确定清空当前聊天记录？')) {
        context.chat = [];
        context.displayChat();
      }
    };
    $('btn-copy').onclick = () => {
      const text = context.chat.map(msg => `${msg.name}: ${msg.mes}`).join('\n\n');
      navigator.clipboard.writeText(text);
      toastr.success('已复制全部对话到剪贴板');
    };
    $('btn-reload').onclick = () => location.reload();

    // 关闭
    panel.querySelector('.tool-close').onclick = () => {
      this.onUnload(); // 调用卸载方法来清理
    };

    // 其他滑块的事件，你可以继续在这里添加
    $('render-layers').oninput = () => $('val-layers').textContent = $('render-layers').value;
    $('fps-limit').oninput = () => $('val-fps').textContent = $('fps-limit').value;
    $('msg-limit').oninput = () => $('val-msg').textContent = $('msg-limit').value;
  }
}

// 注册扩展
TavernExtension.register(new DongxueRendererExtension());
