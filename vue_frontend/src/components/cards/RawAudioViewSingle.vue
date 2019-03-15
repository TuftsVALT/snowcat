<template>
<div>
    <div v-if="playable" style="text-align: right">
        <span class="name">Filename: <strong>{{ name }}</strong></span>
        <span id="duration">Duration: <strong>{{ duration }}</strong> seconds</span>
        <button id="backward" class="btn btn-primary btn-sm" @click="wavesurfer.skipBackward()">
            <i class="glyphicon glyphicon-backward"></i>
        </button>
        <button id="" class="btn btn-primary btn-sm" @click="wavesurfer.playPause()">
            <i class="glyphicon glyphicon-play"></i>/
            <i class="glyphicon glyphicon-pause"></i>
        </button>
        <button class="btn btn-primary btn-sm" @click="wavesurfer.skipForward()">
            <i class="glyphicon glyphicon-forward"></i>
        </button>
    </div>
    <div v-if="playable">
        <div :id="id"></div>
    </div>
    <div v-else>
        <span class="name">Filename: <strong>{{ name }}</strong>.</span>
        <span class="name"> <strong>Not Playable!</strong> :-(</span>
    </div>
</div>
</template>

<script>
import { eventBus } from "../../main"; // listen for "stop" event from parent component
export default {
  props: ["audio"], // audio is an object with id and url of audio file
  data: function() {
    return {
      wavesurfer: null, // wavefurfer will be created by WaveSurfer.create()

      // pass the audio info
      id: "audio" + this.audio.d3mIndex,
      link: this.audio.link,

      name: "", // assigned in mounted()
      playable: true,
      duration: 0 // in secondes
    };
  },

  // WaveSurfer is from wavesurfer.min.js, it can be accessed from window
  // that's why to use window.WaveSurfer
  mounted() {
    this.wavesurfer = window.WaveSurfer.create({
      container: "#" + this.id,
      waveColor: "red",
      progressColor: "purple"
    });
    const ws = this.wavesurfer; // use ws for shortcut of this.wavesurfer
    ws.load(this.link);

    // assign the name of audio file, that is the last part of link
    var temp = this.link.split("/");
    this.name = temp[temp.length - 1];

    // fail to load the audio file, then set playable as false
    ws.on("error", () => {
      this.playable = false;
    });

    // succeed to load, get the duration of audio for display
    ws.on("ready", () => {
      // duration in seconds, with two decimal
      this.duration = Math.round(ws.getDuration() * 100) / 100;
    });

    // once get the "stop" event, and if current audio is playing, stop (reset to begin)
    // "stop" can be fired when page is changed
    eventBus.$on("stop", () => {
      if (ws.isPlaying()) {
        ws.stop();
      }
    });
  }
};
</script>

<style scoped>
.name {
  float: left;
}
</style>
