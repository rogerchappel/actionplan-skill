const APPROVALS = {
  readonly: 'none',
  write: 'operator approval',
  destructive: 'explicit owner approval',
  blocked: 'blocked'
};

function classifyIntent(input) {
  const text = [input.request, input.intent, input.target].filter(Boolean).join(' ').toLowerCase();
  if (input.credentials || /password|secret|token|credential/.test(text)) return 'blocked';
  if (/delete|destroy|remove|wipe|refund|charge/.test(text)) return 'destructive';
  if (/send|post|update|create|write|draft|comment/.test(text)) return 'write';
  return 'readonly';
}

function planAction(input) {
  const actionClass = classifyIntent(input);
  const tools = Array.isArray(input.tools) && input.tools.length ? input.tools : [input.target || 'local'];
  const blocked = actionClass === 'blocked';
  const steps = blocked ? [
    'Stop before using provided credentials or touching the external system.',
    'Ask the operator to provide a sanitized request and approved connector boundary.'
  ] : [
    'Restate the requested outcome and identify the external system boundary.',
    'Gather only the evidence needed for the plan.',
    'Prepare the proposed action in dry-run form.',
    'Request the approval tier required for this action class.',
    'Execute only after approval in a separate run.'
  ];
  return { title: input.request || 'Untitled action request', actionClass, approval: APPROVALS[actionClass], tools, evidence: Array.isArray(input.evidence) ? input.evidence : [], reversible: actionClass === 'readonly' || actionClass === 'write', blocked, stopConditions: blocked ? ['credentials-present', 'unsafe-external-write'] : ['missing-approval', 'missing-evidence', 'scope-change'], steps };
}

export { classifyIntent, planAction };
