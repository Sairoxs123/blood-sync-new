import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./map-styles.css";
import L from "leaflet";
import { Send, MapPin, Navigation, Trash2 } from "lucide-react";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  where,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useAuth } from "../../utils/AuthContext";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const hospitalIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const campIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to recenter map
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export const HospitalDashboard = () => {
  const [camps, setCamps] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [bloodType, setBloodType] = useState("O+");
  const [units, setUnits] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { hospital, user } = useAuth();

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get hospital location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHospitalLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to a location if geolocation fails
          setHospitalLocation({ latitude: 20.5937, longitude: 78.9629 }); // Center of India
        }
      );
    }
  }, []);

  const handleDelete = async (id) => {
    const docref = doc(db, "requests", id)
    try {
      await deleteDoc(docref)
    } catch {
      window.alert("Sorry an error occurred while trying to delete request. Please refresh the page and try again.")
    }
  }

  useEffect(() => {
    // Listener for active camps
    const campsQuery = query(
      collection(db, "camps"),
      where("status", "==", "active")
    );

    const unsubscribeCamps = onSnapshot(campsQuery, (snapshot) => {
      const campsData = snapshot.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() };

        // Calculate distance if hospital location is available
        if (hospitalLocation) {
          data.distance = calculateDistance(
            hospitalLocation.latitude,
            hospitalLocation.longitude,
            data.latitude,
            data.longitude
          );
        }

        return data;
      });

      // Sort by distance
      campsData.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      setCamps(campsData);
    });

    // Listener for hospital's requests
    const unsubscribeRequests = onSnapshot(
      collection(db, "requests"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((req) => req.hospital === hospital);

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
  }, [hospital, hospitalLocation]);

  const createRequest = async () => {
    if (!selectedCamp) {
      alert("Please select a camp first");
      return;
    }
    if (!units || units < 1) {
      alert("Please enter a valid number of units");
      return;
    }

    const collectionRef = collection(db, "requests");

    try {
      console.log(hospital);
      await addDoc(collectionRef, {
        blood_type: bloodType,
        units: parseInt(units),
        hospital: hospital,
        requested_by: user.uid,
        status: "Pending",
        urgent: urgent,
        requested_at: serverTimestamp(),
        camp_id: selectedCamp.id,
        camp_location: selectedCamp.location,
        distance: selectedCamp.distance,
      });

      alert("Request submitted successfully to " + selectedCamp.location);
      setShowRequestModal(false);
      setBloodType("O+");
      setUnits("");
      setUrgent(false);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Error submitting request");
    }
  };

  const handleCampSelect = (camp) => {
    setSelectedCamp(camp);
    setShowRequestModal(true);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Hospital Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                Active Blood Donation Camps
              </h2>
            </div>
            <div className="h-[600px] relative">
              {hospitalLocation ? (
                <MapContainer
                  center={[
                    hospitalLocation.latitude,
                    hospitalLocation.longitude,
                  ]}
                  zoom={10}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <RecenterMap
                    center={
                      hospitalLocation
                        ? [
                            hospitalLocation.latitude,
                            hospitalLocation.longitude,
                          ]
                        : null
                    }
                  />

                  {/* Hospital Marker */}
                  <Marker
                    position={[
                      hospitalLocation.latitude,
                      hospitalLocation.longitude,
                    ]}
                    icon={hospitalIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong>Your Hospital</strong>
                        <br />
                        {hospital}
                      </div>
                    </Popup>
                  </Marker>

                  {/* Camp Markers */}
                  {camps.map((camp) => (
                    <Marker
                      key={camp.id}
                      position={[camp.latitude, camp.longitude]}
                      icon={campIcon}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <h3 className="font-bold text-lg text-red-600 mb-2">
                            {camp.location}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Coordinator: {camp.coordinator}
                          </p>
                          {camp.distance && (
                            <p className="text-sm text-gray-600 mb-2">
                              <Navigation className="inline h-4 w-4 mr-1" />
                              {camp.distance.toFixed(2)} km away
                            </p>
                          )}
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              Available Blood:
                            </p>
                            <div className="grid grid-cols-4 gap-1 text-xs">
                              {Object.entries(camp.inventory || {})
                                .filter(([_, units]) => units > 0)
                                .map(([type, units]) => (
                                  <div
                                    key={type}
                                    className="bg-red-50 px-1 py-0.5 rounded text-center"
                                  >
                                    <span className="font-bold text-red-600">
                                      {type}
                                    </span>
                                    : {units}
                                  </div>
                                ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCampSelect(camp)}
                            className="w-full mt-2 inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                          >
                            <Send className="mr-1 h-4 w-4" /> Request Blood
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <p className="text-gray-500">Loading map...</p>
                </div>
              )}
            </div>
          </div>

          {/* Camps List */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Nearby Camps ({camps.length})
              </h2>
            </div>
            <div className="p-4">
              {camps.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active camps at the moment
                </p>
              ) : (
                <div className="space-y-3">
                  {camps.map((camp) => (
                    <div
                      key={camp.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-red-600">
                            {camp.location}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Coordinator: {camp.coordinator}
                          </p>
                          {camp.distance && (
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <Navigation className="h-4 w-4 mr-1" />
                              {camp.distance.toFixed(2)} km away
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(camp.inventory || {})
                              .filter(([_, units]) => units > 0)
                              .map(([type, units]) => (
                                <span
                                  key={type}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800"
                                >
                                  {type}: {units} units
                                </span>
                              ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCampSelect(camp)}
                          className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Send className="mr-2 h-4 w-4" /> Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Request Status */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden sticky top-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">My Requests</h2>
            </div>
            <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {requests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No requests yet
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.map((val) => (
                    <div
                      className={`p-3 border rounded-lg relative ${
                        // Added 'relative' here
                        val.status === "Delivered"
                          ? "border-green-300 bg-green-50"
                          : val.status === "Delivering"
                          ? "border-blue-300 bg-blue-50"
                          : "border-yellow-300 bg-yellow-50"
                      }`}
                      key={val.id}
                    >
                      {/* --- Delete Button/Icon Added Here --- */}
                      <button
                        onClick={() => handleDelete(val.id)} // Replace 'handleDelete' with your actual function
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600 focus:outline-none p-1 rounded-full hover:bg-white transition duration-150"
                        aria-label="Delete request"
                      >
                        <Trash2 />
                      </button>
                      {/* ------------------------------------- */}

                      <div className="font-bold text-base">
                        {val.units} Units, {val.blood_type}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Camp: {val.camp_location || "N/A"}
                      </p>
                      {val.distance && (
                        <p className="text-xs text-gray-500">
                          Distance: {val.distance.toFixed(2)} km
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            val.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : val.status === "Delivering"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {val.status}
                        </span>
                        {val.urgent && (
                          <span className="text-xs font-bold text-red-600">
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedCamp && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Request Blood from {selectedCamp.location}
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Coordinator:</strong> {selectedCamp.coordinator}
                </p>
                {selectedCamp.distance && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Distance:</strong>{" "}
                    {selectedCamp.distance.toFixed(2)} km
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Type
                  </label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option>O+</option>
                    <option>O-</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units Needed
                  </label>
                  <input
                    type="number"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    placeholder="Enter number of units"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={urgent}
                    onChange={(e) => setUrgent(e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="urgent"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Mark as Urgent
                  </label>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedCamp(null);
                    setBloodType("O+");
                    setUnits("");
                    setUrgent(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  onClick={createRequest}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Send className="inline h-4 w-4 mr-1" /> Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
