import { defineStore } from 'pinia';

export const useSocketStore = defineStore('socket', {
  state: () => ({
    isConnected: false,
    messages: [],
    room: null, // Добавляем состояние для текущей комнаты
  }),

  actions: {
    connect() {
      const { $socketPlugin } = useNuxtApp();

      $socketPlugin.on('connect', () => {
        this.isConnected = true;
      });

      $socketPlugin.on('disconnect', () => {
        this.isConnected = false;
      });

      $socket.on('message', (message) => {
        this.messages.push(message);
      });
    },

    sendMessage(message) {
      const { $socket } = useNuxtApp();
      $socket.emit('message', message);
    },

    joinRoom(roomName) {
      const { $socket } = useNuxtApp();

      if (this.room) {
        $socket.emit('leaveRoom', this.room); // Покидаем предыдущую комнату, если уже подключены
      }

      $socket.emit('joinRoom', roomName, (ack) => {
        if (ack.success) {
          this.room = roomName;
          console.log(`Joined room: ${roomName}`);
        } else {
          console.error(`Failed to join room: ${ack.error}`);
        }
      });
    },

    leaveRoom() {
      const { $socket } = useNuxtApp();

      if (this.room) {
        $socket.emit('leaveRoom', this.room);
        this.room = null;
        console.log('Left room');
      }
    },
  },
});
