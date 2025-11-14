declare module 'diff' {
  /**
   * Applies a unified diff patch to a string.
   * @param oldStr The original string content
   * @param uniDiff The unified diff string to apply
   * @returns The patched string, or false if the patch could not be applied
   */
  export function applyPatch(oldStr: string, uniDiff: string): string | false;
}



