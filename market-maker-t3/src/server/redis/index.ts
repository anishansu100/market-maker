// Re-export Redis client and types
export { redis } from "./client.js";
export type { User, Message, RoomInfo } from "./types.js";

// Import managers and types
import { userHelpers } from "./managers/users.js";
import { messageHelpers } from "./managers/messages.js";
import { roomHelpers } from "./managers/rooms.js";


// Combined helpers object for convenience
export const redisHelpers = {
  // Organized by category
  users: userHelpers,
  messages: messageHelpers,
  rooms: roomHelpers,
  
  // Direct function exports with proper binding
  addUser: userHelpers.addUser.bind(userHelpers),
  getUser: userHelpers.getUser.bind(userHelpers),
  removeUser: userHelpers.removeUser.bind(userHelpers),
  getRoomUsers: userHelpers.getRoomUsers.bind(userHelpers),
  userExistsInRoom: userHelpers.userExistsInRoom.bind(userHelpers),

  addMessage: messageHelpers.addMessage.bind(messageHelpers),
  getRoomMessages: messageHelpers.getRoomMessages.bind(messageHelpers),
  removeMessage: messageHelpers.removeMessage.bind(messageHelpers),

  getRoomInfo: roomHelpers.getRoomInfo.bind(roomHelpers),
  updateRoomInfo: roomHelpers.updateRoomInfo.bind(roomHelpers),
  deleteRoom: roomHelpers.deleteRoom.bind(roomHelpers),
};

// Re-export individual helpers
export { userHelpers, messageHelpers, roomHelpers }; 