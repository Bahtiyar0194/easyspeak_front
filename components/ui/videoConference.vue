<template>
    <div class="col-span-12">
        <div class="card p-3">
            <div class="custom-grid">
                <div v-if="streams.length > 1" class="col-span-12">
                    <Carousel :breakpoints="{
                    0: {
                        itemsToShow: 3.5
                    },
                    768: {
                        itemsToShow: 10.5
                    },
                }" :snapAlign="'start'">
                        <Slide v-for="stream in streams" :key="stream.peer_id">
                            <div class="relative rounded-lg overflow-hidden border-2 hover:cursor-pointer"
                                :class="(stream.volume || volume) > 50 ? 'border-success' : 'border-transparent'"
                                @click="setMainStream(stream)">
                                <div
                                    class="absolute py-0.5 px-1 bg-black bg-opacity-50 z-10 text-white rounded-md left-2 top-2 flex gap-1">
                                    <span class="text-xs">{{ stream.userInfo.first_name }}</span>
                                </div>
                                <video :srcObject="stream.stream" :muted="!stream.remote" autoplay playsinline></video>
                            </div>
                        </Slide>
                    </Carousel>
                </div>

                <div v-if="mainStream" class="col-span-12 md:col-span-6">
                    <div class="relative rounded-lg overflow-hidden">
                        <video :srcObject="mainStream" :muted="true" autoplay playsinline></video>
                    </div>
                </div>

                <div v-if="localStream" class="col-span-12">
                    <div class="btn-wrap lg">
                        <!-- Кнопка включения/отключения микрофона -->
                        <button @click="toggleMute">
                            <div class="flex flex-col">
                                <i v-if="isMuted" class="bi bi-mic-mute text-2xl text-danger"></i>
                                <i v-else class="bi bi-mic text-2xl text-success"></i>
                                <span class="text-xs">Микрофон</span>
                            </div>
                        </button>

                        <!-- Кнопка включения/отключения видео -->
                        <button @click="toggleStream">
                            <div class="flex flex-col">
                                <i v-if="isStream" class="bi bi-camera-video text-2xl text-success"></i>
                                <i v-else class="bi bi-camera-video-off text-2xl text-danger"></i>
                                <span class="text-xs">Видео</span>
                            </div>
                        </button>

                        <!-- Кнопка начала/остановки демонстрации экрана -->
                        <button @click="toggleScreenSharing">
                            <div class="flex flex-col">
                                <i v-if="isScreenSharing" class="bi bi-display text-2xl text-success"></i>
                                <i v-else class="bi bi-display text-2xl text-inactive"></i>
                                <span class="text-xs">Демонстрация</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-span-4">
        <div class="card p-4">
            <h4>Участники</h4>

            <div class="form-group-border active mb-5">
                <i class="pi pi-user"></i>
                <input type="text" placeholder=" " />
                <label>
                    Поиск
                </label>
            </div>


            <p>Онлайн: <b>{{ streams.length }}</b></p>
        </div>
    </div>



    <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
    </div>

    <div class="col-span-12">
        <div class="form-group-border active mb-5">
            <i class="pi pi-at"></i>
            <input v-model="message" type="text" placeholder=" " />
            <label>
                Введите сообщение
            </label>
        </div>
        <button @click="sendMessage" class="btn btn-primary mb-5">Отправить</button>

        <h5>Сообщения</h5>
        <ul class="list-group">
            <li v-for="(item, index) in messages" :key="index">
                <p class="font-medium mb-2">{{ item.user_name }}</p>
                <p class="mb-0">{{ item.message }}</p>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { monitorNetworkAndAdjustQuality } from '../../utils/networkQuality';
import { useToast } from 'vue-toastification';
import Peer from 'peerjs';
import { useRuntimeConfig } from "nuxt/app";
const config = useRuntimeConfig();
const toast = useToast();
const { $socketPlugin } = useNuxtApp();
const user = useSanctumUser();
const userInfo = {
    first_name: user.value.first_name,
    last_name: user.value.last_name
}
let myPeer;
const peers = {};

const mainStream = ref(null);
const localStream = ref(null);
const screenStream = ref(null); // Поток экрана
const streams = ref([]);
const errorMessage = ref('');
const isMuted = ref(false); // Состояние микрофона
const volume = ref(0);
const isStream = ref(false); // Состояние видео
const isScreenSharing = ref(false); // Состояние демонстрации экрана

const roomId = 'my-room';

const message = ref('');
const messages = ref([]);


onMounted(async () => {
    try {
        myPeer = new Peer(undefined, {
            host: config.public.peerBase,
            port: process.env.NODE_ENV === 'development' ? 3002 : '',
            path: '/peerjs/myapp',
            secure: process.env.NODE_ENV === 'development' ? false : true
        });

        localStream.value = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: 720,
                height: 1280
            },
            audio: true
        });

        if (localStream.value) {
            monitorNetworkAndAdjustQuality(myPeer);
            mainStream.value = localStream.value;

            if (isStream.value === false) {
                toggleStream();
            }

            await $socketPlugin.connect();
            $socketPlugin.removeAllListeners();
            addStream(false, localStream.value, myPeer.id, userInfo);
            trackMicrophone(localStream.value);

            $socketPlugin.emit('join-room', roomId, myPeer.id, userInfo);

            $socketPlugin.emit('get-room-info', (roomInfo) => {
                roomInfo.forEach(user => {
                    if (user.peerId !== myPeer.id) {
                        const outgoingCall = myPeer.call(user.peerId, isScreenSharing.value ? screenStream.value : localStream.value, {
                            metadata: { userInfo: userInfo }
                        });

                        outgoingCall.on('stream', (remoteStream) => {
                            addStream(true, remoteStream, outgoingCall.peer, user.userInfo);
                        });

                        outgoingCall.on('error', (error) => {
                            handleError(error, 'outgoing call');
                        });

                        peers[user.peerId] = outgoingCall;
                    }
                });
            });
        }

        $socketPlugin.on('user-connected', (connectedUserInfo) => {
            toast((connectedUserInfo.first_name + ' в чате'), {
                toastClassName: ['custom-toast', 'warning'],
                timeout: 10000,
            });
        });
    } catch (error) {
        handleError(error, 'getUserMedia');
    }

    myPeer.on('call', call => {
        call.answer(isScreenSharing.value ? screenStream.value : localStream.value);
        call.on('stream', (remoteStream) => {
            addStream(true, remoteStream, call.peer, call.metadata.userInfo);
        });

        call.on('error', (error) => {
            handleError(error, 'incoming call');
        });

        peers[call.peer] = call;
    });

    $socketPlugin.on('user-disconnected', (peerId) => {
        removeStream(peerId);
        if (peers[peerId]) {
            peers[peerId].close();
        }
    });

    $socketPlugin.on('new-message', (data) => {
        messages.value.push(data);
    });

    $socketPlugin.on('update-volume', (data) => {
        const findStream = streams.value.find(s => s.peer_id === data.peerId);
        if (findStream) {
            findStream.volume = data.volume;
        }
    });

    $socketPlugin.on('connect_error', (error) => {
        handleError(error, 'Socket connection');
    });
});

onBeforeUnmount(() => {
    $socketPlugin.disconnect();

    if (localStream.value !== null) {
        localStream.value.getTracks().forEach(track => track.stop());
    }

    if (screenStream.value !== null) {
        screenStream.value.getTracks().forEach(track => track.stop());
    }
});

const addStream = (remote, stream, peer_id, userInfo) => {
    if (!streams.value.some(stream => stream.peer_id === peer_id)) {
        streams.value.push({
            remote,
            stream,
            peer_id,
            userInfo
        });
    }
};

const removeStream = (peerId) => {
    const streamToRemove = streams.value.find(s => s.peer_id === peerId);

    if (streamToRemove) {
        // Если основной поток принадлежит участнику, который покинул чат
        if (mainStream.value === streamToRemove.stream) {
            // Устанавливаем основной поток на ваш собственный поток
            mainStream.value = localStream.value;
        }

        // Удаляем поток из списка
        streams.value = streams.value.filter(s => s.peer_id !== peerId);
    }

    const connections = myPeer.connections[peerId];
    if (connections && connections.length > 0) {
        connections.forEach(connection => {
            if (connection.peerConnection) {
                connection.peerConnection.close();
            }
        });
    }
};


const setMainStream = (stream) => {
    mainStream.value = stream.stream;
};

const sendMessage = () => {
    if (message.value !== '') {
        const messageData = {
            user_name: user.value.first_name,
            message: message.value
        };

        messages.value.push(messageData);
        $socketPlugin.emit('message', messageData);
        message.value = '';
    }
};

const toggleStream = () => {
    if (localStream.value) {
        const videoTrack = localStream.value.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        isStream.value = videoTrack.enabled;
    } else {
        console.error('Local stream is not available');
    }
};

const toggleMute = () => {
    const audioTrack = localStream.value.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    isMuted.value = !audioTrack.enabled;
};

const replaceTrackInConnections = (newTrack, kind = 'video') => {
    const activeConnections = Object.keys(myPeer.connections);
    if (activeConnections.length > 0) {
        const sender = myPeer.connections[activeConnections[0]][0].peerConnection.getSenders().find(s => s.track.kind === kind);
        if (sender) {
            sender.replaceTrack(newTrack);
        }
    }
};

const toggleScreenSharing = async () => {
    if (!isScreenSharing.value) {
        try {
            screenStream.value = await navigator.mediaDevices.getDisplayMedia({ video: true });
            isScreenSharing.value = true;
            replaceTrackInConnections(screenStream.value.getVideoTracks()[0], 'video');

            screenStream.value.getVideoTracks()[0].onended = stopScreenSharing;
        } catch (error) {
            handleError(error, 'screen sharing');
        }
    } else {
        stopScreenSharing();
    }
};

const stopScreenSharing = () => {
    isScreenSharing.value = false;
    replaceTrackInConnections(localStream.value.getVideoTracks()[0], 'video');

    screenStream.value.getTracks().forEach(track => track.stop());
    screenStream.value = null;
};

const trackMicrophone = async (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Загрузка аудиоработника
    await audioContext.audioWorklet.addModule('/scripts/volume-processor.js');

    const microphone = audioContext.createMediaStreamSource(stream);
    const volumeProcessor = new AudioWorkletNode(audioContext, 'volume-processor');

    microphone.connect(volumeProcessor);
    volumeProcessor.connect(audioContext.destination);

    volumeProcessor.port.onmessage = (event) => {
        volume.value = Math.ceil(event.data);

        // Перемещение проверки внутрь onmessage
        if (!isMuted.value && streams.value.length > 1) {
            $socketPlugin.emit('microphone-volume', {
                peerId: myPeer.id,
                volume: volume.value
            });
        }
    };
};

const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error);
    errorMessage.value = `An error occurred: ${error.message}`;
};
</script>

<style scoped>
.error-message {
    color: red;
}
</style>