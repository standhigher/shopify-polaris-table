import {renderToString} from 'react-dom/server';

// Official JSX augmentation is loaded by tsconfig, never by a runtime import.
// This fixture tests type/SSR compatibility, not registration or browser behavior.
export function PolarisReact19Fixture() {
  return (
    <>
      <s-table
        paginate
        hasNextPage
        hasPreviousPage
        onNextPage={(event) => event.preventDefault()}
        onPreviousPage={(event) => event.preventDefault()}
      >
        <s-table-header-row>
          <s-table-header listSlot="primary">Name</s-table-header>
        </s-table-header-row>
        <s-table-body>
          <s-table-row><s-table-cell>Inventory item</s-table-cell></s-table-row>
        </s-table-body>
      </s-table>
      <s-checkbox label="Select item" checked indeterminate onChange={(event) => event.preventDefault()} />
      <s-search-field label="Search items" value="query" onInput={(event) => event.preventDefault()} />
      <s-choice-list label="Status" values={['active']}>
        <s-choice value="active">Active</s-choice>
      </s-choice-list>
    </>
  );
}

export function renderFixture(): string {
  return renderToString(<PolarisReact19Fixture />);
}
