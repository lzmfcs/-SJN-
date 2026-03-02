// 冬雪SJN渲染器 - 直接运行版本

(function() {
    console.log('❄️ 冬雪渲染器 开始加载...');

    // ==================== 全局变量 ====================
    let panel = null;
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let renderEnabled = true;

    // ==================== 添加样式 ====================
    const style = document.createElement('style');
    style.textContent = `
        #dongxue-panel {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 380px;
            background: rgba(30, 30, 45, 0.95);
            border-radius: 16px;
            padding: 16px;
            color: white;
            z-index: 99999;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        
        #dongxue-panel .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            cursor: move;
        }
        
        #dongxue-panel .title {
            font-size: 18px;
            font-weight: bold;
            color: #aaccff;
        }
        
        #dongxue-panel .close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
        }
        
        #dongxue-panel .close:hover {
            color: #ff6b6b;
        }
        
        #dongxue-panel .group {
            font-weight: bold;
            color: #aaccff;
            margin: 15px 0 10px 0;
            border-left: 3px solid #aaccff;
            padding-left: 10px;
        }
        
        #dongxue-panel .item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 8px;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
        }
        
        #dongxue-panel .item label {
            flex: 1;
            font-size: 14px;
        }
        
        #dongxue-panel .item input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: #aaccff;
        }
        
        #dongxue-panel .radio-item {
            display: block;
            margin-bottom: 8px;
            padding: 5px;
        }
        
        #dongxue-panel .small-input {
            width: 60px;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            color: white;
            padding: 4px;
            border-radius: 4px;
            margin: 0 5px;
        }
        
        #dongxue-panel .action-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 5px;
            margin: 10px 0;
        }
        
        #dongxue-panel button {
            background: #4a6fa5;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        
        #dongxue-panel button:hover {
            background: #5f8bc9;
        }
        
        #dongxue-panel .primary-btn {
            background: #4a6fa5;
        }
        
        #dongxue-panel .warning-btn {
            background: #a54a4a;
        }
        
        #dongxue-panel .warning-btn:hover {
            background: #c95f5f;
        }
        
        #dongxue-panel .item-row {
            display: flex;
            gap: 8px;
            margin: 10px 0;
        }
        
        #dongxue-panel .item-row button {
            flex: 1;
        }
        
        #dongxue-panel .detect-box {
            background: #1a1a2a;
            padding: 10px;
            border-radius: 8px;
            font-size: 13px;
            min-height: 60px;
        }
        
        #dongxue-float-btn {
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
            z-index: 99998;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        
        #dongxue-float-btn:hover {
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);

    // ==================== 创建面板 ====================
    function createPanel() {
        if (document.getElementById('dongxue-panel')) return;
        
        panel = document.createElement('div');
        panel.id = 'dongxue-panel';
        panel.innerHTML = `
            <div class="header" id="panel-header">
                <span class="title">❄️ 冬雪渲染器</span>
                <button class="close" id="close-panel">×</button>
            </div>
            
            <div class="group">🎯 HTML渲染开关</div>
            <div class="item">
                <label>开启楼层HTML渲染</label>
                <input type="checkbox" id="render-toggle" checked>
            </div>
            
            <div class="group">📊 渲染范围</div>
            <div class="radio-item">
                <input type="radio" name="render-range" value="last" checked> 
                最近 <input type="number" id="last-count" value="10" min="1" max="50" class="small-input"> 条
            </div>
            <div class="radio-item">
                <input type="radio" name="render-range" value="current"> 只渲染当前可见
            </div>
            <div class="radio-item">
                <input type="radio" name="render-range" value="custom"> 自定义范围
            </div>
            
            <div class="action-buttons">
                <button id="render-last-5">最近5条</button>
                <button id="render-last-10">最近10条</button>
                <button id="render-last-20">最近20条</button>
                <button id="render-visible">可见区域</button>
            </div>
            
            <div class="item-row">
                <button class="primary-btn" id="render-selected">渲染选定范围</button>
                <button class="warning-btn" id="restore-selected">恢复原文</button>
            </div>
            
            <div class="group">📝 状态</div>
            <div class="detect-box" id="detect-box">
                检测中...
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定事件
        document.getElementById('close-panel').onclick = () => {
            panel.style.display = 'none';
        };
        
        // 拖拽
        const header = document.getElementById('panel-header');
        header.onmousedown = (e) => {
            dragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            
            document.onmousemove = (e) => {
                if (!dragging) return;
                panel.style.left = (e.clientX - offsetX) + 'px';
                panel.style.top = (e.clientY - offsetY) + 'px';
                panel.style.transform = 'none';
            };
            
            document.onmouseup = () => {
                dragging = false;
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
        
        // 渲染开关
        document.getElementById('render-toggle').onchange = (e) => {
            renderEnabled = e.target.checked;
            updateDetectInfo();
        };
        
        // 快速按钮
        document.getElementById('render-last-5').onclick = () => {
            alert('渲染最近5条');
        };
        
        document.getElementById('render-last-10').onclick = () => {
            alert('渲染最近10条');
        };
        
        document.getElementById('render-last-20').onclick = () => {
            alert('渲染最近20条');
        };
        
        document.getElementById('render-visible').onclick = () => {
            alert('渲染可见区域');
        };
        
        document.getElementById('render-selected').onclick = () => {
            alert('渲染选定范围');
        };
        
        document.getElementById('restore-selected').onclick = () => {
            alert('恢复原文');
        };
    }

    // ==================== 更新状态 ====================
    function updateDetectInfo() {
        const box = document.getElementById('detect-box');
        if (!box) return;
        
        const messages = document.querySelectorAll('.mes').length;
        box.innerHTML = `
            <div>总楼层数: ${messages}</div>
            <div>渲染状态: ${renderEnabled ? '开启' : '关闭'}</div>
        `;
    }

    // ==================== 添加到扩展菜单 ====================
    function addToExtensionsMenu() {
        const checkMenu = setInterval(() => {
            const menu = document.getElementById('extensions_menu');
            if (menu) {
                clearInterval(checkMenu);
                
                const menuItem = document.createElement('div');
                menuItem.className = 'list-group-item flex-container';
                menuItem.innerHTML = `
                    <div class="flex-container flexGap5">
                        <span>❄️ 冬雪渲染器</span>
                    </div>
                `;
                
                menuItem.onclick = () => {
                    if (panel) {
                        if (panel.style.display === 'none') {
                            panel.style.display = 'block';
                            panel.style.left = '50%';
                            panel.style.top = '50%';
                            panel.style.transform = 'translate(-50%, -50%)';
                            updateDetectInfo();
                        } else {
                            panel.style.display = 'none';
                        }
                    }
                };
                
                menu.appendChild(menuItem);
                console.log('✅ 冬雪渲染器 已添加到扩展菜单');
            }
        }, 500);
    }

    // ==================== 添加浮动按钮 ====================
    function addFloatingButton() {
        if (document.getElementById('dongxue-float-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'dongxue-float-btn';
        btn.textContent = '❄️';
        btn.onclick = () => {
            if (panel) {
                if (panel.style.display === 'none') {
                    panel.style.display = 'block';
                    panel.style.left = '50%';
                    panel.style.top = '50%';
                    panel.style.transform = 'translate(-50%, -50%)';
                    updateDetectInfo();
                } else {
                    panel.style.display = 'none';
                }
            }
        };
        document.body.appendChild(btn);
    }

    // ==================== 监听新消息 ====================
    function observeMessages() {
        const chat = document.getElementById('chat');
        if (!chat) return;
        
        const observer = new MutationObserver(() => {
            if (renderEnabled) {
                updateDetectInfo();
            }
        });
        
        observer.observe(chat, { childList: true, subtree: true });
    }

    // ==================== 启动 ====================
    setTimeout(() => {
        createPanel();
        addToExtensionsMenu();
        addFloatingButton();
        observeMessages();
        updateDetectInfo();
        console.log('✅ 冬雪渲染器 加载完成');
    }, 1000);

})();