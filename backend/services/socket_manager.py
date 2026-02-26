import socketio

# Create a Socket.IO Async Server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

class SocketManager:
    def __init__(self):
        self.server = sio

    async def connect(self, sid, environ):
        print(f" Socket Connected: {sid}")

    async def disconnect(self, sid):
        print(f" Socket Disconnected: {sid}")

    async def broadcast_new_appointment(self, appointment_data):
        """
        Notifies ALL connected doctors/admins that a new booking happened.
        """
        print(f" Broadcasting Appointment: {appointment_data['id']}")
        await self.server.emit('new_appointment', appointment_data)

    async def broadcast_status_update(self, patient_id, status_data):
        """
        Notifies a specific patient (or everyone) about a status change (e.g., Medicine Ready).
        """
        await self.server.emit('status_update', status_data)

    async def broadcast(self, message: str):
        """
        Generic broadcaster for status messages.
        """
        print(f" SOCKET BROADCAST: {message}")
        await self.server.emit('new_appointment', {'message': message})

socket_manager = SocketManager()

# Register Event Handlers
sio.on('connect', socket_manager.connect)
sio.on('disconnect', socket_manager.disconnect)