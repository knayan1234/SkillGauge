import React from "react";

const HeroBanner = () => {
  function handleStartClick() {
    console.log("Clicked");
  }
  return (
    <div className="flex items-center justify-center flex-col">
      <h1>SkillGauge</h1>
      <button
        className="px-6 py-2 border-2 border-black rounded-lg hover:bg-black hover:text-white transition cursor-pointer"
        onClick={handleStartClick}
      >
        Start
      </button>
    </div>
  );
};

export default HeroBanner;
