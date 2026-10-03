import manifest from './media-manifest.json';
export const assetUrl = path => manifest[path] || path;
