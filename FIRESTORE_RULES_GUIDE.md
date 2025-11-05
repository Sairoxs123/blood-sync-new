# 🔐 How to Apply Firestore Security Rules

## Quick Steps

### Option 1: Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Copy the Rules**
   - Open the `firestore.rules` file in this project
   - Copy all the content

4. **Paste and Publish**
   - Paste the rules into the editor in Firebase Console
   - Click "Publish" button
   - Wait for confirmation

5. **Verify**
   - Test your app - the "insufficient permissions" error should be gone!

---

### Option 2: Firebase CLI

If you have Firebase CLI installed:

```bash
# Login to Firebase
firebase login

# Initialize Firestore (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

The rules will be deployed from the `firestore.rules` file.

---

## What These Rules Do

### 🧑‍💼 Users Collection (`/users/{userId}`)
- ✅ **Read**: Users can read their own profile
- ✅ **Create**: Auto-created on first login with email validation
- ✅ **Update**: Users can update their own profile
- ❌ **Delete**: Disabled (change to `true` if needed)

### ⛺ Camps Collection (`/camps/{campId}`)
- ✅ **Read**: All authenticated users can read active camps
- ✅ **Create**: Only coordinators can create camps (must match their UID)
- ✅ **Update/Delete**: Only the camp creator can modify/delete their camp
- 🔒 Security: Prevents users from modifying other coordinators' camps

### 💉 Requests Collection (`/requests/{requestId}`)
- ✅ **Read**: All authenticated users can read requests
- ✅ **Create**: Any authenticated user can create requests
- ✅ **Update**: Any authenticated user can update (coordinators change status)
- ❌ **Delete**: Disabled (change to `true` if needed)

---

## Testing the Rules

After applying the rules, test these scenarios:

### ✅ Should Work:
- Coordinator can start a camp
- Coordinator can update their own camp inventory
- Hospital can view all active camps
- Hospital can create blood requests
- Coordinator can update request status
- User can read their own profile in `/users/{uid}`

### ❌ Should Fail:
- Unauthenticated users cannot read anything
- Users cannot read other users' profiles
- Coordinators cannot modify other coordinators' camps
- Reading camps with `status != 'active'` (ended camps are hidden)

---

## Troubleshooting

### Still getting "insufficient permissions"?

1. **Check Authentication**
   - Make sure you're logged in
   - Check browser console for auth errors
   - Verify Firebase Auth is working

2. **Verify Rules Were Applied**
   - Go to Firebase Console → Firestore → Rules
   - Check if your rules are there
   - Look for last published timestamp

3. **Check Document Structure**
   - Ensure `coordinator_uid` field matches the logged-in user's UID
   - Verify `status` field is set to "active" for camps
   - Check that document IDs match (especially for users collection)

4. **Hard Refresh**
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Try incognito/private window

5. **Check Browser Console**
   - Look for specific permission errors
   - Note which collection is causing issues
   - Check the exact field that's being validated

---

## Advanced: Custom Role-Based Access

If you want more granular control based on roles:

```javascript
// Example: Only NSS_COORDINATOR can create camps
match /camps/{campId} {
  allow create: if request.auth != null
    && request.auth.token.role == 'NSS_COORDINATOR'
    && request.resource.data.coordinator_uid == request.auth.uid;
}

// Example: Only HOSPITAL can create requests
match /requests/{requestId} {
  allow create: if request.auth != null
    && request.auth.token.role == 'HOSPITAL';
}
```

To use custom claims, you need to set them via Firebase Admin SDK or Cloud Functions.

---

## Security Best Practices

✅ **Do:**
- Always require authentication (`request.auth != null`)
- Validate user ownership (`request.auth.uid == userId`)
- Use specific field validation
- Log and monitor access patterns
- Test rules in Firebase Console simulator

❌ **Don't:**
- Use `allow read, write: if true;` (open access!)
- Trust client-side data without validation
- Expose sensitive user data
- Allow unrestricted deletes
- Skip testing rules before deploying

---

## Need Help?

- **Firebase Documentation**: https://firebase.google.com/docs/firestore/security/get-started
- **Rules Reference**: https://firebase.google.com/docs/reference/security/database
- **Test Rules**: Use the "Rules Playground" tab in Firebase Console

---

## Quick Reference

Copy this to Firebase Console → Firestore → Rules:

```
See the firestore.rules file in your project directory
```

Then click **Publish** ✅
