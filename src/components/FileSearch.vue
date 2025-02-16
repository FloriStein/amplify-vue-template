<!-- src/components/FileSearch.vue -->
<template>
  <input
      v-model="searchValue"
      placeholder="search..."
      @input="updateSearch"
      class="search-input"
  />
</template>

<script setup lang="ts">
import { defineModel } from "vue";

const searchValue = defineModel<string>(); // Ermöglicht v-model für bidirektionale Datenbindung

const updateSearch = () => {
  // Automatisch durch v-model aktualisiert
};
</script>
