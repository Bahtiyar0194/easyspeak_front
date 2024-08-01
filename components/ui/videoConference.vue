<template>
    <!-- <div class="col-span-12 md:col-span-4">
        <video ref="localVideo" autoplay muted></video>
    </div>
    <div class="col-span-12 md:col-span-4" v-for="stream in remoteStreams" :key="stream.id">
        <video :srcObject="stream" autoplay></video>
    </div> -->

    <div class="col-span-12 md:col-span-4">
        <video ref="myVideo" autoplay></video>
    </div>
    <div v-for="peerVideo in peerVideos" :key="peerVideo.id" class="col-span-12 md:col-span-4">
        <video :ref="peerVideo.ref" autoplay></video>
    </div>

    <div class="col-span-12">
        <p>My User ID: {{ userId }}</p>
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
import { ref, onMounted, onUnmounted } from 'vue';
import Peer from 'peerjs';

const { $socketPlugin } = useNuxtApp();
const user = useSanctumUser();

const myVideo = ref(null);
const peerVideos = ref([]);

const roomId = 'my-room';
const userId = Math.random().toString(36).substring(2);
let peer;

const message = ref('');
const messages = ref([]);

const initializePeer = () => {
    try {
        peer = new Peer(userId, {
            host: 'localhost',
            port: 9000,
            path: '/peerjs'
        });

        peer.on('open', id => {
            console.log('PeerJS connected with ID:', id);
            $socketPlugin.emit('join-room', roomId, userId);
        });

        peer.on('error', err => {
            console.error('PeerJS Error:', err);
        });
    } catch (error) {
        console.error('Failed to initialize PeerJS:', error);
    }
};

onMounted(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            myVideo.value.srcObject = stream;

            initializePeer();

            peer.on('call', call => {
                call.answer(stream);
                const videoElement = document.createElement('video');
                call.on('stream', userVideoStream => {
                    videoElement.srcObject = userVideoStream;
                    peerVideos.value.push({ id: call.peer, ref: videoElement });
                });
            });

            $socketPlugin.on('user-connected', newUserId => {
                alert('user-connected: ' + newUserId)
                const call = peer.call(newUserId, stream);
                const videoElement = document.createElement('video');
                call.on('stream', userVideoStream => {
                    videoElement.srcObject = userVideoStream;
                    peerVideos.value.push({ id: newUserId, ref: videoElement });
                });
            });
        })
        .catch(error => {
            console.error('Failed to get user media:', error);
        });

    $socketPlugin.on('new-message', data => {
        messages.value.push(data)
    });

    $socketPlugin.on('user-disconnected', userId => {
        alert('user-disconnected: ' + userId)
        const index = peerVideos.value.findIndex(v => v.id === userId);
        if (index !== -1) {
            peerVideos.value.splice(index, 1);
        }
    });
});

onUnmounted(() => {
    $socketPlugin.disconnect();
    if (peer) {
        peer.destroy();
    }
});

const sendMessage = () => {
    if (message.value !== '') {
        $socketPlugin.emit('message', roomId, {
            user_id: user.value.user_id,
            user_name: user.value.first_name,
            message: message.value
        });

        message.value = '';
    }
}
</script>

<style scoped>
video {
    width: 100%;
    height: auto;
    border-radius: 10px;
    transform: scale(-1, 1);
}
</style>