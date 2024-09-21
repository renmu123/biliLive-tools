<template>
  <router-view />
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

router.push({ name: "Home" });
</script>

<style lang="less"></style>
