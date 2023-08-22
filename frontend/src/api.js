import axios from "axios";

const BASE_URL = "http://localhost:8000"; // Replace with your FastAPI backend URL

export async function uploadFile(formData) {
  return await axios.post(`${BASE_URL}/upload/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function processFile(fileData) {
  return await axios.post(`${BASE_URL}/process/`, fileData, {
    responseType: "blob",
  });
}

export async function loginUser(username, password) {
  const credentials = `${username}:${password}`;
  const encodedCredentials = btoa(credentials); // Base64 encode the credentials

  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`, // Include the encoded credentials in the "Authorization" header
    },
    body: JSON.stringify({}), // No need to send an empty body for basic authentication
  });
  console.log(response)
  if (response.status == 200) {
    localStorage.setItem("user", username)
  }
  return response;
}
