// === 冬雪SJN渲染器 v1.1 for SillyTavern ===
// 作者：沈嘉南 | 适配：SillyTavern v1.6+
// 功能：自动识别并渲染聊天中的HTML代码为界面

class DongxueRendererExtension {
    constructor() {
        this.name = '❄️ 冬雪SJN渲染器';
        this.version = '1.1.0';
        this.author = '沈嘉南';
        this.id = 'dxxrq';
        this.panel = null;
        this.dragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.originalMessages = new Map(); // 保存原始消息
        this.renderEnabled = true; // 默认开启渲染
        this.renderRange = 'last'; // 渲染范围: last, current, all, custom
        this.renderCount = 10; // 默认渲染最近10条

        // 面板HTML - 增加楼层选择功能
        this.panelHtml = `
            <div class="tool-header">
                <span class="tool-title">❄️ 冬雪渲染器</span>
                <button class="tool-close">×</button>
            </div>
            <div class="panel-content">
                <div class="group">🎯 HTML渲染开关</div>
                <div class="item highlight">
                    <label>🔲 开启楼层HTML渲染</label>
                    <input type="checkbox" id="render-toggle" checked>
                    <span class="badge">自动识别并渲染</span>
                </div>

                <div class="group">📊 渲染范围控制 (防止卡顿)</div>
                
                <!-- 渲染模式选择 -->
                <div class="radio-group">
                    <label class="radio-item">
                        <input type="radio" name="render-range" value="last" checked> 
                        <span>只渲染最近</span>
                        <input type="number" id="last-count" value="10" min="1" max="50" class="small-input"> 条消息
                    </label>
                    
                    <label class="radio-item">
                        <input type="radio" name="render-range" value="current"> 
                        <span>只渲染当前可见楼层</span>
                    </label>
                    
                    <label class="radio-item">
                        <input type="radio" name="render-range" value="all"> 
                        <span>渲染全部 (可能卡顿)</span>
                    </label>
                    
                    <label class="radio-item">
                        <input type="radio" name="render-range" value="custom"> 
                        <span>自定义范围:</span>
                    </label>
                </div>
                
                <!-- 自定义范围输入 -->
                <div class="custom-range" id="custom-range">
                    <input type="number" id="range-start" placeholder="起始楼层" min="1" class="medium-input">
                    <span> 到 </span>
                    <input type="number" id="range-end" placeholder="结束楼层" min="1" class="medium-input">
                    <button id="apply-range" class="small-btn">应用</button>
                </div>

                <!-- 快速操作按钮 -->
                <div class="action-buttons">
                    <button id="render-last-5" class="action-btn">最近5条</button>
                    <button id="render-last-10" class="action-btn">最近10条</button>
                    <button id="render-last-20" class="action-btn">最近20条</button>
                    <button id="render-visible" class="action-btn">可见区域</button>
                </div>

                <div class="group">📝 当前楼层检测</div>
                <div class="detect-box" id="detect-box">
                    <div>总楼层数: <span id="total-messages">0</span></div>
                    <div>已渲染楼层: <span id="rendered-count">0</span></div>
                    <div>包含HTML的楼层: <span id="html-count">0</span></div>
                    <div class="html-list" id="html-list"></div>
                </div>

                <div class="group">⚙️ 性能设置</div>
                <div class="item">
                    <label>渲染延迟(ms)</label>
                    <input type="range" id="render-delay" min="0" max="500" value="100" step="10">
                    <span id="delay-value">100ms</span>
                </div>
                <div class="item">
                    <label>调试模式</label>
                    <input type="checkbox" id="debug-mode">
                </div>

                <div class="group">🔄 手动控制</div>
                <div class="item-row">
                    <button id="render-selected" class="primary-btn">渲染选定范围</button>
                    <button id="restore-selected" class="warning-btn">恢复选定范围</button>
                </div>
                <div class="item-row">
                    <button id="render-all" class="secondary-btn">渲染全部</button>
                    <button id="restore-all" class="secondary-btn">恢复全部</button>
                </div>

                <div class="group">📋 使用说明</div>
                <div class="help-box">
                    <p>1. 选择要渲染的楼层范围</p>
                    <p>2. 开启渲染开关</p>
                    <p>3. 插件会自动识别HTML并渲染</p>
                    <p class="tip">💡 建议只渲染最近消息避免卡顿</p>
                </div>
            </div>
        `;
    }

    // SillyTavern 入口函数
    init() {
        console.log('[冬雪渲染器] 开始初始化');
        
        this.addStyles();
        this.createPanel();
        this.addToExtensionsMenu();
        this.addFloatingButton();
        
        // 监听新消息
        this.observeNewMessages();
        
        // 初始检测
        setTimeout(() => {
            this.updateDetectInfo();
            if (this.renderEnabled) {
                this.renderMessages('last', 10);
            }
        }, 1000);
        
        console.log('[冬雪渲染器] 初始化完成');
    }

    // 添加样式
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 面板样式 */
            #${this.id} {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 420px;
                max-height: 85vh;
                overflow-y: auto;
                background: rgba(30, 30, 45, 0.98);
                border-radius: 16px;
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255,255,255,0.1);
                color: #fff;
                font-family: 'Segoe UI', sans-serif;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                z-index: 99999;
                padding: 16px;
            }
            
            #${this.id} .tool-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                cursor: move;
            }
            
            #${this.id} .tool-title {
                font-size: 18px;
                font-weight: bold;
                color: #aaccff;
            }
            
            #${this.id} .tool-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 24px;
                cursor: pointer;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            
            #${this.id} .tool-close:hover {
                background: rgba(255,107,107,0.2);
                color: #ff6b6b;
            }
            
            #${this.id} .group {
                font-size: 15px;
                font-weight: bold;
                margin: 20px 0 12px 0;
                color: #aaccff;
                border-left: 3px solid #aaccff;
                padding-left: 10px;
            }
            
            #${this.id} .item {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                padding: 10px 12px;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
            }
            
            #${this.id} .item.highlight {
                background: rgba(170, 204, 255, 0.15);
                border: 1px solid rgba(170, 204, 255, 0.3);
            }
            
            #${this.id} .item label {
                flex: 1;
                font-size: 14px;
            }
            
            #${this.id} .item .badge {
                background: #aaccff;
                color: #1a1a2a;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
            }
            
            /* 单选按钮组 */
            #${this.id} .radio-group {
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 10px;
            }
            
            #${this.id} .radio-item {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                padding: 5px;
                border-radius: 4px;
            }
            
            #${this.id} .radio-item:hover {
                background: rgba(255,255,255,0.1);
            }
            
            #${this.id} .radio-item input[type="radio"] {
                margin-right: 8px;
            }
            
            #${this.id} .small-input {
                width: 60px;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1);
                color: white;
                padding: 4px;
                border-radius: 4px;
                margin: 0 5px;
            }
            
            #${this.id} .medium-input {
                width: 80px;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1);
                color: white;
                padding: 4px;
                border-radius: 4px;
            }
            
            #${this.id} .custom-range {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 10px;
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                margin-bottom: 10px;
            }
            
            #${this.id} .small-btn {
                background: #4a6fa5;
                border: none;
                color: white;
                padding: 4px 10px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            #${this.id} .small-btn:hover {
                background: #5f8bc9;
            }
            
            /* 快速操作按钮 */
            #${this.id} .action-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 5px;
                margin: 10px 0;
            }
            
            #${this.id} .action-btn {
                padding: 6px;
                background: #3d3d4a;
                border: none;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            #${this.id} .action-btn:hover {
                background: #4d4d5a;
            }
            
            /* 检测框 */
            #${this.id} .detect-box {
                background: #1a1a2a;
                padding: 12px;
                border-radius: 8px;
                font-size: 13px;
                max-height: 150px;
                overflow-y: auto;
            }
            
            #${this.id} .detect-box div {
                margin-bottom: 5px;
            }
            
            #${this.id} .html-list {
                max-height: 80px;
                overflow-y: auto;
                font-family: monospace;
                font-size: 11px;
                background: rgba(0,0,0,0.3);
                padding: 5px;
                border-radius: 4px;
                margin-top: 5px;
            }
            
            #${this.id} .html-item {
                color: #ffd700;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            /* 按钮行 */
            #${this.id} .item-row {
                display: flex;
                gap: 8px;
                margin: 10px 0;
            }
            
            #${this.id} .item-row button {
                flex: 1;
                padding: 8px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            }
            
            #${this.id} .primary-btn {
                background: #4a6fa5;
                color: white;
            }
            
            #${this.id} .primary-btn:hover {
                background: #5f8bc9;
            }
            
            #${this.id} .warning-btn {
                background: #a54a4a;
                color: white;
            }
            
            #${this.id} .warning-btn:hover {
                background: #c95f5f;
            }
            
            #${this.id} .secondary-btn {
                background: #3d3d4a;
                color: white;
            }
            
            #${this.id} .secondary-btn:hover {
                background: #4d4d5a;
            }
            
            /* 帮助框 */
            #${this.id} .help-box {
                background: #1a1a2a;
                padding: 12px;
                border-radius: 8px;
                font-size: 12px;
            }
            
            #${this.id} .help-box p {
                margin: 5px 0;
            }
            
            #${this.id} .help-box .tip {
                color: #ffd700;
                font-style: italic;
            }
            
            #${this.id} .help-box code {
                display: block;
                background: #2d2d3a;
                padding: 8px;
                border-radius: 4px;
                margin: 8px 0;
                color: #ffd700;
                white-space: pre-wrap;
                font-size: 11px;
            }
            
            /* 浮动按钮 */
            #${this.id}-launch-btn {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #4a6fa5, #6b8fc9);
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 24px;
                cursor: pointer;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                transition: all 0.3s;
            }
            
            #${this.id}-launch-btn:hover {
                transform: scale(1.1) rotate(5deg);
                box-shadow: 0 6px 20px rgba(74, 111, 165, 0.5);
            }
            
            /* 渲染的HTML元素基础样式 */
            .rendered-html {
                margin: 10px 0;
                padding: 10px;
                border-radius: 8px;
            }
            
            /* 调试信息 */
            .debug-info {
                font-size: 10px;
                color: #888;
                margin-top: 2px;
            }
        `;
        
        document.head.appendChild(style);
    }

    // 创建面板
    createPanel() {
        if (document.getElementById(this.id)) return;

        this.panel = document.createElement('div');
        this.panel.id = this.id;
        this.panel.innerHTML = this.panelHtml;
        document.body.appendChild(this.panel);

        this.initDrag();
        this.bindEvents();
        
        // 默认隐藏
        this.panel.style.display = 'none';
    }

    // 绑定事件
    bindEvents() {
        // 关闭按钮
        this.panel.querySelector('.tool-close').onclick = () => {
            this.panel.style.display = 'none';
        };

        // 渲染开关
        const renderToggle = document.getElementById('render-toggle');
        if (renderToggle) {
            renderToggle.onchange = () => {
                this.renderEnabled = renderToggle.checked;
                if (this.renderEnabled) {
                    this.renderMessages('last', 10);
                } else {
                    this.restoreAllMessages();
                }
            };
        }

        // 渲染范围单选
        document.querySelectorAll('input[name="render-range"]').forEach(radio => {
            radio.onchange = (e) => {
                this.renderRange = e.target.value;
                if (this.renderRange === 'last') {
                    document.getElementById('custom-range').style.display = 'none';
                } else if (this.renderRange === 'custom') {
                    document.getElementById('custom-range').style.display = 'flex';
                } else {
                    document.getElementById('custom-range').style.display = 'none';
                }
            };
        });

        // 最近条数输入
        const lastCount = document.getElementById('last-count');
        if (lastCount) {
            lastCount.onchange = () => {
                this.renderCount = parseInt(lastCount.value) || 10;
            };
        }

        // 快速操作按钮
        document.getElementById('render-last-5').onclick = () => {
            this.renderMessages('last', 5);
        };
        
        document.getElementById('render-last-10').onclick = () => {
            this.renderMessages('last', 10);
        };
        
        document.getElementById('render-last-20').onclick = () => {
            this.renderMessages('last', 20);
        };
        
        document.getElementById('render-visible').onclick = () => {
            this.renderVisibleMessages();
        };

        // 应用自定义范围
        document.getElementById('apply-range').onclick = () => {
            const start = parseInt(document.getElementById('range-start').value);
            const end = parseInt(document.getElementById('range-end').value);
            if (start && end && start <= end) {
                this.renderMessages('custom', { start, end });
            }
        };

        // 渲染选定范围
        document.getElementById('render-selected').onclick = () => {
            if (this.renderRange === 'last') {
                this.renderMessages('last', this.renderCount);
            } else if (this.renderRange === 'current') {
                this.renderVisibleMessages();
            } else if (this.renderRange === 'all') {
                this.renderMessages('all');
            } else if (this.renderRange === 'custom') {
                const start = parseInt(document.getElementById('range-start').value);
                const end = parseInt(document.getElementById('range-end').value);
                if (start && end && start <= end) {
                    this.renderMessages('custom', { start, end });
                }
            }
        };

        // 恢复选定范围
        document.getElementById('restore-selected').onclick = () => {
            if (this.renderRange === 'last') {
                this.restoreMessages('last', this.renderCount);
            } else if (this.renderRange === 'current') {
                this.restoreVisibleMessages();
            } else if (this.renderRange === 'all') {
                this.restoreAllMessages();
            } else if (this.renderRange === 'custom') {
                const start = parseInt(document.getElementById('range-start').value);
                const end = parseInt(document.getElementById('range-end').value);
                if (start && end && start <= end) {
                    this.restoreMessages('custom', { start, end });
                }
            }
        };

        // 渲染全部
        document.getElementById('render-all').onclick = () => {
            if (confirm('渲染全部楼层可能会卡顿，确定继续？')) {
                this.renderMessages('all');
            }
        };

        // 恢复全部
        document.getElementById('restore-all').onclick = () => {
            this.restoreAllMessages();
        };

        // 渲染延迟
        const delayInput = document.getElementById('render-delay');
        const delayValue = document.getElementById('delay-value');
        if (delayInput) {
            delayInput.oninput = () => {
                delayValue.textContent = delayInput.value + 'ms';
            };
        }

        // 调试模式
        const debugMode = document.getElementById('debug-mode');
        if (debugMode) {
            debugMode.onchange = () => {
                console.log('[冬雪渲染器] 调试模式:', debugMode.checked);
            };
        }
    }

    // 监听新消息
    observeNewMessages() {
        const chatContainer = document.getElementById('chat');
        if (!chatContainer) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList?.contains('mes')) {
                        if (this.renderEnabled) {
                            // 只渲染新消息
                            setTimeout(() => {
                                this.renderSingleMessage(node);
                                this.updateDetectInfo();
                            }, 100);
                        }
                    }
                });
            });
        });

        observer.observe(chatContainer, { childList: true, subtree: true });
    }

    // 渲染所有消息
    renderMessages(mode, param) {
        const messages = document.querySelectorAll('.mes');
        if (!messages.length) return;

        let startIdx = 0;
        let endIdx = messages.length - 1;

        if (mode === 'last') {
            const count = param || 10;
            startIdx = Math.max(0, messages.length - count);
        } else if (mode === 'custom') {
            startIdx = Math.max(0, param.start - 1);
            endIdx = Math.min(messages.length - 1, param.end - 1);
        }

        const delay = parseInt(document.getElementById('render-delay')?.value || 100);
        const debug = document.getElementById('debug-mode')?.checked;

        if (debug) {
            console.log(`[冬雪渲染器] 渲染楼层 ${startIdx + 1} 到 ${endIdx + 1}`);
        }

        // 逐条渲染，避免卡顿
        for (let i = startIdx; i <= endIdx; i++) {
            setTimeout(() => {
                this.renderSingleMessage(messages[i]);
                if (i === endIdx) {
                    this.updateDetectInfo();
                }
            }, (i - startIdx) * delay);
        }
    }

    // 渲染单条消息
    renderSingleMessage(messageElement) {
        if (!messageElement || !this.renderEnabled) return;

        const textElement = messageElement.querySelector('.text');
        if (!textElement) return;

        const originalHTML = textElement.innerHTML;
        
        // 检查是否包含HTML标签
        if (!this.containsHTML(originalHTML)) return;

        // 保存原始内容
        if (!this.originalMessages.has(messageElement)) {
            this.originalMessages.set(messageElement, originalHTML);
        }

        // 直接渲染HTML（但包装一下以便识别）
        textElement.innerHTML = `<div class="rendered-html">${originalHTML}</div>`;

        const debug = document.getElementById('debug-mode')?.checked;
        if (debug) {
            console.log('[冬雪渲染器] 已渲染:', originalHTML.substring(0, 50) + '...');
        }
    }

    // 检查是否包含HTML
    containsHTML(text) {
        // 检查是否包含HTML标签
        return /<[a-z][\s\S]*>/i.test(text);
    }

    // 恢复所有消息
    restoreAllMessages() {
        document.querySelectorAll('.mes').forEach(msg => {
            this.restoreSingleMessage(msg);
        });
        this.updateDetectInfo();
    }

    // 恢复单条消息
    restoreSingleMessage(messageElement) {
        const original = this.originalMessages.get(messageElement);
        if (original) {
            const textElement = messageElement.querySelector('.text');
            if (textElement) {
                textElement.innerHTML = original;
            }
        }
    }

    // 恢复指定范围的消息
    restoreMessages(mode, param) {
        const messages = document.querySelectorAll('.mes');
        
        let startIdx = 0;
        let endIdx = messages.length - 1;

        if (mode === 'last') {
            const count = param || 10;
            startIdx = Math.max(0, messages.length - count);
        } else if (mode === 'custom') {
            startIdx = Math.max(0, param.start - 1);
            endIdx = Math.min(messages.length - 1, param.end - 1);
        }

        for (let i = startIdx; i <= endIdx; i++) {
            this.restoreSingleMessage(messages[i]);
        }
        
        this.updateDetectInfo();
    }

    // 渲染可见消息
    renderVisibleMessages() {
        const messages = document.querySelectorAll('.mes');
        const viewportHeight = window.innerHeight;
        
        messages.forEach((msg, index) => {
            const rect = msg.getBoundingClientRect();
            if (rect.top < viewportHeight && rect.bottom > 0) {
                setTimeout(() => {
                    this.renderSingleMessage(msg);
                }, index * 50);
            }
        });
        
        setTimeout(() => this.updateDetectInfo(), 500);
    }

    // 恢复可见消息
    restoreVisibleMessages() {
        const messages = document.querySelectorAll('.mes');
        const viewportHeight = window.innerHeight;
        
        messages.forEach(msg => {
            const rect = msg.getBoundingClientRect();
            if (rect.top < viewportHeight && rect.bottom > 0) {
                this.restoreSingleMessage(msg);
            }
        });
        
        this.updateDetectInfo();
    }

    // 更新检测信息
    updateDetectInfo() {
        const messages = document.querySelectorAll('.mes');
        const total = messages.length;
        
        let rendered = 0;
        let htmlMessages = [];
        
        messages.forEach(msg => {
            if (this.originalMessages.has(msg)) {
                rendered++;
            }
            const text = msg.querySelector('.text')?.innerHTML || '';
            if (this.containsHTML(text)) {
                htmlMessages.push(text.substring(0, 30) + '...');
            }
        });

        document.getElementById('total-messages').textContent = total;
        document.getElementById('rendered-count').textContent = rendered;
        document.getElementById('html-count').textContent = htmlMessages.length;
        
        const htmlList = document.getElementById('html-list');
        if (htmlList) {
            if (htmlMessages.length > 0) {
                htmlList.innerHTML = htmlMessages.map(h => 
                    `<div class="html-item">📄 ${h}</div>`
                ).join('');
            } else {
                htmlList.innerHTML = '<div class="html-item">未检测到HTML内容</div>';
            }
        }
    }

    // 拖拽功能
    initDrag() {
        const header = this.panel.querySelector('.tool-header');
        
        header.onmousedown = (e) => {
            if (e.target.classList.contains('tool-close')) return;
            
            this.dragging = true;
            this.offsetX = e.clientX - this.panel.offsetLeft;
            this.offsetY = e.clientY - this.panel.offsetTop;
            this.panel.style.cursor = 'grabbing';
            this.panel.style.transform = 'none';
            
            document.onmousemove = (e) => {
                if (!this.dragging) return;
                this.panel.style.left = (e.clientX - this.offsetX) + 'px';
                this.panel.style.top = (e.clientY - this.offsetY) + 'px';
            };
            
            document.onmouseup = () => {
                this.dragging = false;
                this.panel.style.cursor = 'default';
                document.onmousemove = null;
                document.onmouseup = null;
            };
            
            e.preventDefault();
        };
    }

    // 添加到扩展菜单
    addToExtensionsMenu() {
        const checkInterval = setInterval(() => {
            const extensionsMenu = document.getElementById('extensions_menu');
            if (extensionsMenu) {
                clearInterval(checkInterval);
                
                const menuItem = document.createElement('div');
                menuItem.className = 'list-group-item flex-container';
                menuItem.innerHTML = `
                    <div class="flex-container flexGap5">
                        <span>❄️ 冬雪渲染器</span>
                        <span class="text-muted">(选择楼层渲染)</span>
                    </div>
                `;
                
                menuItem.onclick = () => {
                    if (this.panel) {
                        if (this.panel.style.display === 'none') {
                            this.panel.style.display = 'block';
                            this.panel.style.left = '50%';
                            this.panel.style.top = '50%';
                            this.panel.style.transform = 'translate(-50%, -50%)';
                            this.updateDetectInfo();
                        } else {
                            this.panel.style.display = 'none';
                        }
                    }
                };
                
                extensionsMenu.appendChild(menuItem);
            }
        }, 500);
    }

    // 浮动按钮
    addFloatingButton() {
        if (document.getElementById(`${this.id}-launch-btn`)) return;
        
        const btn = document.createElement('button');
        btn.id = `${this.id}-launch-btn`;
        btn.textContent = '❄️';
        btn.title = '打开冬雪渲染器';
        
        btn.onclick = () => {
            if (this.panel) {
                if (this.panel.style.display === 'none') {
                    this.panel.style.display = 'block';
                    this.panel.style.left = '50%';
                    this.panel.style.top = '50%';
                    this.panel.style.transform = 'translate(-50%, -50%)';
                    this.updateDetectInfo();
                } else {
                    this.panel.style.display = 'none';
                }
            }
        };
        
        document.body.appendChild(btn);
    }

    // 卸载清理
    onUnload() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        
        const btn = document.getElementById(`${this.id}-launch-btn`);
        if (btn) btn.remove();
        
        // 恢复所有消息
        this.restoreAllMessages();
        
        console.log('[冬雪渲染器] 已卸载');
    }
}

// 注册扩展
const extension = new DongxueRendererExtension();

if (typeof TavernExtension !== 'undefined' && TavernExtension.register) {
    TavernExtension.register(extension);
} else {
    window.addEventListener('load', () => extension.init());
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = extension;
}
