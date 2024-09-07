<template>

    <div class="col-span-12">
        <gridMode v-if="confMode === 'grid'" :streams="streams" />
        <sliderMode v-else-if="confMode === 'slider'" :streams="streams" />
    </div>

    <div v-if="showBoard === true" class="col-span-12">
        <drawingBoard :streams_length="streams.length" />
    </div>

    <div class="db__footer__menu">
        <button v-if="localStream" @click="toggleMute" :title="isMuted
            ? $t('pages.conference.mic_turn_on')
            : $t('pages.conference.mic_turn_off')
            ">
            <i v-if="isMuted" class="bi bi-mic-mute text-danger"></i>
            <div v-else>
                <i v-if="volume > 50" class="bi bi-mic-fill text-success"></i>
                <i v-else class="bi bi-mic text-success"></i>
            </div>

            <span :class="isMuted ? 'text-danger' : 'text-success'">{{ $t('pages.conference.mic') }}</span>
        </button>

        <button v-if="localStream" @click="toggleStream" :title="isStream
            ? $t('pages.conference.video_turn_off')
            : $t('pages.conference.video_turn_on')
            ">
            <i class="bi" :class="isStream
            ? 'bi-camera-video text-success'
            : 'bi-camera-video-off-fill text-danger'
            "></i>

            <span :class="isStream ? 'text-success' : 'text-danger'">{{ $t('pages.conference.video') }}</span>
        </button>

        
        <button>
            <i class="bi bi-people-fill"></i>
            <countBadge :count="streams.length" :class="'badge-sm badge-light'" />
            <span>{{ $t('pages.conference.participants') }}</span>
        </button>

        <button @click="toggleScreenSharing" :title="isScreenSharing
            ? $t('pages.conference.demo_turn_off')
            : $t('pages.conference.demo_turn_on')
            ">
            <i class="bi" :class="isScreenSharing
            ? 'bi-display-fill text-success'
            : 'bi-display'
            "></i>

            <span>{{ $t('pages.conference.demo') }}</span>
        </button>

        <button>
            <i class="bi bi-chat"></i>
            <span>{{ $t('pages.conference.chat') }}</span>
        </button>

        <button @click="toggleBoard()">
            <i class="bi bi-easel2"></i>
            <span>{{ $t('pages.conference.board') }}</span>
        </button>
    </div>

    <!-- <div class="col-span-4">
        <div class="card p-4">
            <h4>Участники</h4>

            <div class="form-group-border active mb-5">
                <i class="pi pi-user"></i>
                <input type="text" placeholder=" " />
                <label> Поиск </label>
            </div>

            <p>
                Онлайн: <b>{{ streams.length }}</b>
            </p>
        </div>
    </div> -->

    <!-- <div class="col-span-12">
        <div class="form-group-border active mb-5">
            <i class="pi pi-at"></i>
            <input v-model="message" type="text" placeholder=" " />
            <label> Введите сообщение </label>
        </div>
        <button @click="sendMessage" class="btn btn-primary mb-5">Отправить</button>

        <h5>Сообщения</h5>
        <ul class="list-group">
            <li v-for="(item, index) in messages" :key="index">
                <p class="font-medium mb-2">{{ item.user_name }}</p>
                <p class="mb-0">{{ item.message }}</p>
            </li>
        </ul>
    </div> -->

    <!-- <div class="col-span-12">
        <drawingBoard :streams="streams" />
    </div> -->
</template>


<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { monitorNetworkAndAdjustQuality } from "../../utils/networkQuality";
import { useToast } from "vue-toastification";
import Peer from "peerjs";
import { useRuntimeConfig } from "nuxt/app";
import gridMode from "../../components/conference/modes/gridMode.vue";
import sliderMode from "../../components/conference/modes/sliderMode.vue";
import drawingBoard from "../../components/conference/drawingBoard.vue";
import countBadge from "../../components/ui/countBadge.vue";
const { t } = useI18n();
const config = useRuntimeConfig();
const toast = useToast();
const { $socketPlugin } = useNuxtApp();
const authUser = useSanctumUser();

const authUserInfo = {
    first_name: authUser.value.first_name,
    last_name: authUser.value.last_name,
};

let myPeer;
const peers = {};

// grid or slider
const confMode = ref("grid");

const localStream = ref(null);
const myStream = ref(null);
const screenStream = ref(null); // Поток экрана
const streams = ref([]);
const errorMessage = ref("");
const isMuted = ref(false); // Состояние микрофона
const volume = ref(0);
const isStream = ref(false); // Состояние видео
const isScreenSharing = ref(false); // Состояние демонстрации экрана

const showBoard = ref(false); // Состояние доски

const connectError = ref(false); // Состояние соединения

const roomId = "my-room";

const message = ref("");
const messages = ref([]);

useHead({
    title: t("pages.conference.title"),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ["sanctum:auth"],
});

onMounted(async () => {
    try {
        localStream.value = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 1280,
                height: 720,
                facingMode: "user",
            },
            audio: true,
        });

        myPeer = new Peer(undefined, {
            host: config.public.peerBase,
            port: process.env.NODE_ENV === "development" ? 3002 : "",
            path: "/peerjs/myapp",
            secure: process.env.NODE_ENV === "development" ? false : true,
        });

        myPeer.on("open", (id) => {
            monitorNetworkAndAdjustQuality(myPeer);

            addStream(
                false,
                localStream.value,
                myPeer.id,
                authUser.value.user_id,
                authUserInfo,
                isStream.value,
                isMuted.value
            );
            myStream.value = streams.value.find((s) => s.peer_id === id);

            if (isStream.value === false) {
                toggleStream();
            }

            trackMicrophone(localStream.value);
            joinToRoom();
        });

        myPeer.on("error", () => {
            toast(t("errors.server.peer_error"), {
                toastClassName: ["custom-toast", "danger"],
                timeout: 10000,
            });
        });
    } catch (error) {
        toast(t("errors.media.camera_error"), {
            toastClassName: ["custom-toast", "danger"],
            timeout: 10000,
        });
    }

    myPeer.on("call", (call) => {
        call.answer(isScreenSharing.value ? screenStream.value : localStream.value);
        call.on("stream", (remoteStream) => {
            addStream(
                true,
                remoteStream,
                call.peer,
                call.metadata.userId,
                call.metadata.userInfo,
                call.metadata.isStream,
                call.metadata.isMuted
            );
        });

        call.on("error", (error) => {
            handleError(error, "incoming call");
        });

        peers[call.peer] = call;
    });

    $socketPlugin.off("user-connected");

    $socketPlugin.on("user-connected", (connectedUserInfo) => {
        toast(connectedUserInfo.first_name + " " + t("on_air").toLowerCase(), {
            toastClassName: ["custom-toast", "info"],
            timeout: 10000,
        });
    });

    $socketPlugin.on("user-disconnected", (peerId) => {
        removeStream(peerId);
    });

    $socketPlugin.on("new-message", (data) => {
        messages.value.push(data);
    });

    $socketPlugin.on("toggle-video", (data) => {
        const findStream = streams.value.find((s) => s.peer_id === data.peerId);
        findStream.isStream = data.isStream;
    });

    $socketPlugin.on("toggle-audio", (data) => {
        const findStream = streams.value.find((s) => s.peer_id === data.peerId);
        findStream.isMuted = data.isMuted;
    });

    $socketPlugin.on("update-volume", (data) => {
        updateVolume(data);
    });

    $socketPlugin.on("connect_error", () => {
        if (connectError.value === false) {
            connectError.value = true;

            streams.value = streams.value.filter((stream) => !stream.remote);

            toast(t("errors.server.error"), {
                toastClassName: ["custom-toast", "danger"],
                timeout: 5000,
            });

            setTimeout(() => {
                joinToRoom();
            }, 5000);
        }
    });
});

onBeforeUnmount(() => {
    $socketPlugin.disconnect();

    stopLocalStream();
});

const joinToRoom = async () => {
    await $socketPlugin.connect();
    $socketPlugin.emit(
        "join-room",
        roomId,
        myPeer.id,
        authUser.value.user_id,
        authUserInfo,
        isStream.value,
        isMuted.value,
        (response) => {
            if (response.success) {
                connectError.value = false;
                $socketPlugin.emit("get-room-info", (roomInfo) => {
                    roomInfo.forEach((user) => {
                        if (user.peerId !== myPeer.id) {
                            const outgoingCall = myPeer.call(
                                user.peerId,
                                isScreenSharing.value ? screenStream.value : localStream.value,
                                {
                                    metadata: {
                                        userId: authUser.value.user_id,
                                        userInfo: authUserInfo,
                                        isStream: isStream.value,
                                        isMuted: isMuted.value
                                    },
                                }
                            );

                            outgoingCall.on("stream", (remoteStream) => {
                                addStream(
                                    true,
                                    remoteStream,
                                    outgoingCall.peer,
                                    user.userId,
                                    user.userInfo,
                                    user.isStream,
                                    user.isMuted
                                );
                            });

                            outgoingCall.on("error", (error) => {
                                handleError(error, "outgoing call");
                            });

                            peers[user.peerId] = outgoingCall;
                        }
                    });
                });
            } else {
                if (response.message === "peer_is_null") {
                    toast(t("errors.server.peer_error"), {
                        toastClassName: ["custom-toast", "danger"],
                        timeout: 10000,
                    });
                } else {
                    toast(t("errors.server.room_error"), {
                        toastClassName: ["custom-toast", "danger"],
                        timeout: 10000,
                    });
                }
            }
        }
    );
};

const addStream = (remote, stream, peer_id, user_id, userInfo, isStream, isMuted) => {
    if (!streams.value.some((stream) => stream.peer_id === peer_id)) {
        streams.value.push({
            remote,
            stream,
            peer_id,
            user_id,
            userInfo,
            isStream,
            isMuted
        });
    }
};

const stopLocalStream = () => {
    if (localStream.value !== null) {
        localStream.value.getTracks().forEach((track) => track.stop());
    }

    if (screenStream.value !== null) {
        screenStream.value.getTracks().forEach((track) => track.stop());
    }
    localStream.value = null;
    screenStream.value = null;
    streams.value = [];
    $socketPlugin.disconnect();
}

const removeStream = (peerId) => {
    const streamToRemove = streams.value.find((s) => s.peer_id === peerId);

    if (streamToRemove) {
        streams.value = streams.value.filter((s) => s.peer_id !== peerId);

        if (peers[peerId]) {
            peers[peerId].close();
        }
    }

    if (peerId === myPeer.id) {
        stopLocalStream();
    }
};

const toggleStream = () => {
    if (localStream.value) {
        const videoTrack = localStream.value.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        isStream.value = videoTrack.enabled;

        myStream.value.isStream = isStream.value;

        if (streams.value.length > 1) {
            $socketPlugin.emit("toggle-video", {
                peerId: myPeer.id,
                isStream: isStream.value,
            });
        }
    } else {
        console.error("Local stream is not available");
    }
};

const toggleMute = () => {
    if (localStream.value) {
        const audioTrack = localStream.value.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        isMuted.value = !audioTrack.enabled;

        myStream.value.isMuted = isMuted.value;

        if (streams.value.length > 1) {
            $socketPlugin.emit("toggle-audio", {
                peerId: myPeer.id,
                isMuted: isMuted.value,
            });
        }
    } else {
        console.error("Local stream is not available");
    }
};

const toggleBoard = () => {
    showBoard.value = !showBoard.value;

    if (showBoard.value === true) {
        confMode.value = 'slider';
    }
    else {
        confMode.value = 'grid';
    }
}

const replaceTrackInConnections = (newTrack, kind = "video") => {
    const activeConnections = Object.keys(myPeer.connections);
    if (activeConnections.length > 0) {
        const sender = myPeer.connections[activeConnections[0]][0].peerConnection
            .getSenders()
            .find((s) => s.track.kind === kind);
        if (sender) {
            sender.replaceTrack(newTrack);
        }
    }
};

const toggleScreenSharing = async () => {
    if (!isScreenSharing.value) {
        try {
            screenStream.value = await navigator.mediaDevices.getDisplayMedia({
                video: true,
            });
            isScreenSharing.value = true;
            replaceTrackInConnections(
                screenStream.value.getVideoTracks()[0],
                "video"
            );

            screenStream.value.getVideoTracks()[0].onended = stopScreenSharing;
        } catch (error) {
            handleError(error, "screen sharing");
        }
    } else {
        stopScreenSharing();
    }
};

const stopScreenSharing = () => {
    isScreenSharing.value = false;
    replaceTrackInConnections(localStream.value.getVideoTracks()[0], "video");

    screenStream.value.getTracks().forEach((track) => track.stop());
    screenStream.value = null;
};

const trackMicrophone = async (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Загрузка аудиоработника
    await audioContext.audioWorklet.addModule("/scripts/volume-processor.js");

    const microphone = audioContext.createMediaStreamSource(stream);
    const volumeProcessor = new AudioWorkletNode(
        audioContext,
        "volume-processor"
    );

    microphone.connect(volumeProcessor);
    volumeProcessor.connect(audioContext.destination);

    volumeProcessor.port.onmessage = (event) => {
        volume.value = Math.ceil(event.data);

        myStream.value.volume = volume.value;

        if (!isMuted.value && streams.value.length > 1 && volume.value >= 50) {
            $socketPlugin.emit("microphone-volume", {
                peerId: myPeer.id,
                volume: volume.value,
            });
        }
    };
};

const updateVolume = (() => {
    let timeoutId = null;
    return (data) => {
        const findStream = streams.value.find((s) => s.peer_id === data.peerId);
        if (findStream) {
            findStream.volume = data.volume;

            // Сбрасываем предыдущий таймаут, если он есть
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            // Устанавливаем новый таймаут для снижения громкости до нуля
            timeoutId = setTimeout(() => {
                findStream.volume = 0; // Снижение громкости до нуля
            }, 100); // Задержка перед началом снижения громкости
        }
    };
})();

const sendMessage = () => {
    if (message.value !== "") {
        const messageData = {
            user_name: authUser.value.first_name,
            message: message.value,
        };

        messages.value.push(messageData);
        $socketPlugin.emit("message", messageData);
        message.value = "";
    }
};

const handleError = (error, context = "") => {
    console.error(`Error in ${context}:`, error);
    errorMessage.value = `An error occurred: ${error.message}`;
};
</script>