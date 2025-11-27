export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Desktop connected:", socket.id);

    socket.on("subscribe", (qrToken) => {
      socket.join(qrToken); 
      console.log(`Socket ${socket.id} joined room ${qrToken}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
