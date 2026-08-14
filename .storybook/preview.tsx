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
  },
};

export default preview;
