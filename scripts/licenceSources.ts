// scripts/licenceSources.ts — the hand-checked facts the third-party licence file needs and the build cannot
// derive (M13 task 7.2a). Everything else — which packages ship, their versions, their licence files, which code a
// package pre-bundled (its source maps) — is read from the build by scripts/licenceInventory.ts and
// scripts/licenceNotices.ts. Every row here is keyed by an exact version, so an upgrade fails the build until the
// row is re-checked. Texts live in scripts/licences/ (each file's source is named where it is used).

/** Licences Peekover accepts. Anything else stops generation (the task's licence check, kept as code). */
export const PERMISSIVE = new Set(['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'LicenseRef-TextMate-bundle']);

/** Texts printed once at the end of the file and referred to by name (Apache-2.0 allows one shared copy). */
export const SHARED_TEXTS = {
  'Apache-2.0': {
    title: 'Apache License, Version 2.0',
    file: 'apache-2.0.txt', // chevrotain 11.1.2's LICENSE.txt, the standard text
  },
  MIT: {
    title: 'MIT License (the standard text, for the snippets above that name MIT without a text of their own)',
    file: 'mit.txt', // https://opensource.org/license/mit
  },
} as const;
export type SharedText = keyof typeof SHARED_TEXTS;

/** A package that publishes no SPDX `license` field, or a choice between licences. */
export const LICENCE_OVERRIDES: Record<string, { spdx: string; note?: string; shared?: SharedText }> = {
  'khroma@2.1.0': { spdx: 'MIT', note: 'package.json names no licence; its license file is the MIT License.' },
  'dompurify@3.4.17': {
    spdx: 'Apache-2.0',
    shared: 'Apache-2.0',
    note:
      'DOMPurify is offered under MPL-2.0 OR Apache-2.0; Peekover uses it under Apache-2.0. ' +
      'Copyright notice: (c) Cure53 and other contributors.',
  },
};

/**
 * Where a package's licence text comes from when its own licence file is missing (`file`, in scripts/licences/) or
 * covers more than ships (`cut`: the package's file up to that line).
 */
export const TEXT_OVERRIDES: Record<string, { file?: string; cut?: string; from: string }> = {
  'wxt@0.20.27': { file: 'wxt.txt', from: 'https://github.com/wxt-dev/wxt/blob/wxt-v0.20.27/LICENSE' },
  '@wxt-dev/browser@0.2.2': {
    file: 'wxt.txt',
    from: 'the wxt repository, which holds this package (packages/browser has no licence file of its own): https://github.com/wxt-dev/wxt/blob/wxt-v0.20.27/LICENSE',
  },
  'vite@8.1.4': {
    cut: '# Licenses of bundled dependencies',
    from:
      "the package's own LICENSE.md, its first section (Vite's own licence; the rest of that file lists code inside " +
      "Vite's build tooling, none of which ships — only Vite's preload helper and module-preload polyfill do)",
  },
};

/**
 * Packages a shipped package pre-bundled into its own published files, as its source maps name them. Most map
 * sources carry `node_modules/.pnpm/<name>@<version>/`; a webpack-built dependency inside them does not, so those
 * paths are matched here.
 */
export const MAP_SOURCE_RULES: readonly { in: string; test: RegExp; component: string }[] = [
  // vscode-uri ships a webpack bundle of its own source, path-browserify and webpack's runtime (vscode-uri 3.1.0's
  // package.json: devDependencies path-browserify ^1.0.1, webpack ^5.88.2). Versions from mermaid's pnpm-lock.yaml
  // at the tag @mermaid-js/parser@1.2.0.
  { in: '@mermaid-js/parser@1.2.0', test: /^webpack:\/\/LIB\/node_modules\/path-browserify\//, component: 'path-browserify@1.0.1' },
  { in: '@mermaid-js/parser@1.2.0', test: /^webpack:\/\/LIB\/webpack\//, component: 'webpack@5.x' },
  { in: '@mermaid-js/parser@1.2.0', test: /^webpack:\/\/LIB\/src\//, component: 'vscode-uri@3.1.0' },
];

/** Pre-bundled packages are not installed, so their facts are recorded here (texts from each npm tarball). */
export const BUNDLED: Record<string, { spdx: string; text: string | SharedText; from: string; author?: string }> = {
  'chevrotain@11.1.2': { spdx: 'Apache-2.0', text: 'Apache-2.0', from: 'the npm package', author: 'Shahar Soel' },
  '@chevrotain/gast@11.1.2': { spdx: 'Apache-2.0', text: 'Apache-2.0', from: 'the npm package', author: 'Shahar Soel' },
  '@chevrotain/regexp-to-ast@11.1.2': { spdx: 'Apache-2.0', text: 'Apache-2.0', from: 'the npm package', author: 'Shahar Soel' },
  '@chevrotain/utils@11.1.2': { spdx: 'Apache-2.0', text: 'Apache-2.0', from: 'the npm package', author: 'Shahar Soel' },
  'chevrotain-allstar@0.3.1': { spdx: 'MIT', text: 'bundled/chevrotain-allstar@0.3.1.txt', from: 'the npm package' },
  'js-yaml@4.1.1': { spdx: 'MIT', text: 'bundled/js-yaml@4.1.1.txt', from: 'the npm package' },
  'langium@4.2.0': { spdx: 'MIT', text: 'bundled/langium@4.2.0.txt', from: 'the npm package' },
  'lodash-es@4.17.23': { spdx: 'MIT', text: 'bundled/lodash-es@4.17.23.txt', from: 'the npm package' },
  'path-browserify@1.0.1': { spdx: 'MIT', text: 'bundled/path-browserify@1.0.1.txt', from: 'the npm package' },
  'vscode-jsonrpc@8.2.0': { spdx: 'MIT', text: 'bundled/vscode-jsonrpc@8.2.0.txt', from: 'the npm package' },
  'vscode-languageserver-protocol@3.17.5': { spdx: 'MIT', text: 'bundled/vscode-languageserver-protocol@3.17.5.txt', from: 'the npm package' },
  'vscode-languageserver-textdocument@1.0.12': { spdx: 'MIT', text: 'bundled/vscode-languageserver-textdocument@1.0.12.txt', from: 'the npm package' },
  'vscode-languageserver-types@3.17.5': { spdx: 'MIT', text: 'bundled/vscode-languageserver-types@3.17.5.txt', from: 'the npm package' },
  'vscode-uri@3.1.0': { spdx: 'MIT', text: 'bundled/vscode-uri@3.1.0.txt', from: 'the npm package' },
  'webpack@5.x': { spdx: 'MIT', text: 'bundled/webpack.txt', from: 'https://github.com/webpack/webpack/blob/v5.88.2/LICENSE (runtime helpers only)' },
};

/**
 * Code a package copied into its published files from elsewhere, found by its notice comment (these packages ship
 * no source map). `marker` must occur in a shipped file of `in`, or generation fails as stale.
 */
export const EMBEDDED: readonly { in: string; marker: string; component: string; spdx: string; text: SharedText; notice: string }[] = [
  {
    in: 'cytoscape@3.34.0',
    marker: 'Ralf S. Engelschall',
    component: 'Embeddable Minimum Strictly-Compliant Promises/A+ 1.1.1 Thenable',
    spdx: 'MIT',
    text: 'MIT',
    notice: 'Copyright (c) 2013-2014 Ralf S. Engelschall (http://engelschall.com)',
  },
  {
    in: 'cytoscape@3.34.0',
    marker: 'Copyright Gaetan Renaudeau',
    component: 'Bezier curve function generator',
    spdx: 'MIT',
    text: 'MIT',
    notice: 'Copyright Gaetan Renaudeau.',
  },
  {
    in: 'cytoscape@3.34.0',
    marker: 'copyright Koen Bok',
    component: 'Runge-Kutta spring physics function generator, adapted from Framer.js',
    spdx: 'MIT',
    text: 'MIT',
    notice: 'Copyright Koen Bok.',
  },
  {
    in: 'dompurify@3.4.17',
    marker: 'regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc.',
    component: 'regenerator-runtime (a Babel helper)',
    spdx: 'MIT',
    text: 'MIT',
    notice: 'Copyright (c) 2014-present, Facebook, Inc.',
  },
  {
    in: 'temml@0.13.5',
    marker: 'Copyright (c) 2011-2015 The MathJax Consortium',
    component: 'mhchem for MathJax (MathJax/extensions/TeX/mhchem.js), modified by Temml as its comment lists',
    spdx: 'Apache-2.0',
    text: 'Apache-2.0',
    notice: 'Copyright (c) 2011-2015 The MathJax Consortium; Copyright (c) 2015-2018 Martin Hensel',
  },
  {
    in: 'temml@0.13.5',
    marker: 'Copyright (c) 2015-2016 Kolen Cheung',
    component: 'a MathJax third-party extension (https://github.com/ickc/MathJax-third-party-extensions)',
    spdx: 'Apache-2.0',
    text: 'Apache-2.0',
    notice: 'Copyright (c) 2015-2016 Kolen Cheung',
  },
  {
    in: 'layout-base@2.0.1',
    marker: 'adopted from https://github.com/dragonfly-ai/JamaJS',
    component: 'the singular value decomposition from JamaJS (https://github.com/dragonfly-ai/JamaJS)',
    spdx: 'Apache-2.0',
    text: 'Apache-2.0',
    notice: 'JamaJS, as adapted by layout-base (its comment carries the Apache License, Version 2.0)',
  },
];

/** The two Shiki packages whose files are each converted from another project (scripts/extract-tm-notices.ts). */
export const PER_FILE_UPSTREAM = new Set(['@shikijs/langs', '@shikijs/themes']);
export const SHIKI_UPSTREAM_JSON = 'shiki-upstream.json';
