const ALLOWED_TAGS = new Set(["STRONG", "B", "EM", "I", "UL", "OL", "LI", "H1", "H2", "H3", "P", "BR"]);

function looksLikeHtml(value = "") {
  return /<[^>]+>/.test(String(value || ""));
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeNode(node, doc) {
  if (!node) return null;

  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tag = node.tagName.toUpperCase();
  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = doc.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child, doc);
      if (sanitizedChild) fragment.appendChild(sanitizedChild);
    });
    return fragment;
  }

  const normalizedTag = tag === "B" ? "strong" : tag === "I" ? "em" : tag.toLowerCase();
  const safeEl = doc.createElement(normalizedTag);
  Array.from(node.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child, doc);
    if (sanitizedChild) safeEl.appendChild(sanitizedChild);
  });
  return safeEl;
}

export function sanitizeRichTextHtml(input = "") {
  const parser = new DOMParser();
  const source = parser.parseFromString(`<div>${input || ""}</div>`, "text/html");
  const cleanDoc = document.implementation.createHTMLDocument("");
  const wrapper = cleanDoc.createElement("div");

  Array.from(source.body.firstChild?.childNodes || []).forEach((child) => {
    const sanitized = sanitizeNode(child, cleanDoc);
    if (sanitized) wrapper.appendChild(sanitized);
  });

  return wrapper.innerHTML;
}

function asSanitizedHtml(input = "") {
  if (looksLikeHtml(input)) {
    return sanitizeRichTextHtml(input);
  }
  return sanitizeRichTextHtml(markdownToRichTextHtml(input));
}

function renderInlineMarkdown(text = "") {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(.+?)\*/g, "$1<em>$2</em>");
}

export function richTextToMarkdown(inputHtml = "") {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${asSanitizedHtml(inputHtml)}</div>`, "text/html");

  function inline(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const text = Array.from(node.childNodes).map(inline).join("");
    switch (node.tagName.toLowerCase()) {
      case "strong":
        return `**${text.trim() || text}**`;
      case "em":
        return `*${text.trim() || text}*`;
      case "br":
        return "\n";
      default:
        return text;
    }
  }

  function blockListItem(node, ordered, index, depth) {
    const prefix = ordered ? `${index + 1}. ` : "- ";
    const indent = depth > 0 ? "  ".repeat(depth) : "";
    let value = "";

    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE && (child.tagName.toLowerCase() === "ul" || child.tagName.toLowerCase() === "ol")) {
        value += `\n${Array.from(child.children).map((nested, nestedIndex) => blockListItem(nested, child.tagName.toLowerCase() === "ol", nestedIndex, depth + 1)).join("")}`;
      } else {
        value += inline(child);
      }
    });

    value = value.trim();
    return `${indent}${prefix}${value}\n`;
  }

  function block(node, depth = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || "").trim();
      return text ? `${text}\n` : "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const tag = node.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      return `${Array.from(node.children).map((child, index) => blockListItem(child, tag === "ol", index, depth)).join("")}\n`;
    }

    if (tag === "li") {
      return blockListItem(node, false, 0, depth);
    }

    const content = Array.from(node.childNodes).map((child) => inline(child)).join("").replace(/\n{3,}/g, "\n\n").trim();
    if (!content) return "";

    if (tag === "h1") return `# ${content}\n\n`;
    if (tag === "h2") return `## ${content}\n\n`;
    if (tag === "h3") return `### ${content}\n\n`;
    return `${content}\n\n`;
  }

  const output = Array.from(doc.body.firstChild?.childNodes || [])
    .map((child) => block(child))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return output;
}

export function markdownToRichTextHtml(input = "") {
  const text = String(input || "").replace(/\r\n/g, "\n");
  if (!text.trim()) return "";
  if (looksLikeHtml(text)) {
    return sanitizeRichTextHtml(text);
  }

  const rawLines = text.split("\n");
  const lines = [];

  for (let i = 0; i < rawLines.length; i += 1) {
    const current = rawLines[i];
    const trimmed = current.trim();
    const next = rawLines[i + 1];

    if (/^([•*-]|\d+[.)])$/.test(trimmed) && typeof next === "string" && next.trim()) {
      lines.push(`${trimmed} ${next.trim()}`);
      i += 1;
      continue;
    }

    lines.push(current);
  }

  const html = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${renderInlineMarkdown(paragraph.join("<br />"))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!listItems.length || !listType) return;
    html.push(`<${listType}>${listItems.join("")}</${listType}>`);
    listItems = [];
    listType = null;
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      html.push(`<h${headingMatch[1].length}>${renderInlineMarkdown(headingMatch[2])}</h${headingMatch[1].length}>`);
      return;
    }

    const orderedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    const bulletMatch = trimmed.match(/^(?:[-*•])\s+(.*)$/);
    if (orderedMatch || bulletMatch) {
      flushParagraph();
      const nextType = orderedMatch ? "ol" : "ul";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push(`<li>${renderInlineMarkdown(orderedMatch ? orderedMatch[2] : bulletMatch[1])}</li>`);
      return;
    }

    flushList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();

  return html.join("");
}

export function richTextToPlainText(input = "") {
  if (looksLikeHtml(input)) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${asSanitizedHtml(input)}</div>`, "text/html");
    return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  }

  return String(input || "")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeRichTextForAi(input = "") {
  return richTextToMarkdown(asSanitizedHtml(input));
}
