import { useEffect, useRef } from "react";
import {
  markdownToRichTextHtml,
  sanitizeRichTextHtml,
} from "../lib/richText";

function iconButtonStyle(active, accent) {
  return {
    border: `1px solid ${active ? accent : "rgba(148, 163, 184, 0.24)"}`,
    background: active ? "rgba(167, 139, 250, 0.14)" : "rgba(255,255,255,0.72)",
    color: active ? accent : "#475569",
    borderRadius: "10px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    minWidth: "38px",
    transition: "all 120ms ease",
  };
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "",
  accent = "#8B5CF6",
  minHeight = 220,
}) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);

  const syncFromValue = () => {
    if (!editorRef.current) return;
    const nextHtml = sanitizeRichTextHtml(markdownToRichTextHtml(value || ""));
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  };

  useEffect(() => {
    syncFromValue();
  }, [value]);

  function emitChange() {
    if (!editorRef.current) return;
    const sanitized = sanitizeRichTextHtml(editorRef.current.innerHTML);
    if (editorRef.current.innerHTML !== sanitized) {
      editorRef.current.innerHTML = sanitized;
    }
    onChange(sanitized);
  }

  function captureSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0);
    }
  }

  function restoreSelection() {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  }

  function runCommand(command, commandValue = null) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, commandValue);
    emitChange();
    captureSelection();
  }

  function applyBlock(tagName) {
    runCommand("formatBlock", tagName);
  }

  function handlePaste(event) {
    event.preventDefault();
    const html = event.clipboardData?.getData("text/html");
    const text = event.clipboardData?.getData("text/plain") || "";
    const safeHtml = html
      ? sanitizeRichTextHtml(html)
      : sanitizeRichTextHtml(markdownToRichTextHtml(text));
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, safeHtml);
    emitChange();
  }

  const hasContent = String(value || "").trim().length > 0;

  return (
    <div
      style={{
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: "18px",
        background: "rgba(248, 250, 252, 0.88)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "12px 14px",
          borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
          background: "rgba(255,255,255,0.74)",
        }}
      >
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("bold")} style={iconButtonStyle(false, accent)}>
          B
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("italic")} style={iconButtonStyle(false, accent)}>
          I
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("insertUnorderedList")} style={iconButtonStyle(false, accent)}>
          • List
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("insertOrderedList")} style={iconButtonStyle(false, accent)}>
          1. List
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBlock("H1")} style={iconButtonStyle(false, accent)}>
          H1
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBlock("H2")} style={iconButtonStyle(false, accent)}>
          H2
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyBlock("P")} style={iconButtonStyle(false, accent)}>
          P
        </button>
      </div>
      <div style={{ position: "relative" }}>
        {!hasContent && placeholder ? (
          <div
            style={{
              position: "absolute",
              top: "18px",
              left: "18px",
              right: "18px",
              color: "#94A3B8",
              fontSize: "14px",
              lineHeight: 1.6,
              pointerEvents: "none",
            }}
          >
            {placeholder}
          </div>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={captureSelection}
          onKeyUp={captureSelection}
          onMouseUp={captureSelection}
          onPaste={handlePaste}
          style={{
            minHeight,
            padding: "18px",
            fontSize: "14px",
            lineHeight: 1.7,
            color: "#0F172A",
            outline: "none",
            whiteSpace: "pre-wrap",
          }}
        />
      </div>
    </div>
  );
}
