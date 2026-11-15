import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'matchMedia', {writable: true, value: (query: string) => ({matches: false, media: query, onchange: null, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false})});
class TestResizeObserver { observe() {} unobserve() {} disconnect() {} }
Object.defineProperty(window, 'ResizeObserver', {writable: true, value: TestResizeObserver});
Object.defineProperty(globalThis, 'ResizeObserver', {writable: true, value: TestResizeObserver});

class TestPolarisElement extends HTMLElement {
  private fieldValue = '';
  get value() { return this.fieldValue; }
  set value(value: string) { this.fieldValue = value; }
  values: string[] = [];
  loading = false;
  hasNextPage = false;
  hasPreviousPage = false;
  checked = false;
  indeterminate = false;
  label = '';
  commandFor = '';
  disabled = false;
  // Test-only mirror of the official Runtime's custom-event casing bridge.
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
    if (listener) super.addEventListener(['Remove', 'NextPage', 'PreviousPage'].includes(type) ? type.toLowerCase() : type, listener, options);
  }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) {
    if (listener) super.removeEventListener(['Remove', 'NextPage', 'PreviousPage'].includes(type) ? type.toLowerCase() : type, listener, options);
  }
  connectedCallback() {
    const roleByTag: Record<string, string> = {'s-button': 'button', 's-checkbox': 'checkbox', 's-select': 'combobox', 's-search-field': 'textbox', 's-text-field': 'textbox', 's-table-header': 'columnheader'};
    const role = roleByTag[this.localName];
    if (role) this.setAttribute('role', role);
    if (this.label) this.setAttribute('aria-label', this.label);
  }
}
for (const tagName of ['s-table', 's-table-header-row', 's-table-header', 's-table-body', 's-table-row', 's-table-cell', 's-checkbox', 's-spinner', 's-text', 's-heading', 's-empty-state', 's-banner', 's-button', 's-stack', 's-box', 's-search-field', 's-text-field', 's-select', 's-option', 's-choice-list', 's-choice', 's-clickable-chip', 's-popover', 's-badge', 's-thumbnail']) {
  if (!customElements.get(tagName)) {
    class ElementDouble extends TestPolarisElement {}
    // Testing Library looks for value setters on the immediate prototype.
    Object.defineProperty(ElementDouble.prototype, 'value', Object.getOwnPropertyDescriptor(TestPolarisElement.prototype, 'value')!);
    customElements.define(tagName, ElementDouble);
  }
}

import type {ReactElement} from 'react';
import {cleanup, render as rtlRender} from '@testing-library/react';
import {afterEach} from 'vitest';
export function render(ui: ReactElement, options?: Parameters<typeof rtlRender>[1]) { const result = rtlRender(ui, options); return {...result, rerender: (element: ReactElement) => result.rerender(element)}; }
afterEach(() => cleanup());
