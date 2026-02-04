import { useState } from "react";
import LoginModal from "../../login/LoginModal";

const HeroBanner = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login");

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">SkillGauge</h1>

      <div className="flex gap-4">
        <button
          onClick={() => {
            setMode("login");
            setOpen(true);
            // TODO: If correctly registered, then will go to next page
          }}
          className="px-6 py-2 border rounded-lg hover:bg-black hover:text-white transition"
        >
          Login
        </button>

        <button
          onClick={() => {
            setMode("register");
            setOpen(true);
            // TODO: If correctly registered, then will go to next page
          }}
          className="px-6 py-2 border rounded-lg hover:bg-black hover:text-white transition"
        >
          Register
        </button>
      </div>

      {open && <LoginModal mode={mode} onClose={() => setOpen(false)} />}
    </div>
  );
};

export default HeroBanner;
