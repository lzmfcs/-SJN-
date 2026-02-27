(function () {
  const pluginId = '-SJN-';

  // 作者声明
  alert(
    '大家好，我是作者沈嘉南\n' +
    '此插件仅发布在Saros社区\n' +
    '如果在其他地方发现请向我举报\n' +
    '插件不可二传、商用！'
  );

  // 创建渲染面板
  function createPanel() {
    if (document.getElementById(pluginId)) return;

    const panel = document.createElement('div');
    panel.id = pluginId;
    panel.innerHTML = `
<div class="tool-header">
  <span class="tool-title">❄️ 冬雪SJN渲染器</span>
  <div class="tool-controls">
    <button class="tool-min">-</button>
    <button class="tool-close">×</button>
  </div>
</div>
<div class="tool-body">

  <div class="group">渲染性能</div>
  <div class="item">
    <label>渲染层数</label>
    <input type="range" min="1" max="8" value="4" id="render-layers">
    <span id="val-layers">4</span>
  </div>
  <div class="item">
    <label>帧率限制</label>
    <input type="range" min="30" max="144" value="60" id="fps-limit">
    <span id="val-fps">60</span>
  </div>
  <div class="item">
    <label>消息保留数量</label>
    <input type="range" min="10" max="200" value="50" id="msg-limit">
    <span id="val-msg">50</span>
  </div>

  <div class="group">界面美化</div>
  <div class="item">
    <label>全局透明度</label>
    <input type="range" min="30" max="100" value="85" id="opacity">
    <span id="val-opacity">85%</span>
  </div>
  <div class="item">
    <label>毛玻璃强度</label>
    <input type="range" min="0" max="20" value="12" id="blur-strength">
    <span id="val-blur">12px</span>
  </div>
  <div class="item">
    <label>圆角强度</label>
    <input type="range" min="0" max="30" value="16" id="round">
    <span id="val-round">16px</span>
  </div>

  <div class="group">特效开关</div>
  <div class="item">
    <label>动画效果</label>
    <input type="checkbox" id="anim" checked>
  </div>
  <div class="item">
    <label>光晕特效</label>
    <input type="checkbox" id="light" checked>
  </div>
  <div class="item">
    <label>背景模糊</label>
    <input type="checkbox" id="bg-blur" checked>
  </div>
  <div class="item">
    <label>自动滚屏</label>
    <input type="checkbox" id="autoscroll" checked>
  </div>

  <div class="group">快捷工具</div>
  <div class="item-row">
    <button id="btn-clear">清空聊天</button>
    <button id="btn-copy">复制对话</button>
    <button id="btn-reload">重载界面</button>
  </div>

</div>
`;
    document.body.appendChild(panel);
    initDrag();
    bindAll();
  }

  // 拖拽
  function initDrag() {
    const panel = document.getElementById(pluginId);
    const header = panel.querySelector('.tool-header');
    let dragging = false, sx = 0, sy = 0;

    header.onmousedown = e => {
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
    };
    document.onmousemove = e => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      panel.style.left = panel.offsetLeft + dx + 'px';
      panel.style.top = panel.offsetTop + dy + 'px';
      sx = e.clientX;
      sy = e.clientY;
    };
    document.onmouseup = () => dragging = false;
  }

  // 所有功能绑定
  function bindAll() {
    const $ = id => document.getElementById(id);

    // 渲染层数
    $('render-layers').oninput = () => {
      $('val-layers').textContent = $('render-layers').value;
      document.documentElement.style.setProperty('--layers', $('render-layers').value);
    };

    // 帧率
    $('fps-limit').oninput = () => {
      $('val-fps').textContent = $('fps-limit').value;
    };

    // 消息限制
    $('msg-limit').oninput = () => {
      $('val-msg').textContent = $('msg-limit').value;
    };

    // 透明度
    $('opacity').oninput = () => {
      $('val-opacity').textContent = $('opacity').value + '%';
      $('#dxxrq').style.opacity = $('opacity').value / 100;
    };

    // 模糊
    $('blur-strength').oninput = () => {
      $('val-blur').textContent = $('blur-strength').value + 'px';
      document.documentElement.style.setProperty('--blur', $('blur-strength').value + 'px');
    };

    // 圆角
    $('round').oninput = () => {
      $('val-round').textContent = $('round').value + 'px';
      document.documentElement.style.setProperty('--radius', $('round').value + 'px');
    };

    // 特效开关
    $('anim').onchange = () => {
      document.body.classList.toggle('no-anim', !$('anim').checked);
    };
    $('light').onchange = () => {
      document.body.classList.toggle('no-light', !$('light').checked);
    };
    $('bg-blur').onchange = () => {
      document.body.classList.toggle('no-bg-blur', !$('bg-blur').checked);
    };

    // 快捷工具
    $('btn-clear').onclick = () => {
      if (confirm('确定清空当前聊天？')) {
        document.querySelectorAll('.mes').forEach(e => e.remove());
      }
    };
    $('btn-copy').onclick = () => {
      const text = Array.from(document.querySelectorAll('.mes .mes_text'))
        .map(n => n.textContent)
        .join('\n\n');
      navigator.clipboard.writeText(text);
      alert('已复制全部对话');
    };
    $('btn-reload').onclick = () => location.reload();

    // 最小化 & 关闭
    document.querySelector('.tool-min').onclick = () => {
      $('#dxxrq').style.display = 'none';
    };
    document.querySelector('.tool-close').onclick = () => {
      $('#dxxrq').remove();
    };
  }

  // 启动
  window.addEventListener('load', () => {
    setTimeout(createPanel, 1000);
  });
})();
