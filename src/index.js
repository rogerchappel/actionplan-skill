const APPROVALS = {
  readonly: 'none',
  write: 'operator approval',
  destructive: 'explicit owner approval',
  blocked: 'blocked'
};

const STRING_FIELDS = ['request', 'intent', 'target'];
const STRING_ARRAY_FIELDS = ['tools', 'evidence', 'approvals'];
const BLOCKED_TERMS = new Set(['password', 'secret', 'token', 'credential', 'credentials']);
const DESTRUCTIVE_TERMS = new Set(['delete', 'destroy', 'remove', 'wipe', 'refund', 'charge']);
const WRITE_TERMS = new Set([
  'send', 'post', 'update', 'create', 'write', 'draft', 'comment',
  'publish', 'merge', 'deploy'
]);
const NEGATIONS = new Set(['no', 'not', 'never', 'without']);
const CLAUSE_BOUNDARIES = new Set([',', '.', ';', ':', '!', '?', 'and', 'or', 'nor', 'but', 'however', 'instead', 'then']);

function validateActionInput(input) {
  if (input === null || Array.isArray(input) || typeof input !== 'object') {
    throw new TypeError('input must be a JSON object');
  }
  for (const field of STRING_FIELDS) {
    if (field in input && typeof input[field] !== 'string') {
      throw new TypeError(field + ' must be a string');
    }
  }
  for (const field of STRING_ARRAY_FIELDS) {
    if (field in input && (!Array.isArray(input[field]) || input[field].some((value) => typeof value !== 'string'))) {
      throw new TypeError(field + ' must be an array of strings');
    }
  }
  if ('credentials' in input && typeof input.credentials !== 'boolean') {
    throw new TypeError('credentials must be a boolean');
  }
  return input;
}

function classifyIntent(input) {
  const fields = [input.request, input.intent, input.target].filter(Boolean);
  const tokenizedFields = fields.map((field) => field.toLowerCase()
    .replace(/\b(can|could|did|do|does|is|should|was|were|would)n['’]t\b/g, '$1 not')
    .replace(/\bwon['’]t\b/g, 'will not')
    .match(/[\p{L}\p{N}_]+|[,.;:!?]/gu) || []);

  if (input.credentials || tokenizedFields.some((tokens) => tokens.some((token) => BLOCKED_TERMS.has(token)))) {
    return 'blocked';
  }

  let actionClass = 'readonly';
  for (const tokens of tokenizedFields) {
    let negated = false;
    for (const token of tokens) {
      if (CLAUSE_BOUNDARIES.has(token)) {
        negated = false;
      } else if (NEGATIONS.has(token)) {
        negated = true;
      } else if (!negated && DESTRUCTIVE_TERMS.has(token)) {
        return 'destructive';
      } else if (!negated && WRITE_TERMS.has(token)) {
        actionClass = 'write';
      }
    }
  }
  return actionClass;
}

function planAction(input) {
  validateActionInput(input);
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
  return {
    title: input.request || 'Untitled action request',
    actionClass,
    minimumApproval: APPROVALS[actionClass],
    callerApprovals: Array.isArray(input.approvals) ? input.approvals : [],
    tools,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    reversible: actionClass === 'readonly' || actionClass === 'write',
    blocked,
    stopConditions: blocked ? ['credentials-present', 'unsafe-external-write'] : ['missing-approval', 'missing-evidence', 'scope-change'],
    steps
  };
}

export { classifyIntent, planAction, validateActionInput };
