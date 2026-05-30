import { Node, mergeAttributes } from '@tiptap/core';

export const ScreenplayExtensions = [
    Node.create({
        name: 'sceneHeading',
        group: 'block',
        content: 'text*',

        parseHTML() {
            return [{ tag: 'h3', getAttrs: node => (node as HTMLElement).classList.contains('scene-heading') && null }];
        },

        renderHTML({ HTMLAttributes }) {
            return ['h3', mergeAttributes(HTMLAttributes, { class: 'scene-heading' }), 0];
        },

        addKeyboardShortcuts() {
            return {
                'Mod-1': () => this.editor.commands.setNode('sceneHeading'),
                'Enter': () => {
                    return this.editor.commands.insertContent({ type: 'action', content: [] });
                },
            };
        },
        // Auto-capitalize Scene Headings
        onUpdate() {
            // Implementation for auto-caps could be added here or via a dedicated extension
        }
    }),

    Node.create({
        name: 'action',
        group: 'block',
        content: 'text*',

        parseHTML() {
            return [{ tag: 'p', getAttrs: node => (node as HTMLElement).classList.contains('action') && null }];
        },

        renderHTML({ HTMLAttributes }) {
            return ['p', mergeAttributes(HTMLAttributes, { class: 'action font-courier' }), 0];
        },
        addKeyboardShortcuts() {
            return {
                'Mod-2': () => this.editor.commands.setNode('action'),
            }
        }
    }),

    Node.create({
        name: 'character',
        group: 'block',
        content: 'text*',

        parseHTML() {
            return [{ tag: 'p', getAttrs: node => (node as HTMLElement).classList.contains('character') && null }];
        },

        renderHTML({ HTMLAttributes }) {
            return ['p', mergeAttributes(HTMLAttributes, { class: 'character uppercase' }), 0];
        },

        addKeyboardShortcuts() {
            return {
                'Mod-3': () => this.editor.commands.setNode('character'),
                'Enter': () => {
                    return this.editor.commands.insertContent({ type: 'dialogue', content: [] });
                },
                'Tab': ({ editor }) => {
                    return editor.commands.setNode('parenthetical');
                }
            };
        },
    }),

    Node.create({
        name: 'dialogue',
        group: 'block',
        content: 'text*',

        parseHTML() {
            return [{ tag: 'p', getAttrs: node => (node as HTMLElement).classList.contains('dialogue') && null }];
        },

        renderHTML({ HTMLAttributes }) {
            return ['p', mergeAttributes(HTMLAttributes, { class: 'dialogue' }), 0];
        },

        addKeyboardShortcuts() {
            return {
                'Mod-4': () => this.editor.commands.setNode('dialogue'),
                'Enter': ({ editor }) => {
                    // If Enter is pressed, usually goes back to Character if rapid fire, or Action.
                    // We'll default to Character for faster dialogue writing.
                    return editor.commands.insertContent({ type: 'character', content: [] });
                },
                'Tab': ({ editor }) => {
                    return editor.commands.setNode('parenthetical');
                }
            };
        },
    }),

    Node.create({
        name: 'parenthetical',
        group: 'block',
        content: 'text*',

        parseHTML() {
            return [{ tag: 'p', getAttrs: node => (node as HTMLElement).classList.contains('parenthetical') && null }];
        },

        renderHTML({ HTMLAttributes }) {
            return ['p', mergeAttributes(HTMLAttributes, { class: 'parenthetical' }), 0];
        },
        addKeyboardShortcuts() {
            return {
                'Mod-5': () => this.editor.commands.setNode('parenthetical'),
                'Enter': ({ editor }) => {
                    return editor.commands.insertContent({ type: 'dialogue', content: [] });
                }
            }
        }
    }),
];
