export interface PromptContext {
  mainUserQuestion?: string;
  assistantMessage: string;
  selectedText: string;
  branchQuestion: string;
  forkThreadId: string;
}

export function buildPrompt(ctx: PromptContext): string {
  return [
    `你正在回答一个从主对话中分叉出来的局部追问。`,
    ``,
    `【主会话中的最近问题】`,
    ctx.mainUserQuestion || '(未获取到主问题)',
    ``,
    `【主会话中的 AI 回答】`,
    ctx.assistantMessage,
    ``,
    `【用户选中的片段】`,
    ctx.selectedText,
    ``,
    `【用户的分支追问】`,
    ctx.branchQuestion,
    ``,
    `请只围绕"用户选中的片段"和"用户的分支追问"回答。`,
    `不要继续主会话，也不要假设你能看到原网页。`,
    `如果需要引用上下文，只能依据上面提供的信息。`,
    ``,
    `【分支ID】`,
    ctx.forkThreadId,
  ].join('\n');
}
