import React, { useState } from "react";
import { uploadFile, loginUser } from "./api";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState(""); // Add state for username
  const [password, setPassword] = useState(""); // Add state for password

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    // Check if the user is logged in before processing the file
    if (!loggedIn) {
      alert("Please log in first to access the file processing tool.");
      return;
    }

    setProcessing(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await uploadFile(formData);

      if (response.status === 200) {
        const contentType = response.headers.get("content-type");
        const blob = new Blob([response.data], { type: contentType });
        const url = URL.createObjectURL(blob);
        setDownloadLink(url);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (downloadLink) {
      const tempLink = document.createElement("a");
      tempLink.href = downloadLink;
      tempLink.setAttribute("download", "processed_data.csv");
      tempLink.click();
    }
  };

  const handleLogin = async () => {
    try {
      // Check if both username and password are provided
      if (!username || !password) {
        alert("Please enter both username and password.");
        return;
      }

      // Call the loginUser function with the provided credentials
      const response = await loginUser(username, password);

      if (response.status === 200) {
        // Set the logged-in state to true if login is successful
        setLoggedIn(true);
        alert("Login successful. You can now use the file processing tool.");
      } else {
        // If login is unsuccessful, show an error message
        alert("Login failed. Please check your username and password.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-4">Ventas – CSV File Processor</h1>

      {!loggedIn && (
        <React.Fragment>
          {/* Add input fields for username and password */}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="py-2 px-4 border rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="py-2 px-4 border rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={handleLogin}
            className="py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring focus:ring-blue-300 mt-4"
          >
            Login
          </button>
        </React.Fragment>
      )}

      {loggedIn && (
        // ... (previous code)
      )}
    </div>
  );
}

export default App;
