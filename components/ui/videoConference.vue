<template>
    <div class="col-span-12 md:col-span-4" v-for="stream in streams" :key="stream.id">
        <video :srcObject="stream.stream" :muted="!stream.remote" autoplay></video>
    </div>
</template>

<script setup>
import Peer from 'peerjs';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRuntimeConfig } from "nuxt/app";


const { $socketPlugin } = useNuxtApp();

const config = useRuntimeConfig();

const user = useSanctumUser();

const localStream = ref(null);
const streams = ref([]);
const peers = {};

const roomId = 'my-room';
const userId = user.value.user_id;

const peer = new Peer(userId, {
    host: config.public.peerBase,
    path: '/peerjs/myapp',
    secure: true
});

onMounted(async () => {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            localStream.value = stream;

            streams.value.push({
                remote: false,
                stream: stream
            });

            $socketPlugin.on('user-connected', (userId) => {
                console.log(userId + ' connected')

                // const conn = peer.connect(userId); // Замените на ID другого пира
                // conn.on('open', () => {
                //     console.log(conn)
                //     conn.send('Hello!');
                // });

                const call = peer.call(userId, stream);
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

            peer.on('call', call => {
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


    peer.on('open', id => {
        console.log('My peer ID is: ' + id);
    });


    $socketPlugin.emit('join-room', roomId, userId);


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

    peer.on('call', call => {
        call.answer(localStream.value);
        call.on('stream', remoteStream => {
            streams.value.push({
                remote: true,
                stream: remoteStream
            });
        });
    });
});

onBeforeUnmount(() => {
    $socketPlugin.emit('user-disconnect', roomId, userId);

    if (localStream.value !== null) {
        localStream.value.getTracks().forEach(track => track.stop());
    }
});
</script>

<style scoped>
video {
    width: 100%;
    height: auto;
    border-radius: 10px;
    transform: scale(-1, 1);
}
</style> -->