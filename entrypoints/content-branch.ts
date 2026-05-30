import { branchPageController } from '../src/content-branch/branch-page-controller';

export default defineContentScript({
  matches: ['*://chat.deepseek.com/*'],
  main() {
    // 自检：只在自己是被打开的分支标签页时启动
    branchPageController.init();
  },
});
