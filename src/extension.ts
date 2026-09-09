/**
 * Extension-only public entrypoint. It deliberately excludes the Admin Table
 * and its Shopify Polaris renderer dependency.
 */
export {ExtensionTable, EXTENSION_TABLE_MAX_COLUMNS} from './components/ExtensionTable/ExtensionTable';
export type {
  ExtensionTableCellContext,
  ExtensionTableColumn,
  ExtensionTableColumnType,
  ExtensionTableHostCapabilities,
  ExtensionTableHostContext,
  ExtensionTableLabels,
  ExtensionTableProps,
  ExtensionTableRowAction,
} from './components/ExtensionTable/ExtensionTable';
