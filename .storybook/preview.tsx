import '@shopify/polaris/build/esm/styles.css';

import {AppProvider} from '@shopify/polaris';
import en from '@shopify/polaris/locales/en.json';
import type {Preview} from '@storybook/react-vite';
import type {ReactNode} from 'react';

function PolarisProvider({children}: {children: ReactNode}) {
  return <AppProvider i18n={en}>{children}</AppProvider>;
}

const preview: Preview = {
  decorators: [(Story) => <PolarisProvider><Story /></PolarisProvider>],
  parameters: {
    controls: {expanded: true},
    layout: 'padded',
    options: {
      storySort: {
        order: [
          'Components',
          ['Overview', 'Table'],
          'Features',
          ['Overview', 'Selection', 'Query State'],
          'Presets',
          ['Overview', 'Tables'],
          'Advanced',
          ['Overview', 'V3', 'V4'],
        ],
      },
    },
  },
};

export default preview;
