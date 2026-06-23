/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A utility parser to convert standard Markdown text into styled HTML content strings.
 * Built strictly to avoid importing heavy external packages, sticking to our zine aesthetic.
 */
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (multiline)
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-brand-bg text-brand-text border border-brand-border/60 p-3 rounded font-mono text-xs my-4 overflow-x-auto select-text">$1</pre>');

  // Headings (e.g. ### Heading)
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-sm font-bold font-display uppercase tracking-wider text-brand-accent mt-5 mb-2">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-md font-bold font-display uppercase tracking-wider text-brand-accent mt-6 mb-3 border-b border-brand-border/40 pb-1">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-lg font-bold font-display uppercase tracking-wider text-brand-accent mt-7 mb-4 border-b border-brand-border pb-1">$1</h1>');

  // Bold emphasis (e.g. **bold**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-brand-text">$1</strong>');

  // Inline code (e.g. `code`)
  html = html.replace(/`(.*?)`/g, '<code class="bg-brand-bg px-1.5 py-0.5 rounded text-xs text-brand-accent font-mono border border-brand-border/50">$1</code>');

  // Unordered Lists (e.g. - list item)
  html = html.replace(/^\-\s+(.*?)$/gm, '<li class="ml-4 list-disc text-xs text-brand-text/90 mb-1">$1</li>');

  // Ordered Lists (e.g. 1. list item)
  html = html.replace(/^\d+\.\s+(.*?)$/gm, '<li class="ml-4 list-decimal text-xs text-brand-text/90 mb-1">$1</li>');

  // Paragraph blocks (converting simple residual line feeds to br breaks)
  // But we skip pre/code elements to keep scripts aligned
  const lines = html.split('\n');
  let inPre = false;
  const processedLines = lines.map(line => {
    if (line.includes('<pre') || line.includes('<code')) {
      inPre = true;
      return line;
    }
    if (line.includes('</pre>') || line.includes('</code>')) {
      inPre = false;
      return line;
    }
    if (inPre) {
      return line;
    }
    // Convert empty lines to break elements
    if (line.trim() === '') {
      return '<div class="h-3"></div>';
    }
    
    // Wrap other normal list statements safely
    if (!line.startsWith('<h') && !line.startsWith('<li') && !line.startsWith('<pre') && !line.startsWith('<div')) {
      return `<p class="text-xs text-brand-text/90 leading-relaxed my-2">${line}</p>`;
    }
    return line;
  });

  return processedLines.join('\n');
}
