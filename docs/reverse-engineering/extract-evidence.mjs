import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readCsv } from './csv.mjs';

const output = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(output, '..', '..');
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;
const unique = values => [...new Set(values)].sort();
function files(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file, extension) : file.endsWith(extension) ? [file] : [];
  }).sort();
}
function read(file) {
  const bytes = fs.readFileSync(file);
  let text;
  let encoding = 'utf-8';
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    encoding = 'windows-1255';
    text = new TextDecoder(encoding).decode(bytes);
  }
  return { file: relative(file), text, encoding, bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    lines: text.split('\n').length };
}
function maskComments(text, java = false) {
  if (!java) return text.replace(/<!--[\s\S]*?-->|<%--[\s\S]*?--%>/g,
    match => match.replace(/[^\r\n]/g, ' '));
  let result = '';
  let state = 'code';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (state === 'line') {
      result += c === '\n' || c === '\r' ? c : ' ';
      if (c === '\n') state = 'code';
    } else if (state === 'block') {
      if (c === '*' && n === '/') { result += '  '; i++; state = 'code'; }
      else result += c === '\n' || c === '\r' ? c : ' ';
    } else if (state === '"' || state === "'") {
      result += c;
      if (c === '\\' && n !== undefined) { result += n; i++; }
      else if (c === state) state = 'code';
    } else if (c === '/' && n === '/') { result += '  '; i++; state = 'line'; }
    else if (c === '/' && n === '*') { result += '  '; i++; state = 'block'; }
    else { result += c; if (c === '"' || c === "'") state = c; }
  }
  return result;
}
function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)]
    .map(match => [match[1], match[2]]));
}
function csv(name, rows, columns) {
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  fs.writeFileSync(path.join(output, name),
    [columns, ...rows.map(row => columns.map(column => row[column]))]
      .map(row => row.map(quote).join(',')).join('\n') + '\n');
}
const parseCsv = name => readCsv(path.join(output, name));

const java = [
  ...files(path.join(root, 'old', 'SHF', 'src'), '.java'),
  ...files(path.join(root, 'old', 'SHFEJB', 'ejbModule', 'ejbs'), '.java')
].map(read);
const jsp = files(path.join(root, 'old', 'SHFWeb', 'WebContent', 'jsp'), '.jsp').map(read);
const js = files(path.join(root, 'old', 'SHFWeb', 'WebContent', 'js'), '.js')
  .filter(file => !path.basename(file).startsWith('jquery-')).map(read);
const descriptors = [
  'old\\SHFWeb\\WebContent\\WEB-INF\\struts-config.xml',
  'old\\SHFWeb\\WebContent\\WEB-INF\\validation.xml',
  'old\\SHFEJB\\ejbModule\\META-INF\\ejb-jar.xml',
  'old\\SHFEAR\\META-INF\\application.xml',
  'old\\SHFEJBEAR\\META-INF\\application.xml',
  'old\\SHFWeb\\.settings\\org.eclipse.wst.common.project.facet.core.xml',
  'old\\SHF\\.settings\\org.eclipse.wst.common.project.facet.core.xml',
  'old\\SHFWeb\\.classpath', 'old\\SHF\\.classpath',
  'old\\SharedLibraries\\bzq\\bzq\\shfsp\\request\\SHFSPBreaks.xsd',
  'old\\SharedLibraries\\bzq\\bzq\\shfsp\\response\\SHFSPBreaks_response.xsd'
].map(file => read(path.join(root, file)));
const all = [...java, ...jsp, ...js, ...descriptors];
csv('source-manifest.csv', all, ['file', 'encoding', 'bytes', 'lines', 'sha256']);
const classes = [], methods = [], fields = [], dbUsage = [], errors = [], parameters = [], dispatch = [];
for (const source of java) {
  const code = maskComments(source.text, true);
  const packageName = code.match(/\bpackage\s+([\w.]+)\s*;/)?.[1] ?? '';
  const classMatch = code.match(/\b(?:class|interface|enum)\s+(\w+)(?:\s+extends\s+([\w.]+))?/);
  const className = classMatch ? `${packageName}.${classMatch[1]}` : '';
  classes.push({ file: source.file, line: classMatch ? lineAt(code, classMatch.index) : 1,
    class: className, extends: classMatch?.[2] ?? '', layer: source.file.split('/').at(-2) });
  const declarations = [...code.matchAll(/^[ \t]*(?:public|private|protected)\s+(?:(?:static|final|synchronized|abstract)\s+)*(?:[\w<>,.[\]?]+\s+)?(\w+)\s*\(([^;{}]*)\)\s*(?:throws\s+[\w.,\s]+)?\{/gm)];
  for (const match of declarations) {
    methods.push({ file: source.file, line: lineAt(code, match.index), class: className,
      method: match[1], signature: match[0].replace(/\s+/g, ' ').trim().replace(/\{$/, '').trim() });
  }
  const ownerAt = index => declarations.filter(match => match.index <= index).at(-1)?.[1] ?? '';
  for (const match of code.matchAll(/^[ \t]*(?:public|private|protected)\s+(?:(?:static|final)\s+)*([\w<>,.[\]?]+)\s+(\w+)\s*(?:=[^;]*)?;/gm)) {
    fields.push({ file: source.file, line: lineAt(code, match.index), class: className, type: match[1], field: match[2] });
  }
  for (const match of code.matchAll(/\b(from|join|update|insert\s+into|delete\s+from|merge\s+into)\s+((?:shifter\.)?shf_[a-z0-9_]+)\b/gi)) {
    dbUsage.push({ file: source.file, line: lineAt(code, match.index), method: ownerAt(match.index),
      operation: match[1].toUpperCase().replace(/\s+/g, ' '), object: match[2].toUpperCase(),
      evidence: 'source-sql-lexical' });
  }
  for (const match of code.matchAll(/\b(SHF_[A-Z0-9_]+)\s*\.\s*NEXTVAL\b|(?:getNextSequence|setFunction)\s*\(\s*"((?:[Ss][Hh][Ii][Ff][Tt][Ee][Rr]\.)?[A-Za-z0-9_]+)"/g)) {
    dbUsage.push({ file: source.file, line: lineAt(code, match.index), method: ownerAt(match.index),
      operation: match[1] ? 'NEXTVAL' : 'SEQUENCE_OR_FUNCTION', object: (match[1] ?? match[2]).toUpperCase(),
      evidence: 'source-symbol' });
  }
  for (const match of code.matchAll(/\bSHIFTER\.SHF_ins_and_return_lastId\b/gi))
    dbUsage.push({ file: source.file, line: lineAt(code, match.index), method: ownerAt(match.index),
      operation: 'FUNCTION_CALL_MUTATES', object: match[0].toUpperCase(), evidence: 'source-function-reference' });
  for (const match of code.matchAll(/new\s+ActionError\s*\(\s*"([^"]+)"/g))
    errors.push({ file: source.file, line: lineAt(code, match.index), method: ownerAt(match.index), key: match[1] });
  for (const match of code.matchAll(/getParameter\s*\(\s*"((?:shf\.)[^"]+)"/g))
    parameters.push({ file: source.file, line: lineAt(code, match.index), method: ownerAt(match.index), key: match[1] });
  for (const match of code.matchAll(/(?:param|action|mode)\.equals(?:IgnoreCase)?\s*\(\s*"([^"]+)"|"([^"]+)"\.equals(?:IgnoreCase)?\s*\(\s*(?:param|action|mode)\s*\)/g))
    dispatch.push({ file: source.file, line: lineAt(code, match.index), method: ownerAt(match.index), branch: match[1] ?? match[2] });
}
csv('classes.csv', classes, ['file', 'line', 'class', 'extends', 'layer']);
csv('methods.csv', methods, ['file', 'line', 'class', 'method', 'signature']);
csv('fields.csv', fields, ['file', 'line', 'class', 'type', 'field']);
csv('validation-errors.csv', errors, ['file', 'line', 'method', 'key']);
csv('parameter-keys.csv', parameters, ['file', 'line', 'method', 'key']);
csv('dispatch-branches.csv', dispatch, ['file', 'line', 'method', 'branch']);
const classMap = new Map(classes.map(item => [item.class, item.file]));
const config = descriptors[0];
const xml = maskComments(config.text);
const forms = [...xml.matchAll(/<form-bean\b[^>]*>/g)].map(match => ({
  ...attrs(match[0]), file: config.file, line: lineAt(xml, match.index)
}));
const formMap = new Map(forms.map(form => [form.name, form.type]));
const routes = [], forwards = [];
for (const match of xml.matchAll(/<action(?=\s)[^>]*(?:\/>|>[\s\S]*?<\/action>)/g)) {
  const a = attrs(match[0].slice(0, match[0].indexOf('>') + 1));
  const values = Object.fromEntries((a.parameter ?? '').split(',').map(value => {
    const [key, ...rest] = value.split('='); return [key.trim(), rest.join('=').trim()];
  }));
  const route = { file: config.file, line: lineAt(xml, match.index), path: a.path,
    action: a.type, action_source: classMap.get(a.type) ?? '', form: a.name ?? '',
    form_type: formMap.get(a.name) ?? '', form_source: classMap.get(formMap.get(a.name)) ?? '',
    dispatch_lines: dispatch.filter(d => d.file === classMap.get(a.type) && d.branch === values.param).map(d => d.line).join(';'),
    scope: a.scope ?? '(Struts default)',
    validate: a.validate ?? '(Struts default)', param: values.param ?? '',
    activity: values.activity ?? '', parameter: a.parameter ?? '' };
  routes.push(route);
  for (const forward of match[0].matchAll(/<forward\b[^>]*>/g)) {
    const f = attrs(forward[0]);
    forwards.push({ file: config.file, line: lineAt(xml, match.index + forward.index),
      route: a.path, name: f.name, target: f.path, redirect: f.redirect ?? 'false' });
  }
}
const globalBlock = xml.match(/<global-forwards>([\s\S]*?)<\/global-forwards>/);
if (globalBlock) {
  for (const match of globalBlock[0].matchAll(/<forward\b[^>]*>/g)) {
    const f = attrs(match[0]);
    forwards.push({ file: config.file, line: lineAt(xml, globalBlock.index + match.index),
      route: '(global)', name: f.name, target: f.path, redirect: f.redirect ?? 'false' });
  }
}
csv('forms.csv', forms, ['file', 'line', 'name', 'type']);
csv('routes.csv', routes, ['file', 'line', 'path', 'action', 'action_source', 'form', 'form_type', 'form_source', 'dispatch_lines', 'scope', 'validate', 'param', 'activity', 'parameter']);
csv('forwards.csv', forwards, ['file', 'line', 'route', 'name', 'target', 'redirect']);
const navigation = [], controls = [], screens = [];
for (const source of [...jsp, ...js]) {
  const code = source.file.endsWith('.js') ? maskComments(source.text, true) : maskComments(source.text);
  const targets = unique([...code.matchAll(/\/shf\/[A-Za-z0-9_./-]+\.(?:do|jsp)(?:\?[^"'\s<>]*)?/g)].map(match => match[0]));
  for (const match of code.matchAll(/\/shf\/[A-Za-z0-9_./-]+\.(?:do|jsp)(?:\?[^"'\s<>]*)?/g))
    navigation.push({ file: source.file, line: lineAt(code, match.index), target: match[0], kind: 'literal-reference-not-proven-transition' });
  for (const match of code.matchAll(/<(?:html:)?(?:input|select|textarea|button|text|hidden|checkbox|radio|form)\b[^>]*>|<shf:[\w]+\b[^>]*>/gi)) {
    const a = attrs(match[0]);
    controls.push({ file: source.file, line: lineAt(code, match.index),
      tag: match[0].match(/^<([\w:]+)/)[1], name: a.name ?? '', property: a.property ?? '',
      type: a.type ?? '', action: a.action ?? '', activity: a.activity ?? '' });
  }
  if (source.file.endsWith('.jsp')) screens.push({ file: source.file, line: 1,
    role: /\/submenu\//.test(source.file) ? 'navigation-fragment' : 'jsp-artifact-not-necessarily-screen',
    title: code.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].replace(/\s+/g, ' ').trim() ?? '',
    activities: unique([...code.matchAll(/activity="([^"]+)"/g)].map(match => match[1])).join(';'),
    targets: targets.join(';'),
    includes: unique([...code.matchAll(/<(?:jsp:include|%@\s*include)\b[^>]*(?:page|file)="([^"]+)"/g)].map(match => match[1])).join(';'),
    forward_routes: unique(forwards.filter(f => f.target === source.file.split('/WebContent')[1]).map(f => f.route)).join(';') });
}
csv('screens.csv', screens, ['file', 'line', 'role', 'title', 'activities', 'targets', 'includes', 'forward_routes']);
csv('navigation.csv', navigation, ['file', 'line', 'target', 'kind']);
csv('screen-controls.csv', controls, ['file', 'line', 'tag', 'name', 'property', 'type', 'action', 'activity']);
const objects = parseCsv('oracle-objects.csv');
const objectMap = new Map(objects.map(o => [o.OBJECT_NAME, o.OBJECT_TYPE]));
for (const usage of dbUsage) usage.test_dictionary_match = objectMap.get(usage.object.replace(/^SHIFTER\./, '')) ?? 'NOT_FOUND_OR_EXTERNAL';
csv('database-usage.csv', dbUsage, ['file', 'line', 'method', 'operation', 'object', 'evidence', 'test_dictionary_match']);
const constraints = parseCsv('oracle-constraints.csv');
const columns = parseCsv('oracle-columns.csv');
const schemaMap = objects.filter(o => ['TABLE', 'VIEW'].includes(o.OBJECT_TYPE)).map(object => {
  const uses = dbUsage.filter(u => u.object.replace(/^SHIFTER\./, '') === object.OBJECT_NAME);
  const c = constraints.filter(c => c.TABLE_NAME === object.OBJECT_NAME);
  return { object: object.OBJECT_NAME, type: object.OBJECT_TYPE,
    columns: columns.filter(c => c.TABLE_NAME === object.OBJECT_NAME).length,
    primary_key: [...new Set(c.filter(c => c.CONSTRAINT_TYPE === 'P')
      .sort((a, b) => Number(a.POSITION) - Number(b.POSITION)).map(c => c.COLUMN_NAME))].join(';'),
    foreign_keys: unique(c.filter(c => c.CONSTRAINT_TYPE === 'R').map(c => c.CONSTRAINT_NAME)).length,
    source_sites: uses.length,
    reads: uses.filter(u => ['FROM', 'JOIN'].includes(u.operation)).length,
    writes: uses.filter(u => ['UPDATE', 'INSERT INTO', 'DELETE FROM', 'MERGE INTO'].includes(u.operation)).length,
    sources: unique(uses.map(u => u.file)).join(';'),
    status: uses.length ? 'test-metadata-and-lexical-source-reference' : 'test-metadata-only-no-reference-in-scanned-subset' };
});
csv('schema-usage-map.csv', schemaMap, ['object', 'type', 'columns', 'primary_key', 'foreign_keys', 'source_sites', 'reads', 'writes', 'sources', 'status']);
const physical = {
  context: parseCsv('oracle-context.csv'),
  object_counts: Object.fromEntries(unique(objects.map(o => o.OBJECT_TYPE)).map(type => [type, objects.filter(o => o.OBJECT_TYPE === type).length])),
  columns: parseCsv('oracle-columns.csv').length,
  constraints: unique(parseCsv('oracle-constraints.csv').map(c => c.CONSTRAINT_NAME)).length,
  foreign_keys: unique(parseCsv('oracle-constraints.csv').filter(c => c.CONSTRAINT_TYPE === 'R').map(c => c.CONSTRAINT_NAME)).length,
  indexes: unique(parseCsv('oracle-indexes.csv').map(i => i.INDEX_NAME)).length,
  synonyms: parseCsv('oracle-synonyms.csv').length, triggers: parseCsv('oracle-triggers.csv').length
};
for (const name of fs.readdirSync(output).filter(name => name.startsWith('oracle-') && name.endsWith('.csv')))
  parseCsv(name);
const summary = { generated_at: new Date().toISOString(), scope: 'Static lexical inventories, not runtime coverage or full semantic proof',
  sources: all.length, java: java.length, jsp: jsp.length, application_js: js.length,
  classes: classes.length, methods: methods.length, fields: fields.length,
  form_beans: forms.length, routes: routes.length, forwards: forwards.length,
  route_paths_unique: new Set(routes.map(r => r.path)).size,
  duplicate_routes: unique(routes.map(r => r.path)).filter(p => routes.filter(r => r.path === p).length > 1)
    .map(p => ({ path: p, lines: routes.filter(r => r.path === p).map(r => r.line) })),
  action_forwards: forwards.filter(f => f.route !== '(global)').length,
  global_forwards: forwards.filter(f => f.route === '(global)').length,
  route_action_sources_missing: unique(routes.filter(r => !r.action_source && !r.action.startsWith('org.apache.struts.')).map(r => r.action)),
  dispatch_branches: dispatch.length, navigation_references: navigation.length,
  controls: controls.length, validation_error_sites: errors.length,
  database_usage_sites: dbUsage.length, database_objects: unique(dbUsage.map(u => u.object)),
  database_objects_unmatched: unique(dbUsage.filter(u => u.test_dictionary_match === 'NOT_FOUND_OR_EXTERNAL').map(u => u.object)),
  tables_with_source_references: schemaMap.filter(o => o.type === 'TABLE' && o.source_sites > 0).length,
  tables_without_source_references: schemaMap.filter(o => o.type === 'TABLE' && o.source_sites === 0).map(o => o.object),
  physical };
fs.writeFileSync(path.join(output, 'coverage.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ ...summary, database_objects: summary.database_objects.length,
  database_objects_unmatched: summary.database_objects_unmatched }, null, 2));
