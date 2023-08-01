import React, { useState } from "react";
import { uploadFile } from "./api";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

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

  return (
    <div className="container mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-4">Ventas – CSV File Processor</h1>
      <input
        type="file"
        onChange={handleFileChange}
        className="py-2 px-4 border rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:border-blue-500"
      />
      <button
        onClick={handleFileUpload}
        disabled={processing}
        className={`py-2 px-4 rounded-md ${
          processing ? "bg-blue-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        } text-white focus:outline-none focus:ring focus:ring-blue-300 mt-4`}
      >
        {processing ? "Processing..." : "Upload & Process"}
      </button>
      {downloadLink && (
        <button
          onClick={handleDownload}
          className="py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring focus:ring-green-300 mt-4"
        >
          Download Processed CSV
        </button>
      )}
    </div>
  );
}

export default App;
