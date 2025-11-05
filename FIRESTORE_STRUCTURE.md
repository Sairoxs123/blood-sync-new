# Blood Sync - Updated Firestore Structure Documentation

## Overview
This document describes the updated Firestore database structure to support location-based blood donation camps and targeted blood requests.

## Collections

### 1. `camps` Collection
Stores information about active blood donation camp sessions.

**Document Structure:**
```javascript
{
  id: "auto-generated-id",
  location: "Central Park", // String: Name/description of camp location
  coordinator: "John Doe", // String: Name of the coordinator running the camp
  coordinator_uid: "firebase-user-uid", // String: Firebase Auth UID of coordinator
  latitude: 28.6139, // Number: Latitude coordinate of camp
  longitude: 77.2090, // Number: Longitude coordinate of camp
  inventory: { // Object: Blood inventory at this camp
    "A+": 5,
    "A-": 2,
    "B+": 8,
    "B-": 1,
    "AB+": 3,
    "AB-": 0,
    "O+": 12,
    "O-": 4
  },
  status: "active", // String: "active" or "ended"
  started_at: Timestamp, // Firestore Timestamp: When camp was started
  ended_at: Timestamp // Optional: When camp was ended (if status is "ended")
}
```

**Indexes Required:**
- `coordinator_uid` + `status` (for querying coordinator's active camps)
- `status` (for querying all active camps)

**Operations:**
- **Create**: When coordinator starts a new camp session
- **Update**: When inventory is modified (add/remove units, add new blood groups)
- **Delete**: When coordinator ends the camp session

---

### 2. `requests` Collection (Updated)
Stores blood requests from hospitals to specific camps.

**Document Structure:**
```javascript
{
  id: "auto-generated-id",
  blood_type: "O+", // String: Blood type requested
  units: 3, // Number: Number of units requested
  hospital: "City General Hospital", // String: Name of requesting hospital
  status: "Pending", // String: "Pending" | "Delivering" | "Delivered"
  urgent: false, // Boolean: Whether this is an urgent request
  requested_at: Timestamp, // Firestore Timestamp: When request was created
  camp_id: "camp-document-id", // String: Reference to specific camp
  camp_location: "Central Park", // String: Name of camp location (denormalized for display)
  distance: 5.23 // Number: Distance in kilometers from hospital to camp
}
```

**Indexes Required:**
- `hospital` (for querying hospital's requests)
- `camp_id` (for querying requests for a specific camp)
- `camp_id` + `status` (for efficient filtering)

**Operations:**
- **Create**: When hospital submits a new blood request to a camp
- **Update**: When coordinator updates request status (Pending → Delivering → Delivered)

---

### 3. `users` Collection
Stores user profile information for authentication and authorization.

**Document Structure:**
```javascript
{
  id: "firebase-user-uid", // Document ID matches Firebase Auth UID
  email: "user@example.com", // String: User's email address
  role: "NSS_COORDINATOR" | "HOSPITAL", // String: User role (from custom claims)
  createdAt: Timestamp // Firestore Timestamp: When user document was created
}
```

**Operations:**
- **Create**: Automatically created on first login if doesn't exist
- **Read**: User can read their own document
- **Update**: Can be updated by admin or the user themselves
- **Delete**: Admin only

---

### 4. `inventory` Collection (DEPRECATED)
⚠️ **This collection is no longer used.** Inventory is now stored per-camp in the `camps` collection.

---

## Key Features

### Location-Based Functionality
1. **Geolocation Capture**:
   - Coordinators' current location is automatically captured when starting a camp
   - Hospitals' location is captured for distance calculation

2. **Distance Calculation**:
   - Haversine formula is used to calculate distance between hospital and camps
   - Distance is stored with each request for tracking and sorting

3. **Map Visualization**:
   - Interactive map shows all active camps and hospital location
   - Custom markers distinguish hospitals (blue) from camps (red)
   - Popup displays camp details including inventory and distance

### User Workflows

#### Coordinator Workflow:
1. Click "Start Camp" button
2. Enter camp location name and coordinator name
3. System captures GPS coordinates automatically
4. Camp is created with default inventory (all blood types at 0)
5. Add/remove blood units as donations come in
6. View and manage incoming requests from hospitals
7. Click "End Camp" to close the session (deletes camp document)

#### Hospital Workflow:
1. View map showing all active camps with markers
2. See distance to each camp and available blood inventory
3. Select a camp from map or list view
4. Submit request specifying blood type, units needed, and urgency
5. Track request status in sidebar (Pending → Delivering → Delivered)

---

## Security Rules Recommendations

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      // Users can read their own document
      allow read: if request.auth != null && request.auth.uid == userId;

      // Users can create their own document on first login
      allow create: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.email == request.auth.token.email;

      // Users can update their own document
      allow update: if request.auth != null && request.auth.uid == userId;

      // Only admins can delete (you can add custom claims check here)
      allow delete: if false; // Set to true if you want users to delete their own accounts
    }

    // Camps collection
    match /camps/{campId} {
      // Anyone authenticated can read active camps
      allow read: if request.auth != null && resource.data.status == 'active';

      // Only authenticated coordinators can create camps
      allow create: if request.auth != null
        && request.resource.data.coordinator_uid == request.auth.uid;

      // Only the coordinator who created the camp can update or delete it
      allow update, delete: if request.auth != null
        && resource.data.coordinator_uid == request.auth.uid;
    }

    // Requests collection
    match /requests/{requestId} {
      // Authenticated users can read all requests
      // (You can make this more restrictive if needed)
      allow read: if request.auth != null;

      // Only authenticated users can create requests
      allow create: if request.auth != null;

      // Only authenticated users can update request status
      // (Coordinators update status, hospitals create requests)
      allow update: if request.auth != null;

      // Only allow delete by admins or request creator
      allow delete: if false; // Set to true if you want users to delete requests
    }
  }
}
```

---

## Migration Notes

### From Old Structure to New Structure:

1. **Inventory Migration**: No automatic migration needed. Old inventory data in the global `inventory` collection will remain but is unused. Each new camp starts with fresh inventory.

2. **Requests Migration**: Existing requests without `camp_id` will not appear in coordinator dashboards. You may want to:
   - Archive old requests
   - Or manually add `camp_id: null` and display them separately

3. **User Experience**:
   - Coordinators must now explicitly start a camp session before managing inventory
   - Hospitals can only send requests to active camps, not to a global pool

---

## API Examples

### Creating a New Camp:
```javascript
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const startCamp = async (location, coordinator, latitude, longitude, userUid) => {
  const campRef = await addDoc(collection(db, "camps"), {
    location: location,
    coordinator: coordinator,
    latitude: latitude,
    longitude: longitude,
    inventory: {
      "A+": 0, "A-": 0, "B+": 0, "B-": 0,
      "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
    },
    status: "active",
    started_at: serverTimestamp(),
    coordinator_uid: userUid
  });
  return campRef.id;
};
```

### Querying Active Camps:
```javascript
import { collection, query, where, onSnapshot } from "firebase/firestore";

const listenToActiveCamps = (callback) => {
  const q = query(
    collection(db, "camps"),
    where("status", "==", "active")
  );

  return onSnapshot(q, (snapshot) => {
    const camps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(camps);
  });
};
```

### Creating a Request to a Specific Camp:
```javascript
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const createRequest = async (campId, campLocation, bloodType, units, hospital, urgent, distance) => {
  await addDoc(collection(db, "requests"), {
    camp_id: campId,
    camp_location: campLocation,
    blood_type: bloodType,
    units: units,
    hospital: hospital,
    urgent: urgent,
    status: "Pending",
    distance: distance,
    requested_at: serverTimestamp()
  });
};
```

---

## Performance Considerations

1. **Real-time Listeners**: Both camps and requests use real-time listeners. Consider pagination for large datasets.

2. **Geolocation**: Browser geolocation API can be slow. Implement loading states.

3. **Distance Calculations**: Calculated client-side. For very large numbers of camps, consider caching or server-side calculation.

4. **Map Rendering**: Leaflet maps can be resource-intensive. Consider lazy-loading or map clustering for many markers.

---

## Future Enhancements

1. **Camp History**: Instead of deleting camps, set status to "ended" and keep historical data
2. **Analytics**: Track donation patterns, popular locations, response times
3. **Notifications**: Push notifications when requests are updated
4. **Route Optimization**: Suggest optimal delivery routes
5. **Volunteer Management**: Track volunteers at each camp
6. **Appointment Scheduling**: Allow donors to book time slots
