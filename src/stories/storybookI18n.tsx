import {createContext, useContext} from 'react';
import type {ReactNode} from 'react';

export type StorybookLocale = 'en' | 'zh-CN';

const StorybookLocaleContext = createContext<StorybookLocale>('en');

export function StorybookLocaleProvider({locale, children}: {locale: StorybookLocale; children: ReactNode}) {
  return <StorybookLocaleContext.Provider value={locale}>{children}</StorybookLocaleContext.Provider>;
}

/** Small, story-only copy helper for examples that own their UI strings. */
export function useStorybookCopy() {
  const locale = useContext(StorybookLocaleContext);

  return {
    locale,
    isChinese: locale === 'zh-CN',
    text: (english: string, chinese: string) => locale === 'zh-CN' ? chinese : english,
  };
}
