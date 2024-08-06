<template>

    <div class="col-span-12 md:col-span-4" v-for="stream in streams" :key="stream.id">
        <video :srcObject="stream.stream" :muted="!stream.remote" autoplay></video>
        {{ stream.remote }}
    </div>

    <div class="col-span-12">
        <p>My User ID: <span>{{ userId }}</span></p>
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

const localStream = ref(null);
const streams = ref([]);
const peers = {};

const roomId = 'my-room';
const userId = user.value.user_id;


const message = ref('');
const messages = ref([]);

onMounted(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            localStream.value = stream;
            streams.value.push({
                remote: false,
                stream: stream
            });

            $socketPlugin.on('user-connected', (userId) => {
                const call = $peerPlugin.call(userId, stream);
                console.log($peerPlugin)
                call.on('stream', (remoteStream) => {
                    streams.value.push({
                        remote: true,
                        stream: remoteStream
                    });
                });
                call.on('close', () => {
                    streams.value = streams.value.filter(s => s.id !== call.peer);
                });

                peers[userId] = call;
            });

            $peerPlugin.on('call', (call) => {
                call.answer(stream);
                call.on('stream', (remoteStream) => {
                    streams.value.push({
                        remote: true,
                        stream: remoteStream
                    });
                });
            });
        })
        .catch((error) => {
            console.error(error);
        });

    $peerPlugin.on('open', () => {
        $socketPlugin.emit('join-room', roomId, userId);
    });

    $socketPlugin.on('user-disconnected', (userId) => {
        console.log(userId + ' disconnected')
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
        }
    });

    $socketPlugin.on('new-message', (data) => {
        messages.value.push(data);
    })
});

onBeforeUnmount(() => {
    $socketPlugin.emit('user-disconnect', roomId, userId);

    if (localStream.value !== null) {
        localStream.value.getTracks().forEach(track => track.stop());
    }
});

// const addVideoStream = (stream) => {
//     videoStreams.value.push(stream);
// };

// const removeVideoStream = (stream) => {
//     const index = videoStreams.value.findIndex(s => s.id === stream.id);
//     if (index !== -1) {
//         videoStreams.value.splice(index, 1);
//     }
// };

const sendMessage = () => {
    if (message.value !== '') {
        const messageData = {
            user_id: user.value.user_id,
            user_name: user.value.first_name,
            message: message.value
        }

        messages.value.push(messageData);
        $socketPlugin.emit('message', roomId, messageData);
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