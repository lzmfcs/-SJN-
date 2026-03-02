// index.js - SillyTavern 扩展入口文件

import { DongxueRendererExtension } from './extension.js';

// 这个函数是 SillyTavern 要求的
function init() {
    console.log('[冬雪渲染器] 通过index.js初始化');
    
    // 创建扩展实例
    const extension = new DongxueRendererExtension();
    
    // 调用初始化方法
    if (extension.init) {
        extension.init();
    }
    
    return extension;
}

// 注册扩展
if (typeof window !== 'undefined') {
    window['dongxueRenderer'] = init();
}

// 导出
export default { init };