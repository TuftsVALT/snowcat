<template>
  <div v-if="typeStyle" class="type-chip">
    <v-tooltip v-if="hasTooltip" content-class="info-tooltip" bottom :max-width="400">
      <v-chip :color="typeStyle.color" text-color="white" small slot="activator" disabled>
        <v-avatar :class="colorStyle" class="darken-3" v-if="typeStyle.avatarOrIcon !== null" size="16">
          <span v-if="typeStyle.avatarOrIcon === 'avatar'">{{typeStyle.symbol}}</span>
          <v-icon color="white" v-if="typeStyle.avatarOrIcon === 'icon'">{{typeStyle.symbol}}</v-icon>
        </v-avatar>
        {{typeStyle.name}}
      </v-chip>
      {{typeStyle.description}}
    </v-tooltip>
    <v-chip v-else :color="typeStyle.color" text-color="white" small disabled>
      <v-avatar :class="colorStyle" class="darken-3" v-if="typeStyle.avatarOrIcon !== null" size="16">
        <span v-if="typeStyle.avatarOrIcon === 'avatar'">{{typeStyle.symbol}}</span>
        <v-icon color="white" v-if="typeStyle.avatarOrIcon === 'icon'">{{typeStyle.symbol}}</v-icon>
      </v-avatar>
      {{typeStyle.name}}
    </v-chip>
  </div>
</template>

<script>
import typeStyles from '@/store/settings/typeStyles'
export default {
  name: 'type-chip',
  props: {
    item: String,
    'tooltip': {
      type: Boolean,
      default: true
    }
  },
  computed: {
    hasTooltip () {
      return this.tooltip && this.typeStyle !== undefined && this.typeStyle.description !== undefined
    },
    typeStyle () {
      return typeStyles[this.item]
    },
    colorStyle () {
      const color = {}
      color[typeStyles[this.item].color] = true
      return color
    }
  },
  data () {
    return {
      typeStyles
    }
  }
}
</script>

<style lang="scss">
.type-chip {
  display: unset;
  .tooltip {
    z-index: 7;
  }
  .chip--small .avatar {
    height: 26px !important;
    min-width: 26px;
    width: 26px !important;
  }
  .tooltip {
    opacity: 1;
  }
}
.info-tooltip {
  font-size: 1em;
  font-weight: 700;
}
</style>
