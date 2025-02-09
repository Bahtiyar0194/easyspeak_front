import sanitizeHtml from "sanitize-html";

export function sanitize(input) {
    return sanitizeHtml(input, {
        allowedTags: [
            "b",
            "i",
            "u",
            "s",
            "em",
            "strong",
            "a",
            "p",
            "ul",
            "ol",
            "li",
            "br",
            "span",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "blockquote",
            "code",
            "pre",
            "img",
        ],
        allowedStyles: {
            "*": {
                // Разрешенные CSS-свойства
                color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
                "background-color": [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
                "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
                "font-size": [/^\d+(?:px|em|rem|%)$/],
            },
        },
        allowedAttributes: {
            a: ["href", "title", "target"],
            img: ["src", "alt", "width", "height"],
            span: ["class", "style"],
            p: ["style"]
        },

        allowedIframeHostnames: ["www.youtube.com"],
    });
}