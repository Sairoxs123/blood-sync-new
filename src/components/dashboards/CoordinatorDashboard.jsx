import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  query,
  where,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { Plus, MapPin, PlayCircle, StopCircle } from "lucide-react";
import { useAuth } from "../../utils/AuthContext";

export const CoordinatorDashboard = () => {
  const [activeCamp, setActiveCamp] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [campLocation, setCampLocation] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [inventory, setInventory] = useState({
    "A+": 0,
    "A-": 0,
    "B+": 0,
    "B-": 0,
    "AB+": 0,
    "AB-": 0,
    "O+": 0,
    "O-": 0,
  });
  const [newBloodGroup, setNewBloodGroup] = useState("");
  const [newUnits, setNewUnits] = useState("");
  const { user } = useAuth();

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          (error) => reject(error)
        );
      }
    });
  };

  const startCamp = async () => {
    try {
      if (!campLocation.trim() || !coordinatorName.trim()) {
        alert("Please enter camp location and coordinator name");
        return;
      }

      const location = await getLocation();

      const campRef = await addDoc(collection(db, "camps"), {
        location: campLocation.trim(),
        coordinator: coordinatorName.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        inventory: inventory,
        status: "active",
        started_at: serverTimestamp(),
        coordinator_uid: user?.uid || "unknown",
      });

      alert("Camp started successfully!");
      setShowStartModal(false);
      setCampLocation("");
      setCoordinatorName("");
    } catch (error) {
      console.error("Error starting camp:", error);
      alert("Error starting camp: " + error.message);
    }
  };

  const endCamp = async () => {
    if (!activeCamp) return;

    const confirmed = window.confirm(
      "Are you sure you want to end this camp session?"
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "camps", activeCamp.id));
      const requestsref = collection(db, "requests");
      const q = query(requestsref, where("camp_id", "==", activeCamp.id), where("status", "==", "Pending"));
      try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log(
            `No documents found in 'requests' where ${field} is equal to ${value}.`
          );
          return;
        }

        console.log(
          `Found ${querySnapshot.docs.length} documents to update...`
        );

        const updatePromises = [];
        const updateData = {
          status: "Camp Closed Before Approving Request"
        }
        querySnapshot.forEach((document) => {
          const docRef = doc(db, "requests", document.id);

          updatePromises.push(updateDoc(docRef, updateData));
        });

        await Promise.all(updatePromises);

        console.log("All matching documents successfully updated!");
      } catch (error) {
        console.error("Error updating documents: ", error);
      }
      alert("Camp ended successfully!");
    } catch (error) {
      console.error("Error ending camp:", error);
      alert("Error ending camp: " + error.message);
    }
  };

  const addUnit = async (bloodGroup) => {
    if (!activeCamp) return;
    try {
      const campRef = doc(db, "camps", activeCamp.id);
      await updateDoc(campRef, {
        [`inventory.${bloodGroup}`]: increment(1),
      });
    } catch (error) {
      console.error("Error adding unit:", error);
    }
  };

  const removeUnit = async (bloodGroup) => {
    if (!activeCamp) return;
    try {
      if (activeCamp.inventory[bloodGroup] > 0) {
        const campRef = doc(db, "camps", activeCamp.id);
        await updateDoc(campRef, {
          [`inventory.${bloodGroup}`]: increment(-1),
        });
      }
    } catch (error) {
      console.error("Error removing unit:", error);
    }
  };

  const addNewBloodGroup = async () => {
    if (!activeCamp) return;
    try {
      if (!newBloodGroup.trim() || !newUnits) {
        alert("Please enter both blood group and units");
        return;
      }
      const units = parseInt(newUnits);
      if (isNaN(units) || units < 0) {
        alert("Please enter a valid number of units");
        return;
      }
      const campRef = doc(db, "camps", activeCamp.id);
      await updateDoc(campRef, {
        [`inventory.${newBloodGroup.trim()}`]: units,
      });
      setNewBloodGroup("");
      setNewUnits("");
      setShowInventoryModal(false);
    } catch (error) {
      console.error("Error adding new blood group:", error);
    }
  };

  const updateRequestStatus = async (id, newStatus) => {
    try {
      const requestRef = doc(db, "requests", id);
      await updateDoc(requestRef, {
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    // Listener for active camp by this coordinator
    const campsQuery = query(
      collection(db, "camps"),
      where("coordinator_uid", "==", user.uid),
      where("status", "==", "active")
    );

    const unsubscribeCamps = onSnapshot(campsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const campData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };
        setActiveCamp(campData);
      } else {
        setActiveCamp(null);
      }
    });

    // Listener for requests to this camp
    const unsubscribeRequests = onSnapshot(
      collection(db, "requests"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((req) => {
            // Show requests for this coordinator's active camp
            if (!activeCamp) return false;
            return req.camp_id === activeCamp.id;
          });

        data.sort((a, b) => {
          const aTime = a.requested_at?.toDate
            ? a.requested_at.toDate()
            : a.requested_at;
          const bTime = b.requested_at?.toDate
            ? b.requested_at.toDate()
            : b.requested_at;
          return bTime - aTime;
        });
        setRequests(data);
      }
    );

    return () => {
      unsubscribeCamps();
      unsubscribeRequests();
    };
  }, [user, activeCamp?.id]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        NSS Coordinator Dashboard
      </h1>

      {/* Camp Status */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        {!activeCamp ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              No Active Camp
            </h2>
            <p className="text-gray-600 mb-4">
              Start a new blood donation camp to begin collecting donations
            </p>
            <button
              onClick={() => setShowStartModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlayCircle className="mr-2 h-5 w-5" /> Start Camp
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <MapPin className="mr-2 h-6 w-6 text-red-600" />
                  {activeCamp.location}
                </h2>
                <p className="text-gray-600 mt-1">
                  Coordinator: {activeCamp.coordinator}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Location: {activeCamp.latitude?.toFixed(6)},{" "}
                  {activeCamp.longitude?.toFixed(6)}
                </p>
              </div>
              <button
                onClick={endCamp}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <StopCircle className="mr-2 h-4 w-4" /> End Camp
              </button>
            </div>
          </div>
        )}
      </div>

      {activeCamp && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Camp Inventory */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden md:col-span-1">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Camp Inventory
              </h2>
            </div>
            <div className="p-4">
              <div className="mt-4 space-y-2">
                {Object.keys(activeCamp.inventory || {})
                  .sort()
                  .map((key, idx) => {
                    return (
                      <div
                        className="flex justify-between items-center"
                        key={idx}
                      >
                        <span className="font-bold text-lg text-red-600">
                          {key}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeUnit(key)}
                            className="w-8 h-8 inline-flex items-center justify-center border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            disabled={activeCamp.inventory[key] === 0}
                          >
                            -
                          </button>
                          <span className="font-bold text-lg text-gray-800 min-w-[2rem] text-center">
                            {activeCamp.inventory[key] || 0}
                          </span>
                          <button
                            onClick={() => addUnit(key)}
                            className="w-8 h-8 inline-flex items-center justify-center border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <button
                onClick={() => setShowInventoryModal(true)}
                className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Blood Group
              </button>
            </div>
          </div>

          {/* Incoming Requests */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden md:col-span-2">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Incoming Requests to This Camp
              </h2>
            </div>
            <div className="p-4">
              {requests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No requests yet
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {requests.map((val, idx) => {
                    return (
                      <div
                        className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
                        key={idx}
                      >
                        <div>
                          <span className="font-bold text-lg text-red-600">
                            {val.units} Units, {val.blood_type}
                          </span>
                          <p className="text-sm text-gray-600">
                            From: {val.hospital} {val.urgent ? "(Urgent)" : ""}
                          </p>
                          {val.distance && (
                            <p className="text-xs text-gray-500">
                              Distance: {val.distance.toFixed(2)} km
                            </p>
                          )}
                        </div>
                        <select
                          value={val.status || "Pending"}
                          onChange={(e) =>
                            updateRequestStatus(val.id, e.target.value)
                          }
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Delivering">Delivering</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for starting camp */}
      {showStartModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Start Blood Donation Camp
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camp Location / Place Name
                  </label>
                  <input
                    type="text"
                    value={campLocation}
                    onChange={(e) => setCampLocation(e.target.value)}
                    placeholder="e.g., Central Park, City Hall"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Your current location will be captured automatically
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    setCampLocation("");
                    setCoordinatorName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  onClick={startCamp}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Start Camp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding new blood group */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Add New Blood Group
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value)}
                    placeholder="e.g., A+, B-, O+"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Units
                  </label>
                  <input
                    type="number"
                    value={newUnits}
                    onChange={(e) => setNewUnits(e.target.value)}
                    placeholder="Enter number of units"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowInventoryModal(false);
                    setNewBloodGroup("");
                    setNewUnits("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewBloodGroup}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Add Blood Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
