import { orchestrator } from '../src/background/orchestrator';

export default defineBackground(() => {
  orchestrator.init();
});
