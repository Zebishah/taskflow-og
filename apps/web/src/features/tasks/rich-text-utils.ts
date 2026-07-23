const allowedTags = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "DIV",
  "EM",
  "H2",
  "H3",
  "I",
  "LI",
  "OL",
  "P",
  "S",
  "SPAN",
  "STRONG",
  "U",
  "UL",
]);

export function sanitizeRichText(value: string): string {
  const documentValue = new DOMParser().parseFromString(value, "text/html");

  function clean(node: Node): void {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        return;
      }

      if (!(child instanceof HTMLElement)) {
        return;
      }

      if (!allowedTags.has(child.tagName)) {
        const children = Array.from(child.childNodes);
        child.replaceWith(...children);
        children.forEach(clean);
        return;
      }

      Array.from(child.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();

        if (name !== "href" && name !== "style") {
          child.removeAttribute(attribute.name);
        }
      });

      if (child.tagName === "A") {
        const href = child.getAttribute("href")?.trim() ?? "";
        const isSafeLink =
          href.startsWith("https://") ||
          href.startsWith("http://") ||
          href.startsWith("mailto:");

        if (!isSafeLink) {
          child.removeAttribute("href");
        } else {
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener noreferrer");
        }
      } else {
        child.removeAttribute("href");
      }

      const textAlign = child.style.textAlign;
      const allowedAlignment = ["left", "center", "right", "justify"].includes(
        textAlign,
      );

      if (allowedAlignment) {
        child.setAttribute("style", `text-align: ${textAlign}`);
      } else {
        child.removeAttribute("style");
      }

      clean(child);
    });
  }

  clean(documentValue.body);

  return documentValue.body.innerHTML.trim();
}
