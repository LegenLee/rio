<script setup lang="ts">
import { RioButton, RioDialog, RioTextField } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const name = ref('Ann Lee');
const email = ref('ann@example.com');
const draft = ref({ name: '', email: '' });
const show = () => {
  draft.value = { name: name.value, email: email.value };
  open.value = true;
};
const save = () => {
  ({ name: name.value, email: email.value } = draft.value);
  open.value = false;
};
</script>

<template>
  <RioButton variant="tonal" @click="show">Edit {{ name }}</RioButton>
  <!-- Full-screen with a close button below 600px, basic with Cancel from there up -->
  <RioDialog v-model:open="open" variant="adaptive" headline="Edit contact">
    <div class="fields">
      <RioTextField v-model="draft.name" label="Name" />
      <RioTextField v-model="draft.email" label="Email" type="email" />
    </div>
    <template #actions>
      <RioButton variant="text" @click="save">Save</RioButton>
    </template>
  </RioDialog>
</template>

<style scoped>
.fields {
  display: grid;
  gap: 16px;
}
</style>
