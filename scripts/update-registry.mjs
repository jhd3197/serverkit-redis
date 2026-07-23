#!/usr/bin/env node
/**
 * Update serverkit-extensions registry with this extension's entry
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const registryPath = process.argv[2] || '../serverkit-extensions';
const sha256 = process.argv[3] || null; // sha256 of the published zip asset
const plugin = JSON.parse(readFileSync('plugin.json', 'utf8'));
const index = JSON.parse(readFileSync(join(registryPath, 'index.json'), 'utf8'));

const entry = {
    slug: plugin.name,
    display_name: plugin.display_name,
    description: plugin.description,
    version: plugin.version,
    category: 'utility',
    author: plugin.author,
    first_party: false,
    permissions: plugin.permissions || [],
    min_panel_version: plugin.min_panel_version || null,
    max_panel_version: plugin.max_panel_version || null,
    source: `${plugin.repository.replace(/\.git$/, '')}/releases/download/v${plugin.version}/${plugin.name}-${plugin.version}.zip`,
    sha256,
    repo: plugin.repository,
    homepage: plugin.homepage,
    logo: `assets/${plugin.name}/logo.svg`,
};

// Upsert entry. Preserve an existing review stamp ONLY if it was issued for
// this exact artifact hash — a new build means a new hash, and a stale stamp
// must not carry over (registry CI also errors on review/sha256 mismatch).
const existingIndex = index.extensions.findIndex(e => e.slug === plugin.name);
if (existingIndex >= 0) {
    const existing = index.extensions[existingIndex];
    if (existing.review && existing.review.sha256 && existing.review.sha256 === sha256) {
        entry.review = existing.review;
    }
    index.extensions[existingIndex] = entry;
} else {
    index.extensions.push(entry);
}

// Update date
index.updated = new Date().toISOString().split('T')[0];

writeFileSync(join(registryPath, 'index.json'), JSON.stringify(index, null, 2));
console.log(`Updated registry: ${plugin.name} v${plugin.version}`);
