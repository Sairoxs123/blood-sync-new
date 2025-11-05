/**
 * Blood Sync - Firestore Setup Script
 *
 * This script helps initialize the Firestore database structure
 * for the new location-based blood donation system.
 *
 * Run this script once to set up your database.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// TODO: Replace with your Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Create a sample camp for testing
 */
async function createSampleCamp() {
  try {
    const campRef = await addDoc(collection(db, "camps"), {
      location: "Sample Blood Donation Camp - City Hall",
      coordinator: "Test Coordinator",
      coordinator_uid: "test-coordinator-uid-123",
      latitude: 28.6139,  // Replace with actual coordinates
      longitude: 77.2090,
      inventory: {
        "A+": 5,
        "A-": 2,
        "B+": 8,
        "B-": 1,
        "AB+": 3,
        "AB-": 0,
        "O+": 12,
        "O-": 4
      },
      status: "active",
      started_at: serverTimestamp()
    });

    console.log("✅ Sample camp created with ID:", campRef.id);
    return campRef.id;
  } catch (error) {
    console.error("❌ Error creating sample camp:", error);
  }
}

/**
 * Create a sample request for testing
 */
async function createSampleRequest(campId) {
  try {
    const requestRef = await addDoc(collection(db, "requests"), {
      blood_type: "O+",
      units: 3,
      hospital: "Sample General Hospital",
      status: "Pending",
      urgent: false,
      requested_at: serverTimestamp(),
      camp_id: campId,
      camp_location: "Sample Blood Donation Camp - City Hall",
      distance: 5.5
    });

    console.log("✅ Sample request created with ID:", requestRef.id);
  } catch (error) {
    console.error("❌ Error creating sample request:", error);
  }
}

/**
 * Main setup function
 */
async function setupDatabase() {
  console.log("🚀 Starting Firestore setup...\n");

  // Create sample camp
  console.log("📍 Creating sample camp...");
  const campId = await createSampleCamp();

  if (campId) {
    // Create sample request linked to the camp
    console.log("\n💉 Creating sample request...");
    await createSampleRequest(campId);
  }

  console.log("\n✨ Setup complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Check your Firestore console to verify the data");
  console.log("2. Update the security rules (see FIRESTORE_STRUCTURE.md)");
  console.log("3. Test the application with real users");
}

// Run setup
setupDatabase();

/**
 * FIRESTORE SECURITY RULES
 *
 * Copy these rules to your Firestore Security Rules in Firebase Console:
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *
 *     // Users collection
 *     match /users/{userId} {
 *       allow read: if request.auth != null && request.auth.uid == userId;
 *       allow create: if request.auth != null
 *         && request.auth.uid == userId
 *         && request.resource.data.email == request.auth.token.email;
 *       allow update: if request.auth != null && request.auth.uid == userId;
 *       allow delete: if false;
 *     }
 *
 *     // Camps collection
 *     match /camps/{campId} {
 *       allow read: if request.auth != null && resource.data.status == 'active';
 *       allow create: if request.auth != null
 *         && request.resource.data.coordinator_uid == request.auth.uid;
 *       allow update, delete: if request.auth != null
 *         && resource.data.coordinator_uid == request.auth.uid;
 *     }
 *
 *     // Requests collection
 *     match /requests/{requestId} {
 *       allow read, create, update: if request.auth != null;
 *       allow delete: if false;
 *     }
 *   }
 * }
 */

/**
 * COMPOSITE INDEXES NEEDED
 *
 * You may need to create these composite indexes in Firestore:
 *
 * Collection: camps
 * - coordinator_uid (Ascending) + status (Ascending)
 *
 * Collection: requests
 * - camp_id (Ascending) + status (Ascending)
 *
 * Firestore will prompt you to create these when you run queries.
 * Click the provided link to auto-create them.
 */
