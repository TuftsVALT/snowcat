<template>
<div>
    <br>
    <div :id="id" v-show="playable">
        <span class="name">Filename: <strong>{{ name }}</strong></span>
        <span>Duration: <strong>{{ duration }}</strong> seconds</span>
        <video-player class="vjs-custom-skin" ref="videoPlayer" :options="playerOptions" :playsinline="true" @canplay="onPlayerCanplay($event)">
        </video-player>
    </div>
    <div v-show="!playable">
        <span class="name">Filename: <strong>{{ name }}</strong></span>
        <span>Sorry, this video is not playable. </span>
    </div>
</div>
</template>

<script>
import { videoPlayer } from "vue-video-player";
export default {
  props: ["video"], // video is an object with id and url of video file
  components: {
    "video-player": videoPlayer
  },
  data: function() {
    return {
      playable: false,

      // pass the video info
      id: "video" + this.video.d3mIndex,
      link: this.video.link,
      name: "",
      duration: 0,

      // videojs options
      playerOptions: {
        height: "360",
        autoplay: false,
        muted: true,
        language: "en",
        playbackRates: [0.7, 1.0, 1.5, 2.0],
        sources: [
          {
            type: "video/mp4",
            src: this.video.link
          }
        ]
      }
    };
  },
  computed: {
    player() {
      return this.$refs.videoPlayer.player;
    }
  },
  mounted() {
    // get the name of audio file, that is the last part of link
    var temp = this.link.split("/");
    this.name = temp[temp.length - 1];
  },
  methods: {
    // listen event
    onPlayerCanplay(player) {
      this.playable = true;
      var duration = this.$refs.videoPlayer.$refs.video.duration;
      this.duration = Math.round(duration * 100) / 100;
    }
  }
};

// NOTE:
// Events for vue-video-player
// @play="onPlayerPlay($event)"
// @pause="onPlayerPause($event)"
// @ended="onPlayerEnded($event)"
// @loadeddata="onPlayerLoadeddata($event)"
// @waiting="onPlayerWaiting($event)"
// @playing="onPlayerPlaying($event)"
// @timeupdate="onPlayerTimeupdate($event)"
// @canplay="onPlayerCanplay($event)"
// @canplaythrough="onPlayerCanplaythrough($event)"
// @ready="playerReadied"
// @statechanged="playerStateChanged($event)"
</script>

<style scoped>
.name {
  float: left;
}
</style>
