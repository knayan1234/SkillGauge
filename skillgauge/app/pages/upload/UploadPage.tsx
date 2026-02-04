import React from "react";
import { useNavigate } from "react-router";

function UploadPage() {
  const navigate = useNavigate();

  function handleCTAClick() {
    navigate("/chat");
  }

  return (
    <div>
      <h1>UploadPage</h1>
      <button
        className="px-6 py-2 border-2 border-black rounded-lg hover:bg-black hover:text-white transition cursor-pointer"
        onClick={handleCTAClick}
      >
        Start
      </button>
    </div>
  );
}

export default UploadPage;
