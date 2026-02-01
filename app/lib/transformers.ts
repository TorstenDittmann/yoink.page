export function htmlToReact(html: string): string {
  // Convert HTML classes to className
  const reactCode = html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/<!--(.*?)-->/g, '{/* $1 */}')
    .replace(/\son([a-z]+)=/g, (match, event) => ` on${event.charAt(0).toUpperCase() + event.slice(1)}=`)

  // Wrap in a functional component
  return `import React from 'react';

export default function Component() {
  return (
    ${reactCode.trim()}
  );
}`
}

export function htmlToVue(html: string): string {
  // Vue uses standard HTML, just wrap in template
  return `<script setup lang="ts">
// Component logic here
</script>

<template>
  ${html.trim()}
</template>`
}

export function htmlToSvelte(html: string): string {
  // Svelte 5 with runes
  return `<script>
  // Svelte 5 runes
  let count = $state(0);
</script>

${html.trim()}`
}
