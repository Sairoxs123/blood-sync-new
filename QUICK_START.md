# 🚀 Quick Start Guide - Blood Sync Location-Based System

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify Firebase Configuration
Check that `firebase.js` has your Firebase project credentials.

### 3. Start Development Server
```bash
npm run dev
```

### 4. Grant Location Permissions
When prompted by the browser, **allow** location access.

---

## 🎯 Test the New Features

### As a Coordinator:

1. **Login** as a coordinator user
2. You'll see "No Active Camp" message
3. Click **"Start Camp"** button
4. Fill in the form:
   - **Camp Location**: "City Hall" (or any name)
   - **Coordinator Name**: Your name
5. Click **"Start Camp"**
6. Browser will ask for location permission → Click **Allow**
7. Your camp is now active! 🎉
8. Try these actions:
   - Click **+** to add blood units
   - Click **-** to remove blood units
   - Click **"Add New Blood Group"** to add custom types
9. When done, click **"End Camp"**

### As a Hospital:

1. **Login** as a hospital user
2. Browser will ask for location permission → Click **Allow**
3. You'll see a map with:
   - 🔵 Blue marker = Your hospital
   - 🔴 Red markers = Active camps
4. Explore the interface:
   - Click on a **red camp marker** on the map
   - View camp details in the popup
   - Or scroll down to see the **camp list**
5. Send a request:
   - Click **"Request Blood"** on any camp
   - Fill the form (blood type, units)
   - Check "Mark as Urgent" if needed
   - Click **"Submit Request"**
6. Track your request:
   - Check the **sidebar** for request status
   - Status will update in real-time

---

## 📍 Location Permissions

### Browser Prompts:
- **Chrome/Edge**: "Allow [site] to access your location?"
- **Firefox**: "Share your location with [site]?"
- **Safari**: "Allow [site] to use your current location?"

### If Blocked:
1. **Chrome**: Click the 🔒 lock icon in address bar → Site settings → Location → Allow
2. **Firefox**: Click the ⓘ info icon → Clear permissions → Reload
3. **Safari**: Preferences → Websites → Location → Allow

### Troubleshooting:
- **No prompt appearing?** Check if already blocked
- **Localhost only**: Geolocation works on localhost for development
- **Production**: Must use HTTPS

---

## 🗺️ Understanding the Map

### Markers:
- **Blue (Hospital)**: Your current location
- **Red (Camp)**: Active donation camps

### Interactions:
- **Click marker**: View details in popup
- **Zoom**: Mouse wheel or +/- buttons
- **Pan**: Click and drag
- **Reset view**: Reload page

### Popup Info:
- Camp location name
- Coordinator name
- Distance from you (in km)
- Available blood inventory
- "Request Blood" button

---

## 🎨 UI Elements Explained

### Coordinator Dashboard:

**No Active Camp State:**
```
┌─────────────────────────────────┐
│  No Active Camp                 │
│  Start a new blood donation...  │
│  [Start Camp] button             │
└─────────────────────────────────┘
```

**Active Camp State:**
```
┌─────────────────────────────────────────────┐
│ 📍 City Hall              [End Camp] button │
│ Coordinator: John Doe                       │
│ Location: 28.6139, 77.2090                 │
└─────────────────────────────────────────────┘

┌─────────────┐  ┌───────────────────────────┐
│ Inventory   │  │ Incoming Requests         │
│ A+ [5]      │  │ 3 Units, O+ from Hospital │
│ B+ [8]      │  │ [Status dropdown]         │
└─────────────┘  └───────────────────────────┘
```

### Hospital Dashboard:

```
┌────────────────────────────────────────┐
│ 🗺️ Active Blood Donation Camps         │
│ [Interactive Map - 600px height]       │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────┐  ┌─────────────┐
│ Nearby Camps (3)       │  │ My Requests │
│ • City Hall - 5.5km    │  │ O+ - 3u     │
│   [Request] button      │  │ Pending     │
└────────────────────────┘  └─────────────┘
```

---

## 🔄 Real-Time Updates

All these happen **automatically** without page refresh:

✅ **Coordinators see:**
- New requests appear instantly
- Inventory changes reflect immediately

✅ **Hospitals see:**
- New camps appear on map
- Ended camps disappear from map
- Request status updates (Pending → Delivering → Delivered)

---

## 🧪 Quick Test Scenario

**Full Flow Test (5 minutes):**

1. **Open 2 browser windows**
   - Window 1: Coordinator login
   - Window 2: Hospital login

2. **Window 1 - Start Camp:**
   - Click "Start Camp"
   - Enter: "Test Camp Alpha"
   - Enter your name
   - Allow location
   - Add some inventory: O+ = 10 units

3. **Window 2 - View Camp:**
   - Allow location when prompted
   - See "Test Camp Alpha" appear on map
   - Click the red marker
   - View popup details

4. **Window 2 - Send Request:**
   - Click "Request Blood" in popup
   - Select: O+, 3 units
   - Submit request

5. **Window 1 - Handle Request:**
   - See request appear in "Incoming Requests"
   - Change status: Pending → Delivering → Delivered

6. **Window 2 - Track Status:**
   - Watch sidebar update in real-time
   - See status change to "Delivered" ✅

7. **Window 1 - End Camp:**
   - Click "End Camp"
   - Confirm

8. **Window 2 - Camp Disappears:**
   - See red marker vanish from map
   - Camp removed from list

---

## 📊 Sample Data Format

### Sample Camp:
```json
{
  "location": "Central Park",
  "coordinator": "Alice Smith",
  "latitude": 40.7829,
  "longitude": -73.9654,
  "inventory": {
    "A+": 5, "B+": 3, "O+": 10
  },
  "status": "active"
}
```

### Sample Request:
```json
{
  "blood_type": "O+",
  "units": 3,
  "hospital": "City General",
  "camp_id": "abc123",
  "camp_location": "Central Park",
  "distance": 5.5,
  "status": "Pending",
  "urgent": false
}
```

---

## ⚠️ Common Issues & Fixes

### Issue: Map is blank
**Fix:** Check browser console. Likely CSS import missing or internet connection needed for tiles.

### Issue: "Allow location" not appearing
**Fix:** Check if location is already blocked. Clear site data and reload.

### Issue: No camps showing
**Fix:**
1. Verify camps collection exists in Firestore
2. Check that camp status = "active"
3. Open Network tab - check Firestore requests

### Issue: Distance showing as NaN
**Fix:** Hospital location not captured. Refresh page and allow location again.

### Issue: Requests not appearing for coordinator
**Fix:** Ensure request has correct `camp_id` matching active camp.

---

## 📚 Additional Resources

- **Full Documentation**: `FIRESTORE_STRUCTURE.md`
- **Change Summary**: `CHANGES_SUMMARY.md`
- **User Guide**: `README_UPDATED.md`
- **Setup Script**: `setup-firestore.js`

---

## 🎓 Key Concepts

1. **Camps are temporary**: They exist only while active
2. **Requests are targeted**: Each request links to a specific camp
3. **Location is required**: Both users need to grant permission
4. **Real-time sync**: All updates happen instantly via Firestore

---

## ✅ Success Checklist

After setup, you should be able to:

- [ ] Start a camp as coordinator
- [ ] See camp on map as hospital
- [ ] Calculate distance correctly
- [ ] Send request to specific camp
- [ ] See request appear for coordinator
- [ ] Update request status
- [ ] Track status updates in real-time
- [ ] End camp and see it disappear

---

**🎉 You're all set!** Start exploring the new location-based blood donation system.

**Need help?** Check the documentation files or inspect browser console for errors.
