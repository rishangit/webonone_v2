/**
 * One-off: remove ClickUp traceability and references from spec/**.
 * Run: node tooling/scripts/strip-spec-clickup.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SPEC_ROOT = path.resolve(import.meta.dirname, '../../spec');

const SECTION_HEADINGS_TO_DROP = new Set([
  'clickup traceability',
  'clickup subtask traceability',
  'clickup mapping',
  'subtask mapping (clickup)',
  'clickup source',
  'clickup',
]);

function headingLevel(line) {
  const m = /^(\#{1,6})\s/.exec(line);
  return m ? m[1].length : 0;
}

function normalizeHeadingTitle(line) {
  const m = /^#{1,6}\s+(.+?)\s*$/.exec(line);
  return m ? m[1].trim().toLowerCase() : '';
}

function isTableLine(line) {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|');
}

function dropClickUpMappingBlock(lines, startIndex) {
  // ## ClickUp mapping — drop heading + table only; keep ### child sections.
  let i = startIndex + 1;
  while (i < lines.length && lines[i].trim() === '') i++;
  while (i < lines.length && isTableLine(lines[i])) i++;
  while (i < lines.length && lines[i].trim() === '') i++;
  return i;
}

function dropClickUpSections(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const level = headingLevel(line);
    if (level > 0) {
      const title = normalizeHeadingTitle(line);
      if (title === 'clickup mapping') {
        i = dropClickUpMappingBlock(lines, i);
        continue;
      }
      if (SECTION_HEADINGS_TO_DROP.has(title)) {
        i++;
        while (i < lines.length) {
          const nextLevel = headingLevel(lines[i]);
          if (nextLevel > 0 && nextLevel <= level) break;
          i++;
        }
        continue;
      }
    }
    out.push(line);
    i++;
  }

  return out.join('\n');
}

function renameHeadings(text) {
  return text
    .replace(/^#{1,6}\s+Entity summary \(from ClickUp\)\s*$/gim, '## Entity summary')
    .replace(/^#{1,6}\s+Source requirements \(from ClickUp parent\)\s*$/gim, '### Source requirements')
    .replace(/^#{1,6}\s+Requirements \(from ClickUp\)\s*$/gim, '### Requirements')
    .replace(/^#{1,6}\s+Requirement \(from ClickUp\)\s*$/gim, '## Requirement')
    .replace(/^#{1,6}\s+Requirement \(ClickUp subtask\)\s*$/gim, '## Requirement')
    .replace(/^#{1,6}\s+Acceptance criteria \(from ClickUp parent\)\s*$/gim, '### Acceptance criteria')
    .replace(/^#{1,6}\s+Subtask requirements \(ClickUp [^)]+\)\s*$/gim, '## Subtask requirements')
    .replace(/^#{1,6}\s+Source requirements \(from ClickUp subtask\)\s*$/gim, '### Source requirements')
    .replace(/^#{1,6}\s+ClickUp subtask mapping\s*$/gim, '## Subtask mapping');
}

function cleanLines(text) {
  const lines = text.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const t = line.trim();
    if (/^ClickUp:\s/i.test(t)) return false;
    if (/^-\s*\[[ x]\]\s*ClickUp parent/i.test(t)) return false;
    if (/^-\s*ClickUp IDs\b/i.test(t)) return false;
    if (/^-\s*\*\*ClickUp IDs/i.test(t)) return false;
    if (/^-\s*Create ClickUp\b/i.test(t)) return false;
    if (/^\|\s*ClickUp\s*\|/i.test(t)) return false;
    if (/^\|[-:]+\|[-:]+\|/.test(t) && /clickup/i.test(t)) return false;
    return true;
  });
  return filtered.join('\n');
}

function inlineClean(text) {
  let s = text;
  s = s.replace(/\s*·\s*ClickUp\s+\[[^\]]*\]\([^)]*\)/gi, '');
  s = s.replace(/\*\*Goal:\*\*\s*ClickUp\s+\[[^\]]*\]\([^)]*\)\s*/gi, '');
  s = s.replace(/Implements ClickUp subtask/gi, 'Implements subtask');
  s = s.replace(/ClickUp AC text/gi, 'Acceptance criteria text');
  s = s.replace(/ClickUp AC mentions/gi, 'Acceptance criteria mention');
  s = s.replace(/Subtask \*\*([^*]+)\*\* \([a-z0-9]+\):/gi, 'Subtask **$1**:');
  s = s.replace(/Status string for ClickUp is/gi, 'Status string is');
  s = s.replace(/explicitly excluded by ClickUp/gi, 'explicitly excluded by acceptance criteria');
  s = s.replace(/\*\*Mapping ClickUp labels:\*\*/gi, '**Mapping labels:**');
  s = s.replace(/defined in ClickUp subtask/gi, 'defined in source subtask');
  s = s.replace(/\(from ClickUp\)/gi, '');
  s = s.replace(/\(from ClickUp parent\)/gi, '');
  s = s.replace(/from ClickUp parent/gi, 'from product requirements');
  s = s.replace(/synced ClickUp traceability to/gi, 'synced traceability to');
  s = s.replace(/when product tracking is required/gi, 'when external tracking is required');
  s = s.replace(/Create ClickUp `\[[^\]]+\]` parent/gi, 'Create user-story parent');
  s = s.replace(/List only — do \*\*not\*\* run during `\/clickup-plan`:/gi, 'List only:');
  s = s.replace(/do not run during `\/clickup-plan`/gi, 'do not run during planning-only passes');
  s = s.replace(/during `\/clickup-plan`/gi, 'during planning-only passes');
  s = s.replace(/\[([^\]]+)\]\(https:\/\/app\.clickup\.com\/[^)]+\)/gi, '');
  s = s.replace(/https:\/\/app\.clickup\.com\/[^\s\])`]+/gi, '');
  s = s.replace(/ClickUp:\s*TBD\s*/gi, '');
  // Collapse awkward double spaces (not at line start — preserve markdown indentation)
  s = s.replace(/[^\S\n][ \t]{2,}/g, (m) => m[0] + ' ');
  s = s.replace(/\n{4,}/g, '\n\n\n');
  return s;
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(md|mdc)$/i.test(name)) files.push(p);
  }
  return files;
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let text = original;
  text = dropClickUpSections(text);
  text = renameHeadings(text);
  text = cleanLines(text);
  text = inlineClean(text);
  text = text.replace(/\n{3,}/g, '\n\n');
  if (text !== original) {
    fs.writeFileSync(filePath, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
    return true;
  }
  return false;
}

const files = walk(SPEC_ROOT);
let changed = 0;
for (const f of files) {
  if (processFile(f)) changed++;
}
console.log(`Updated ${changed} / ${files.length} spec files.`);
