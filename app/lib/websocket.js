import { Server } from 'socket.io';
import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';

let io;

export function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room based on order_id
    socket.on('join_room', async (data) => {
      const { order_id, user_id, user_type } = data;
      
      try {
        // Verify user has access to this order
        const [orders] = await db.query(
          'SELECT * FROM orders WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
          [order_id, user_id, user_id]
        );

          socket.join(order_id);
          socket.user_id = user_id;
          socket.user_type = user_type;
          socket.order_id = order_id;
          
          console.log(`User ${user_id} joined room ${order_id}`);
          
          // Send recent messages
          const [messages] = await db.query(
            `SELECT m.*, 
                    CASE 
                      WHEN m.sent_by = 'buyer' THEN bu.username 
                      ELSE su.username 
                    END as username
             FROM messages m 
             JOIN users bu ON m.buyer_id = bu.id 
             JOIN users su ON m.seller_id = su.id 
             WHERE m.order_id = ? 
             ORDER BY m.created_at ASC 
             LIMIT 50`, 
            [order_id] 
          );
          
          socket.emit('recent_messages', messages);

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', 'Failed to join conversation');
      }
    });

    // Handle new messages
    socket.on('send_message', async (data) => {
      const { message, image_url } = data;
      const { user_id, user_type, order_id } = socket;

      if (!order_id) {
        socket.emit('error', 'Not connected to any room');
        return;
      }

      try {
        // Get order details
        const [orders] = await db.query(
          'SELECT buyer_id, seller_id FROM orders WHERE id = ?',
          [order_id]
        );

        if (orders.length === 0) {
          socket.emit('error', 'Order not found');
          return;
        }

        const order = orders[0];
        const messageId = uuidv4();

        // Insert message into database
        await db.query(
          `INSERT INTO messages (id, room_id, order_id, buyer_id, seller_id, message, image_url, sent_by, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [messageId, order_id, order_id, order.buyer_id, order.seller_id, message, image_url, user_type]
        );

        // Get user info for the message
        const [users] = await db.query(
          'SELECT username FROM users WHERE id = ?',
          [user_id]
        );

        const messageData = {
          id: messageId,
          room_id: order_id,
          order_id,
          buyer_id: order.buyer_id,
          seller_id: order.seller_id,
          message,
          image_url,
          sent_by: user_type,
          created_at: new Date(),
          username: users[0]?.username
        };

        // Broadcast to all users in the room
        io.to(order_id).emit('new_message', messageData);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle message reporting
    socket.on('report_message', async (data) => {
      const { message_id } = data;
      
      try {
        await db.query(
          'UPDATE messages SET reported = TRUE WHERE id = ?',
          [message_id]
        );
        
        socket.emit('message_reported', { message_id });
      } catch (error) {
        console.error('Error reporting message:', error);
        socket.emit('error', 'Failed to report message');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
}