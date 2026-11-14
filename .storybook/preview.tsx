import type {Preview} from '@storybook/react-vite';

import {StorybookLocaleProvider} from '../src/stories/storybookI18n';

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    locale: {
      name: 'Language',
      description: 'Language used by the Storybook preview',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        dynamicTitle: true,
        items: [
          {value: 'en', title: 'English'},
          {value: 'zh-CN', title: '简体中文'},
        ],
      },
    },
  },
  decorators: [(Story, context) => {
    const locale = context.globals.locale === 'zh-CN' ? 'zh-CN' : 'en';
    return <StorybookLocaleProvider locale={locale}>
      <div lang={locale}><Story /></div>
    </StorybookLocaleProvider>;
  }],
  parameters: {
    a11y: {test: 'error'},
    controls: {expanded: true},
    layout: 'padded',
    viewport: {
      options: {
        mobile320: {name: 'Mobile 320px', styles: {width: '320px', height: '640px'}, type: 'mobile'},
        mobile375: {name: 'Mobile 375px', styles: {width: '375px', height: '667px'}, type: 'mobile'},
        tablet768: {name: 'Tablet 768px', styles: {width: '768px', height: '1024px'}, type: 'tablet'},
      },
    },
    options: {
      storySort: {
        order: [
          'Components',
          ['Overview', 'Table', 'Extension Table', 'Table Column Visibility', 'Table Filter Presets', 'Table Views'],
          'Integration features',
          ['Overview', 'Selection', 'Query State'],
          'Presets',
          ['Overview', 'Tables'],
          'Advanced helpers',
          ['Overview', 'V3', 'V4'],
          'Internal experiments',
        ],
      },
    },
  },
};

export default preview;
