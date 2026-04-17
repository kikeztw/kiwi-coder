import { ToolUIPart, isToolUIPart } from 'ai';

export const handleApproval = (pars: ToolUIPart[]): ToolUIPart => {
  return pars.find((p) => isToolUIPart(p) && p.state === 'approval-requested') as ToolUIPart;
};