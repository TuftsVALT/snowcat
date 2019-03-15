<template>
  <v-dialog v-model="value" max-width="70%">
    <v-card>
      <v-card-title class="headline">Modify problem description:</v-card-title>
      <v-textarea
        outline
        v-model="modDescription"
      >
        <div slot="label">
          Problem description
        </div>
      </v-textarea>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" flat="flat" @click.native="close()">OK</v-btn>
        <v-btn color="red darken-1" flat="flat" @click.native="close()">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import _ from 'lodash'
export default {
  name: 'problem-describe-dialog',
  components: { },
  props: {
    value: Boolean,
  },
  data() {
    return {
      modDescription: "test123",
    }
  },
  computed: {
  },
  methods: {
    close() {
      // this.value = false;
      this.$emit('input', false);
    }
  },
  watch: {
    value() {
      console.log("VALUE CHANGED");
    }
  }
}
</script>

<style lang="scss">

</style>
