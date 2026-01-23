import { Node, mergeAttributes, Editor } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';

export const ScreenplayExtensions = [
    Node.create({
        name: 'sceneHeading',
        group: 'block',
        content: 'text*',

        parseHTML() {
            return [{ tag: 'h3' }];
        },

        renderHTML({ HTMLAttributes }) {
            return ['h3', mergeAttributes(HTMLAttributes, { class: 'scene-heading' }), 0];
        },

        addKeyboardShortcuts() {
            return {
                'Mod-1': () => this.editor.commands.setNode('sceneHeading'),
                'Enter': () => {
                    // After scene heading, default to action
                    return this.editor.commands.insertContent({ type: 'action', content: [] });
                }
            };
        },
    }),

    Node.create({
        name: 'action',
        group: 'block',
        content: 'text*',

        parseHTML() {
            return [{ tag: 'p', getAttrs: node => (node as HTMLElement).classList.contains('action') && null }];
        },

        renderHTML({ HTMLAttributes }) {
            return ['p', mergeAttributes(HTMLAttributes, { class: 'action' }), 0];
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
            return ['p', mergeAttributes(HTMLAttributes, { class: 'character' }), 0];
        },

        addKeyboardShortcuts() {
            return {
                'Mod-3': () => this.editor.commands.setNode('character'),
                'Enter': () => {
                    // After character, default to dialogue
                    return this.editor.commands.insertContent({ type: 'dialogue', content: [] });
                },
                'Tab': () => this.editor.commands.setNode('dialogue'),
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
                'Enter': () => {
                    return this.editor.commands.insertContent({ type: 'action', content: [] });
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
            }
        }
    }),
];
