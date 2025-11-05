import { useState } from "react";
import { createContext, useContext, useEffect } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [hospital, setHospital] = useState(null)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenres = await user.getIdTokenResult();
          const role = idTokenres.claims.role || null;
          setUser(user);
          setUserRole(role);
          if (role == "HOSPITAL") {
            const hospital = idTokenres.claims.hospital || null
            setHospital(hospital)
          }
          const ref = doc(db, "users", user.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              email: user.email,
              role: role,
              createdAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.log(`Error getting role: ${err}`);
          await signOut(auth);
        }
      } else {
        setUser(null)
        setUserRole(null)
        setHospital(null)
      }
      setLoading(false)
    });

    return () => unsubscribe();
  }, []);


  const value = {
    user,
    userRole,
    hospital,
    loading,
    auth,
    db
  }

  return (
    <AuthContext.Provider value={value}>
        {!loading && children}
    </AuthContext.Provider>
  )

};

export const useAuth = () => {
    return useContext(AuthContext)
}

