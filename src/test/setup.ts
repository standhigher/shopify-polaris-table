import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'ResizeObserver', {writable: true, value: TestResizeObserver});
Object.defineProperty(globalThis, 'ResizeObserver', {writable: true, value: TestResizeObserver});


import {AppProvider} from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import type {ReactElement} from 'react';
import {createElement} from 'react';
import {cleanup, render as rtlRender} from '@testing-library/react';
import {afterEach} from 'vitest';

export function render(ui: ReactElement, options?: Parameters<typeof rtlRender>[1]) {
  const wrap = (element: ReactElement) => createElement(AppProvider, {i18n: en}, element);
  const result = rtlRender(wrap(ui), options);
  return {...result, rerender: (element: ReactElement) => result.rerender(wrap(element))};
}

afterEach(() => cleanup());
