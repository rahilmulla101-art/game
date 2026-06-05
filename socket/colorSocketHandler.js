/**
 * Color socket handler is intentionally disabled.
 *
 * The active color game logic lives in color_server.js. Keeping a second
 * /color handler here caused duplicate betting/result engines to run.
 */

export const initColorSocketHandler = () => {
  console.log('Color socket handler disabled. color_server.js owns /color betting and results.');
  return null;
};

export const emitToColorNamespace = (io, event, data) => {
  io.of('/color').emit(event, data);
};

export const emitToColorUser = (io, userId, event, data) => {
  io.of('/color').to(`user_${userId}`).emit(event, data);
};

export const getActiveColorUsers = () => [];

export const getActivePlayerCount = () => 0;
