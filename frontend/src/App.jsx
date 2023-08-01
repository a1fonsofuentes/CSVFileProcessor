import React, { useState } from "react";
import { uploadFile, loginUser } from "./api";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from "./components/login";
import Dashboard from "./components/dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" Component={Login} />
        <Route path="/dashboard" Component={Dashboard} />
      </Routes>
    </Router>
  );
}

export default App;
