import videojs from "video.js";
import "video.js/dist/video-js.css";

export default defineNuxtPlugin(() => {
    return {
        provide: {
            videojs,
        },
    };
});