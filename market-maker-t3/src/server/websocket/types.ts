import type { Socket } from "socket.io";

export interface CustomSocket extends Socket {
  user?: string;
  room?: string;
}