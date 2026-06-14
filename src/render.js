function renderList(items) {
  return items && items.length ? items.map((item) => '- ' + item).join('\n') : '- None';
}

function renderMarkdown(result) {
  const lines = ['# ' + (result.title || result.name || 'Brief')];
  for (const [key, value] of Object.entries(result)) {
    if (key === 'title' || key === 'name') continue;
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    lines.push('', '## ' + label);
    if (Array.isArray(value)) lines.push(renderList(value));
    else if (value && typeof value === 'object') lines.push('```json', JSON.stringify(value, null, 2), '```');
    else lines.push(String(value));
  }
  return lines.join('\n');
}

export { renderMarkdown };
