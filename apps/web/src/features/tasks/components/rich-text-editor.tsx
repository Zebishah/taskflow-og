import { useCallback, useEffect, useRef, useState } from "react";

import { sanitizeRichText } from "../rich-text-utils";

interface RichTextEditorProps {
  id: string;
  value: string;
  disabled?: boolean;
  error?: string;
  maxLength: number;
  onChange: (value: string) => void;
}

function escapeHtml(value: string): string {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function toEditorHtml(value: string): string {
  if (!value) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(value)) {
    return sanitizeRichText(value);
  }

  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function getPlainTextLength(html: string): number {
  const documentValue = new DOMParser().parseFromString(html, "text/html");
  return documentValue.body.textContent?.length ?? 0;
}

interface ToolbarButtonProps {
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onMouseDown: () => void;
}

function ToolbarButton({
  label,
  title,
  active = false,
  disabled,
  onMouseDown,
}: ToolbarButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      aria-pressed={active}
      onMouseDown={(event) => {
        event.preventDefault();
        onMouseDown();
      }}
      className={[
        "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-violet-200 bg-violet-100 text-violet-700 shadow-sm"
          : "border-transparent text-slate-600 hover:bg-white hover:text-violet-700 hover:shadow-sm",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  id,
  value,
  disabled,
  error,
  maxLength,
  onChange,
}: RichTextEditorProps): React.JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [plainTextLength, setPlainTextLength] = useState(() =>
    getPlainTextLength(toEditorHtml(value)),
  );
  const [activeFormats, setActiveFormats] = useState<Set<string>>(
    () => new Set(),
  );

  const updateActiveFormats = useCallback((): void => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      !editor.contains(selection.anchorNode)
    ) {
      setActiveFormats(new Set());
      return;
    }

    const nextFormats = new Set<string>();
    const stateCommands = [
      ["bold", "bold"],
      ["italic", "italic"],
      ["underline", "underline"],
      ["strikeThrough", "strike"],
      ["insertUnorderedList", "unorderedList"],
      ["insertOrderedList", "orderedList"],
      ["justifyLeft", "alignLeft"],
      ["justifyCenter", "alignCenter"],
      ["justifyRight", "alignRight"],
    ] as const;

    if (typeof document.queryCommandState === "function") {
      stateCommands.forEach(([command, format]) => {
        if (document.queryCommandState(command)) {
          nextFormats.add(format);
        }
      });
    }

    const blockType =
      typeof document.queryCommandValue === "function"
        ? document
            .queryCommandValue("formatBlock")
            .toString()
            .toLowerCase()
            .replace(/[<>]/g, "")
        : "";

    if (blockType === "h2") nextFormats.add("heading");
    if (blockType === "blockquote") nextFormats.add("quote");

    let selectedNode: Node | null = selection.anchorNode;

    while (selectedNode && selectedNode !== editor) {
      if (selectedNode instanceof HTMLAnchorElement) {
        nextFormats.add("link");
        break;
      }

      selectedNode = selectedNode.parentNode;
    }

    setActiveFormats(nextFormats);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;

    if (editor && !isFocused && editor.innerHTML !== toEditorHtml(value)) {
      editor.innerHTML = toEditorHtml(value);
      setPlainTextLength(getPlainTextLength(editor.innerHTML));
    }
  }, [isFocused, value]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);

    return () => {
      document.removeEventListener("selectionchange", updateActiveFormats);
    };
  }, [updateActiveFormats]);

  function emitChange(): void {
    const html = editorRef.current?.innerHTML ?? "";
    const sanitized = sanitizeRichText(html);
    const length = getPlainTextLength(sanitized);

    setPlainTextLength(length);
    onChange(length === 0 ? "" : sanitized);
  }

  function runCommand(command: string, commandValue?: string): void {
    editorRef.current?.focus();

    if (typeof document.execCommand === "function") {
      document.execCommand(command, false, commandValue);
    }

    emitChange();
    updateActiveFormats();
  }

  function addLink(): void {
    if (activeFormats.has("link")) {
      runCommand("unlink");
      return;
    }

    const url = window.prompt("Paste a link (https:// or mailto:)");

    if (url?.trim()) {
      runCommand("createLink", url.trim());
    }
  }

  const countIsInvalid = value.length > maxLength;

  function toggleBlock(format: "heading" | "quote", block: string): void {
    runCommand("formatBlock", activeFormats.has(format) ? "p" : block);
  }

  function toggleAlignment(
    format: "alignLeft" | "alignCenter" | "alignRight",
    command: string,
  ): void {
    runCommand(activeFormats.has(format) ? "justifyLeft" : command);
  }

  return (
    <div
      className={[
        "mt-2 overflow-hidden rounded-2xl border bg-white transition-all duration-200",
        error || countIsInvalid
          ? "border-rose-300 ring-4 ring-rose-50"
          : isFocused
            ? "border-violet-400 ring-4 ring-violet-100"
            : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/90 p-2">
        <ToolbarButton
          label="B"
          title="Bold"
          active={activeFormats.has("bold")}
          disabled={disabled}
          onMouseDown={() => runCommand("bold")}
        />
        <ToolbarButton
          label="I"
          title="Italic"
          active={activeFormats.has("italic")}
          disabled={disabled}
          onMouseDown={() => runCommand("italic")}
        />
        <ToolbarButton
          label="U"
          title="Underline"
          active={activeFormats.has("underline")}
          disabled={disabled}
          onMouseDown={() => runCommand("underline")}
        />
        <ToolbarButton
          label="S"
          title="Strikethrough"
          active={activeFormats.has("strike")}
          disabled={disabled}
          onMouseDown={() => runCommand("strikeThrough")}
        />

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          label="H2"
          title="Heading"
          active={activeFormats.has("heading")}
          disabled={disabled}
          onMouseDown={() => toggleBlock("heading", "h2")}
        />
        <ToolbarButton
          label="¶"
          title="Paragraph"
          disabled={disabled}
          onMouseDown={() => runCommand("formatBlock", "p")}
        />
        <ToolbarButton
          label="“"
          title="Quote"
          active={activeFormats.has("quote")}
          disabled={disabled}
          onMouseDown={() => toggleBlock("quote", "blockquote")}
        />

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          label="• List"
          title="Bullet list"
          active={activeFormats.has("unorderedList")}
          disabled={disabled}
          onMouseDown={() => runCommand("insertUnorderedList")}
        />
        <ToolbarButton
          label="1. List"
          title="Numbered list"
          active={activeFormats.has("orderedList")}
          disabled={disabled}
          onMouseDown={() => runCommand("insertOrderedList")}
        />

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          label="≡"
          title="Align left"
          active={activeFormats.has("alignLeft")}
          disabled={disabled}
          onMouseDown={() => toggleAlignment("alignLeft", "justifyLeft")}
        />
        <ToolbarButton
          label="≣"
          title="Align center"
          active={activeFormats.has("alignCenter")}
          disabled={disabled}
          onMouseDown={() => toggleAlignment("alignCenter", "justifyCenter")}
        />
        <ToolbarButton
          label="☰"
          title="Align right"
          active={activeFormats.has("alignRight")}
          disabled={disabled}
          onMouseDown={() => toggleAlignment("alignRight", "justifyRight")}
        />
        <ToolbarButton
          label="↗"
          title="Add link"
          active={activeFormats.has("link")}
          disabled={disabled}
          onMouseDown={addLink}
        />
        <ToolbarButton
          label="Tx"
          title="Clear formatting"
          disabled={disabled}
          onMouseDown={() => runCommand("removeFormat")}
        />
      </div>

      <div className="relative">
        {!plainTextLength && !isFocused && (
          <span className="pointer-events-none absolute left-4 top-3.5 text-sm text-slate-400">
            Add implementation details, acceptance criteria, or context…
          </span>
        )}

        <div
          ref={editorRef}
          id={id}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={`${id}-label`}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            emitChange();
          }}
          onInput={() => {
            emitChange();
            updateActiveFormats();
          }}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          className="rich-text-content min-h-40 max-h-72 overflow-y-auto px-4 py-3 text-sm leading-6 text-slate-700 outline-none"
        />
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2">
        <span className="text-[11px] text-slate-400">
          Use the toolbar to structure task details
        </span>
        <span
          className={[
            "text-[11px] font-medium",
            countIsInvalid ? "text-rose-600" : "text-slate-400",
          ].join(" ")}
        >
          {plainTextLength} text · {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

interface RichTextContentProps {
  value: string;
  compact?: boolean;
}

export function RichTextContent({
  value,
  compact = false,
}: RichTextContentProps): React.JSX.Element {
  if (!/<[a-z][\s\S]*>/i.test(value)) {
    return (
      <p
        className={[
          "whitespace-pre-wrap",
          compact ? "line-clamp-3" : "",
        ].join(" ")}
      >
        {value}
      </p>
    );
  }

  return (
    <div
      className={[
        "rich-text-content",
        compact ? "rich-text-compact max-h-[4.5rem] overflow-hidden" : "",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(value) }}
    />
  );
}
