<template>

    <div class="col-span-12 md:col-span-3 relative rounded-xl overflow-hidden" v-for="stream in streams"
        :key="stream.peer_id">
        <div class="absolute py-0.5 px-1 bg-black bg-opacity-50 z-10 text-white rounded-md text-xs left-2 top-2">{{
        stream.user_name }}</div>
        <video :ref="el => setVideoStream(el, stream.stream)" :muted="!stream.remote" autoplay playsinline></video>
    </div>

    {{ streams.length }}

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

const { $socketPlugin, $peerPlugin } = useNuxtApp();
const user = useSanctumUser();
const peer = $peerPlugin;

const localStream = ref(null);
const streams = ref([]);
const errorMessage = ref('');

const roomId = 'my-room';

const message = ref('');
const messages = ref([]);

onMounted(async () => {
    try {
        localStream.value = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 720,
                height: 1280
            },
            audio: true
        });

        if (localStream.value) {
            await $socketPlugin.connect();
            addStream(false, localStream.value, peer.id, user.value.first_name);
            $socketPlugin.emit('join-room', roomId, peer.id, user.value.first_name);
        }

        $socketPlugin.on('user-connected', (peerId, userName) => {
            console.log(peerId + ' connected');

            const outgoingCall = peer.call(peerId, localStream.value, {
                metadata: { userName: user.value.first_name }
            });

            outgoingCall.on('stream', (remoteStream) => {
                addStream(true, remoteStream, outgoingCall.peer, userName);
            });

            outgoingCall.on('error', (error) => {
                handleError(error, 'outgoing call');
            });
        });

    } catch (error) {
        handleError(error, 'getUserMedia');
    }

    peer.on('call', call => {
        call.answer(localStream.value);
        call.on('stream', (remoteStream) => {
            addStream(true, remoteStream, call.peer, call.metadata.userName || 'Unknown');
        });

        call.on('error', (error) => {
            handleError(error, 'incoming call');
        });
    });

    $socketPlugin.on('user-disconnected', (peerId) => {
        console.log(peerId + ' disconnected');
        streams.value = streams.value.filter(s => s.peer_id !== peerId);
    });

    $socketPlugin.on('new-message', (data) => {
        messages.value.push(data);
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
});

const addStream = (remote, stream, peer_id, user_name) => {
    if (!streams.value.some(existingStream => existingStream.peer_id === peer_id)) {
        streams.value.push({
            remote,
            stream,
            peer_id,
            user_name
        });
    }
};

const setVideoStream = (videoElement, stream) => {
    if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play().catch(err => {
                console.error('Failed to play video:', err);
            });
        };
    }
};

const sendMessage = () => {
    if (message.value !== '') {
        const messageData = {
            user_name: user.value.first_name,
            message: message.value
        };

        messages.value.push(roomId, messageData);
        $socketPlugin.emit('message', messageData);
        message.value = '';
    }
};

const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error);
    errorMessage.value = `An error occurred: ${error.message}`;
};
</script>

<style scoped>
video {
    width: 100%;
    height: auto;
    transform: scale(-1, 1);
}
</style>