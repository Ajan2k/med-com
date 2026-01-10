import socketio

class SocketManager:
    def __init__(self):
        self.server = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins="*"
        )
        self.app = socketio.ASGIApp(self.server)

    async def broadcast(self, message: str):
        """
        Sends a 'new_appointment' event to all connected clients (Frontend & Admin).
        """
        print(f"📡 SOCKET BROADCAST: {message}")
        await self.server.emit('new_appointment', {'message': message})

# Initialize the Manager
manager = SocketManager()

# Expose the ASGI app for backend/app.py to mount
socket_app = manager.app