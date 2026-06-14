import { lazy } from "react";
import { Route, Routes } from "react-router-dom";

import Login from "../pages/login/Login";
import PrivateRoute from "./PrivateRoute";
import Layout from "../layout/Layout";

const Home = lazy(() => import("../pages/Home/Home"));
const Decks = lazy(() => import("../pages/decks/Decks"));
const Profile = lazy(() => import("../pages/profile/profile"));
const Store = lazy(() => import("../pages/store/Store"));
const DeckView = lazy(() => import("../pages/decks/DeckView"));
const RoomList = lazy(() => import("../pages/room/RoomList"));
const CreateRoom = lazy(() => import("../pages/room/CreateRoom"));
const JoinRoom = lazy(() => import("../pages/room/JoinRoom"));
const NotFound = lazy(() => import("../components/NotFound"));
const Room = lazy(() => import("../pages/room/Room"));

export function MainRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="decks" element={<Decks />} />
        <Route path="rooms" element={<RoomList />} />
        <Route path="store" element={<Store />} />
        <Route path="deck-view/:deckId" element={<DeckView />} />
        <Route path="create-room" element={<CreateRoom />} />
        <Route path="join-room" element={<JoinRoom />} />
        <Route path="room/:roomId" element={<Room />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
