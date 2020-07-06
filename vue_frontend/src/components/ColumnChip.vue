<template>
  <v-chip color="cyan" text-color="cyan darken-4" small outline>
    <strong class="typechip">{{item}}</strong>
  </v-chip>
</template>

<script>
export default {
  name: 'column-chip',
  props: {
    item: String
  }
};
</script>

<style lang="scss">
.typechip {
  font-size: 11px;
}
</style>
