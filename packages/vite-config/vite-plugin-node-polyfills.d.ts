declare module 'vite-plugin-node-polyfills' {
  import type { Plugin } from 'vite';
  
  export interface NodePolyfillsOptions {
    exclude?: string[];
    include?: string[];
    globals?: {
      Buffer?: boolean;
      global?: boolean;
      process?: boolean;
    };
    protocolImports?: boolean;
  }
  
  export function nodePolyfills(options?: NodePolyfillsOptions): Plugin;
}
