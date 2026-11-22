---
layout: home

hero:
  name: Rio
  text: Material 3 Expressive for Vue
  tagline: Components that follow the M3 Expressive spec, with spring motion and themes made from one color.
  # No `actions`: the hero's links are Rio buttons, in .vitepress/theme/components/HeroActions.vue.

features:
  - title: Follows the spec
    details: Every page keeps the spec, Google's recommendations, and Rio's own decisions apart, with the reason for each decision. Defaults follow the spec.
  - title: Spring motion
    details: Corners, widths, and the switch handle move on M3E's springs. An interrupted press reverses from where it is, without a jolt.
  - title: Themes from one color
    details: material-color-utilities builds every color role from a source color, as CSS variables that follow light and dark mode.
  - title: Framework-neutral core
    details: The logic and the markup live in a framework-agnostic core, and the styles are plain CSS. The Vue components are a thin layer on top.
---

<script setup>
import Showcase from './components/demos/Showcase.vue';
</script>

<Demo>
  <Showcase />
</Demo>
