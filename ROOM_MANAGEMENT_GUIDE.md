# Room Management System Guide

A comprehensive session/room management system with MongoDB, access control, and automatic expiration.

## Features

- ✅ **Unique Room IDs**: Generated using nanoid (12 characters)
- ✅ **MongoDB Persistence**: Scalable data storage with indexes
- ✅ **Access Control**: Host, Editor, and Viewer roles
- ✅ **Auto-Expiration**: Rooms automatically deleted after 7 days
- ✅ **Participant Management**: Join, leave, track activity
- ✅ **Real-time State**: Code and whiteboard snapshots
- ✅ **Room Settings**: Public/private, max participants, guest access
- ✅ **RESTful API**: 11 comprehensive endpoints

## Architecture

### Database Schema

```
rooms Collection
├── roomId (unique, indexed)
├── name
├── createdBy { userId, username }
├── participants []
│   ├── userId
│   ├── username
│   ├── role (host | editor | viewer)
│   ├── joinedAt
│   └── lastActive
├── code
│   ├── content
│   ├── language
│   ├── lastModifiedBy
│   └── lastModifiedAt
├── whiteboard
│   ├── snapshot (JSON string)
│   ├── lastModifiedBy
│   └── lastModifiedAt
├── settings
│   ├── isPublic
│   ├── maxParticipants (1-50)
│   ├── allowGuests
│   └── requireApproval
├── createdAt
├── expiresAt (TTL indexed)
├── isActive
└── lastActivity
```

### Indexes

```typescript
// Performance indexes
- { roomId: 1 } (unique)
- { expiresAt: 1 } (TTL - auto-delete expired)
- { 'createdBy.userId': 1 }
- { 'participants.userId': 1 }
- { createdAt: -1 }
- { isActive: 1, expiresAt: 1 }
- { isActive: 1, 'settings.isPublic': 1, expiresAt: 1 }
```

## API Endpoints

### 1. Create Room

**POST** `/api/rooms/create`

Create a new room with unique ID.

**Request Body:**

```json
{
  "userId": "user123",
  "username": "John Doe",
  "name": "My Coding Room",
  "language": "python",
  "isPublic": false,
  "maxParticipants": 10,
  "allowGuests": true
}
```

**Response** (201):

```json
{
  "message": "Room created successfully",
  "room": {
    "roomId": "h8K3j9Lp2mN4",
    "name": "My Coding Room",
    "createdBy": {
      "userId": "user123",
      "username": "John Doe"
    },
    "participants": [{
      "userId": "user123",
      "username": "John Doe",
      "role": "host",
      "joinedAt": "2024-01-01T00:00:00.000Z",
      "lastActive": "2024-01-01T00:00:00.000Z"
    }],
    "settings": {
      "isPublic": false,
      "maxParticipants": 10,
      "allowGuests": true,
      "requireApproval": false
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
}
```

### 2. Get Room Data

**GET** `/api/rooms/:roomId?userId=user123`

Get room data by ID. Optionally provide userId for access control.

**Response** (200):

```json
{
  "room": {
    "roomId": "h8K3j9Lp2mN4",
    "name": "My Coding Room",
    "createdBy": { "userId": "user123", "username": "John Doe" },
    "participants": [...],
    "code": {
      "content": "print('Hello')",
      "language": "python",
      "lastModifiedBy": "user123",
      "lastModifiedAt": "2024-01-01T00:00:00.000Z"
    },
    "whiteboard": {
      "snapshot": "{}",
      "lastModifiedBy": "user123",
      "lastModifiedAt": "2024-01-01T00:00:00.000Z"
    },
    "settings": {...},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-08T00:00:00.000Z",
    "isActive": true,
    "lastActivity": "2024-01-01T00:00:00.000Z",
    "participantCount": 1,
    "timeRemaining": 604800000
  }
}
```

**Error Responses:**

- 404: Room not found or expired
- 410: Room has expired
- 403: Access denied (private room)

### 3. Join Room

**POST** `/api/rooms/:roomId/join`

Join an existing room.

**Request Body:**

```json
{
  "userId": "user456",
  "username": "Jane Smith",
  "role": "editor"
}
```

**Response** (200):

```json
{
  "message": "Joined room successfully",
  "room": {
    "roomId": "h8K3j9Lp2mN4",
    "name": "My Coding Room",
    "participants": [...],
    "role": "editor"
  }
}
```

**Error Responses:**

- 404: Room not found
- 410: Room has expired
- 403: Room is full / Guests not allowed

### 4. Leave Room

**POST** `/api/rooms/:roomId/leave`

Leave a room.

**Request Body:**

```json
{
  "userId": "user456"
}
```

**Response** (200):

```json
{
  "message": "Left room successfully",
  "roomId": "h8K3j9Lp2mN4"
}
```

**Auto-Transfer Host:**

- If the last host leaves, host role transfers to first editor
- If no editors exist, room is deactivated
- If all participants leave, room is deactivated

### 5. Update Code

**PUT** `/api/rooms/:roomId/code`

Update room code content.

**Request Body:**

```json
{
  "userId": "user123",
  "code": "print('Hello, World!')",
  "language": "python"
}
```

**Response** (200):

```json
{
  "message": "Code updated successfully",
  "code": {
    "content": "print('Hello, World!')",
    "language": "python",
    "lastModifiedBy": "user123",
    "lastModifiedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Permissions:** Host or Editor only

### 6. Update Whiteboard

**PUT** `/api/rooms/:roomId/whiteboard`

Update whiteboard snapshot.

**Request Body:**

```json
{
  "userId": "user123",
  "snapshot": "{\"elements\": []}"
}
```

**Response** (200):

```json
{
  "message": "Whiteboard updated successfully",
  "whiteboard": {
    "snapshot": "{\"elements\": []}",
    "lastModifiedBy": "user123",
    "lastModifiedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Permissions:** Host or Editor only

### 7. Delete Room

**DELETE** `/api/rooms/:roomId`

Delete a room (soft delete - marks as inactive).

**Request Body:**

```json
{
  "userId": "user123",
  "isAdmin": false
}
```

**Response** (200):

```json
{
  "message": "Room deleted successfully",
  "roomId": "h8K3j9Lp2mN4"
}
```

**Permissions:** Host or Admin only

### 8. Get User Rooms

**GET** `/api/rooms/user/:userId`

Get all rooms a user is participating in.

**Response** (200):

```json
{
  "rooms": [
    {
      "roomId": "h8K3j9Lp2mN4",
      "name": "My Coding Room",
      "createdBy": { "userId": "user123", "username": "John Doe" },
      "participantCount": 3,
      "role": "host",
      "lastActivity": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-01-08T00:00:00.000Z",
      "timeRemaining": 604800000
    }
  ],
  "count": 1
}
```

### 9. Get Public Rooms

**GET** `/api/rooms/public/list?limit=20`

Get list of public rooms.

**Response** (200):

```json
{
  "rooms": [
    {
      "roomId": "h8K3j9Lp2mN4",
      "name": "Public Python Room",
      "createdBy": { "userId": "user123", "username": "John Doe" },
      "participantCount": 3,
      "maxParticipants": 10,
      "lastActivity": "2024-01-01T00:00:00.000Z",
      "language": "python"
    }
  ],
  "count": 1
}
```

### 10. Update Settings

**PUT** `/api/rooms/:roomId/settings`

Update room settings.

**Request Body:**

```json
{
  "userId": "user123",
  "settings": {
    "isPublic": true,
    "maxParticipants": 20,
    "allowGuests": false,
    "requireApproval": true
  }
}
```

**Response** (200):

```json
{
  "message": "Settings updated successfully",
  "settings": {
    "isPublic": true,
    "maxParticipants": 20,
    "allowGuests": false,
    "requireApproval": true
  }
}
```

**Permissions:** Host only

## Access Control

### Role Hierarchy

1. **Host**
    - Full control of room
    - Can edit code/whiteboard
    - Can update settings
    - Can delete room
    - Can manage participants

2. **Editor**
    - Can edit code/whiteboard
    - Cannot change settings
    - Cannot delete room

3. **Viewer**
    - Read-only access
    - Cannot edit anything
    - Can view code/whiteboard

### Permission Checks

```typescript
// Check if user is host
room.isHost(userId);

// Check if user can edit
room.canEdit(userId); // Returns true for host and editor

// Check if user is participant
room.isParticipant(userId);
```

## Room Expiration

### Automatic Deletion

Rooms are automatically deleted 7 days after creation using MongoDB TTL index.

```typescript
// Set expiration (done automatically)
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7);
```

### Soft Delete

When deleted manually, rooms are marked as inactive but not immediately removed from database:

```typescript
room.isActive = false;
await room.save();
```

### Cleanup Job (Optional)

For additional cleanup, you can run periodic jobs:

```typescript
// Delete inactive rooms older than 30 days
await Room.deleteMany({
  isActive: false,
  createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
});
```

## Usage Examples

### Creating a Room

```javascript
const response = await fetch('http://localhost:4000/api/rooms/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    username: 'John Doe',
    name: 'Interview Practice',
    language: 'javascript',
    isPublic: false,
    maxParticipants: 5
  })
});

const { room } = await response.json();
console.log('Room ID:', room.roomId);
```

### Joining a Room

```javascript
const response = await fetch(`http://localhost:4000/api/rooms/${roomId}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user456',
    username: 'Jane Smith',
    role: 'editor'
  })
});
```

### Updating Code

```javascript
const response = await fetch(`http://localhost:4000/api/rooms/${roomId}/code`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    code: 'console.log("Hello, World!");',
    language: 'javascript'
  })
});
```

## Integration with Existing Code

### With Socket.IO

```javascript
// When user joins room via Socket.IO
socket.on('join-room', async ({ roomId, userId, username }) => {
  try {
    // Update room in database
    const response = await fetch(`http://localhost:4000/api/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username })
    });

    const { room } = await response.json();
    
    // Join Socket.IO room
    socket.join(roomId);
    
    // Broadcast to room
    io.to(roomId).emit('user-joined', { userId, username });
  } catch (error) {
    socket.emit('error', { message: error.message });
  }
});
```

### With Yjs

```javascript
// Sync Yjs document with MongoDB
const ydoc = new Y.Doc();

// Load initial state from database
const room = await Room.findByRoomId(roomId);
if (room.code.content) {
  const ytext = ydoc.getText('codemirror');
  ytext.insert(0, room.code.content);
}

// Periodically save to database
setInterval(async () => {
  const content = ydoc.getText('codemirror').toString();
  await fetch(`http://localhost:4000/api/rooms/${roomId}/code`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUserId,
      code: content
    })
  });
}, 30000); // Every 30 seconds
```

## Monitoring & Maintenance

### Check Expired Rooms

```javascript
const expiredRooms = await Room.find({
  expiresAt: { $lt: new Date() },
  isActive: true
});

console.log(`Found ${expiredRooms.length} expired rooms`);
```

### Get Room Statistics

```javascript
const stats = await Room.aggregate([
  { $match: { isActive: true } },
  { $group: {
    _id: null,
    totalRooms: { $sum: 1 },
    totalParticipants: { $sum: { $size: '$participants' } },
    publicRooms: {
      $sum: { $cond: ['$settings.isPublic', 1, 0] }
    }
  }}
]);
```

### Activity Tracking

```javascript
// Update participant activity
room.updateParticipantActivity(userId);
await room.save();

// Find inactive participants
const inactiveParticipants = room.participants.filter(p => {
  const inactiveTime = Date.now() - p.lastActive.getTime();
  return inactiveTime > 30 * 60 * 1000; // 30 minutes
});
```

## Security Considerations

### Input Validation

All endpoints validate:

- Required fields
- Field lengths
- Value ranges
- User permissions

### Access Control

```typescript
// Private room access check
if (!room.settings.isPublic && !room.isParticipant(userId)) {
  return res.status(403).json({ error: 'Access denied' });
}

// Edit permission check
if (!room.canEdit(userId)) {
  return res.status(403).json({ error: 'No edit permission' });
}
```

### Rate Limiting (Recommended)

```javascript
import rateLimit from 'express-rate-limit';

const createRoomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 rooms per 15 minutes
  message: 'Too many rooms created, please try again later'
});

app.post('/api/rooms/create', createRoomLimiter, ...);
```

## Troubleshooting

### Room Not Found

**Issue:** 404 error when accessing room
**Solutions:**

- Check if roomId is correct
- Verify room hasn't expired
- Check if room is active

### Permission Denied

**Issue:** 403 error when editing
**Solutions:**

- Verify user is participant
- Check user role (host/editor)
- Ensure room settings allow action

### Expiration Issues

**Issue:** Rooms not auto-deleting
**Solutions:**

- Verify TTL index is created: `db.rooms.getIndexes()`
- Check MongoDB version (TTL requires 2.2+)
- Ensure `expireAfterSeconds` is set to 0

## Best Practices

1. **Always provide userId** for proper tracking
2. **Update lastActivity** regularly for accurate metrics
3. **Use soft delete** instead of hard delete for recovery
4. **Set appropriate maxParticipants** based on use case
5. **Enable isPublic** only for appropriate rooms
6. **Transfer host** before leaving if you're the last host
7. **Clean up inactive rooms** periodically

## Performance Tips

1. **Use indexes** for common queries
2. **Limit participant count** to reasonable numbers
3. **Paginate** public room lists
4. **Cache frequent queries** (Redis)
5. **Use projection** to fetch only needed fields

## License

ISC
