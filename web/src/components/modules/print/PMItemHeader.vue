<template>
	<header class="pm-item-header">
		<h2 class="title">{{ title }}</h2>
		<p class="description">{{ description }}</p>
	</header>
</template>

<script setup lang="ts">
defineProps<{
	title: string;
	description: string;
}>();
</script>

<style lang="scss" src="./PMItemHeader.scss" scoped />
