import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { logoutUser, setUser } from './redux/authSlice';
import { ref, get, set } from 'firebase/database';
import axios from 'axios';

// Eagerly loaded
import Header from './components/Header';
import Login from './pages/Login';
import Loader from './components/Loader';
import Room from './pages/Room';

// Lazy-loaded routes
const ProtectedRoute = lazy(() => import('./ProtectedRoute'));
const Home = lazy(() => import('./pages/Home'));
const Decks = lazy(() => import('./pages/Decks'));
const Profile = lazy(() => import('./pages/profile'));
const Store = lazy(() => import('./pages/Store'));
const DeckView = lazy(() => import('./pages/DeckView'));
const RoomList = lazy(() => import('./pages/RoomList'));
const CreateRoom = lazy(() => import('./components/CreateRoom'));
const JoinRoom = lazy(() => import('./components/JoinRoom'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);

        let userData;

        if (snapshot.exists()) {
          userData = { uid: firebaseUser.uid, ...snapshot.val() };
        } else {
          userData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL,
            createdAt: Date.now(),
          };

          try {
            await axios.post("https://sendwelcomeemail-shakoavcgq-uc.a.run.app", {
              email: userData.email,
              name: userData.name,
            });

            await set(userRef, userData);
            console.log("✅ Welcome email sent!");
          } catch (err) {
            console.error("❌ Email send failed:", err.message);
            dispatch(logoutUser());
            navigate("/login", { replace: true });
            return;
          }
        }

        sessionStorage.setItem('user', JSON.stringify(userData));
        dispatch(setUser(userData));
      } else {
        dispatch(logoutUser());
        // Redirect only if not already on /login or /join-room
        if (!["/login"].includes(location.pathname)) {
          navigate("/login", { replace: true });
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <Loader />;


  return (
  <>
    <Header />
    <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/decks" element={<Decks />} />
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/store" element={<Store />} />
          <Route path="/deck-view/:deckId" element={<DeckView />} />
          <Route path="/create-room" element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/room/:roomId" element={<Room/>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
    </Suspense>
  </>
);

}

export default App;
