// Ambient types for `markdown-it-task-lists` (2.1.1), which ships no types and
// has no @types package. Minimal plugin signature — enough to `md.use()` it.
declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it';

  interface TaskListsOptions {
    /** When true, checkboxes are interactive. We leave it falsy → rendered `disabled`. */
    enabled?: boolean;
    /** Wrap the item text in a <label> element. */
    label?: boolean;
    /** Place the wrapping <label> after the checkbox. */
    labelAfter?: boolean;
  }

  const taskLists: (md: MarkdownIt, options?: TaskListsOptions) => void;
  export default taskLists;
}
