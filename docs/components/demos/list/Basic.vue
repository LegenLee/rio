<script setup lang="ts">
import { mdiFolderOutline, mdiImageOutline } from '@mdi/js';
import { RioIcon, RioList, RioListItem } from '@rio-m3e/vue';
</script>

<template>
  <!-- A static list: nothing in it acts or is chosen. -->
  <RioList style="inline-size: 360px">
    <RioListItem>
      <template #leading>
        <RioIcon :icon="{ type: 'svg', path: mdiFolderOutline }" />
      </template>
      Documents
      <template #supporting>12 files</template>
      <template #trailing>2 MB</template>
    </RioListItem>
    <RioListItem>
      <template #leading>
        <RioIcon :icon="{ type: 'svg', path: mdiImageOutline }" />
      </template>
      Photos
      <template #overline>Shared</template>
      <template #supporting>From the trip to the coast, sorted by the day they were taken</template>
      <template #trailing>1.4 GB</template>
    </RioListItem>
  </RioList>
</template>
