<template lang="pug">
  div
    b \#{{ item.id }}
    span {{ item.name }}
</template>
<script>
export default {
  props: {
    item: { required: true }
  }
}
</script>
