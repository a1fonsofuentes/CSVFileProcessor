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

  const response = await fetch(`${BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });
  return response;
}
