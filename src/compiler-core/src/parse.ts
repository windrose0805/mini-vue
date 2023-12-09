import { NodeTypes } from "./ast";
const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context, ""));
}

function parseChildren(context, parentTag) {
  const nodes: any[] = [];
  let node;
  while (!isEnd(context, parentTag)) {
    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context);
      }
    }

    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, parentTag) {
  // 遇到结束标签的时候
  // source有值的时候
  const s = context.source;
  if (parentTag && s.startsWith(`</${parentTag}>`)) {
    return true;
  }
  return !s;
}

function parseText(context) {
  let endIndex = context.source.length;
  let endToken = ["<", "{{"];

  for (let i = 0; i < endToken.length; i++) {
    const index = context.source.indexOf(endToken[i]);
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }

  // 取值
  const content = parseTextData(context, endIndex);

  // 推进
  advanceBy(context, content.length);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context, length) {
  return context.source.slice(0, length);
}

function parseElement(context: any) {
  const element: any = parseTag(context, TagType.Start);
  element.children = parseChildren(context, element.tag);
  parseTag(context, TagType.End);
  return element;
}

function parseTag(context: any, type: TagType) {
  // impletement
  // 解析tag
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  // 删除处理完成的代码
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (type === TagType.End) return;
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  const openDelimiter = "{{";
  const closeDelimiter = "}}";
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    closeDelimiter.length
  );

  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length;

  const rawcontent = parseTextData(context, rawContentLength);

  const content = rawcontent.trim();

  advanceBy(context, rawContentLength + closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

// 推进
function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
  };
}

function createParseContext(content: string) {
  return {
    source: content,
  };
}
