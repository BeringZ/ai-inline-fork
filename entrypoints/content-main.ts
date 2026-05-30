import { mainPageController } from '../src/content-main/main-page-controller';

export default defineContentScript({
  matches: ['*://chat.deepseek.com/chat/*'],
  main() {
    // 只在已有对话页面启动
    mainPageController.init();
  },
});
