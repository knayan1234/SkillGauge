import {
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow text-black px-4 py-3">
      <div className="max-w-screen flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="text-lg font-semibold">SkillGauge</div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="hover:underline">
            How to use
          </a>
          <a href="#" className="hover:underline">
            Why we are?
          </a>

          <BellIcon className="h-6 w-6 cursor-pointer hover:scale-110 transition" />
          <UserCircleIcon className="h-7 w-7 cursor-pointer hover:scale-110 transition" />
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? (
            <XMarkIcon className="h-7 w-7" />
          ) : (
            <Bars3Icon className="h-7 w-7" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-3 bg-sky-300 rounded-lg p-4 space-y-3">
          <a href="#" className="block">
            How to use
          </a>
          <a href="#" className="block">
            Why we are?
          </a>

          <div className="flex gap-4 pt-2">
            <BellIcon className="h-6 w-6 cursor-pointer" />
            <UserCircleIcon className="h-7 w-7 cursor-pointer" />
          </div>
        </div>
      )}
    </nav>
  );
}
