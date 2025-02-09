import { Mark, mergeAttributes } from '@tiptap/core'

export const FontSize = Mark.create({
    name: 'fontSize',

    addAttributes() {
        return {
            size: {
                default: null,
                parseHTML: element => element.style.fontSize,
                renderHTML: attributes => attributes.size ? { style: `font-size: ${attributes.size}` } : {},
            },
        }
    },

    parseHTML() {
        return [{ tag: 'span[style]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes), 0]
    },

    addCommands() {
        return {
            setFontSize:
                size =>
                    ({ chain }) => {
                        return chain().setMark(this.name, { size }).run()
                    },
            unsetFontSize:
                () =>
                    ({ chain }) => {
                        return chain().unsetMark(this.name).run()
                    },
        }
    },
})