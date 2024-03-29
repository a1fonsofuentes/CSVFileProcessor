import React, { useState } from "react";
import { uploadFile, loginUser } from "./api";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from "./components/login";
import Dashboard from "./components/dashboard";
import './App.css';
import SignUp from "./components/register";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" Component={Login} />
          <Route path="/register" Component={SignUp} />
          <Route path="/dashboard" Component={Dashboard} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
