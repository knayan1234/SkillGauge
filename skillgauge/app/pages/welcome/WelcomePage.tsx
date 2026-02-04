import Navbar from "../../components/Navbar";
import HeroBanner from "./sections/HeroBanner";

const WelcomePage = () => {
  return (
    <>
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <HeroBanner />
        </div>
      </div>
    </>
  );
};

export default WelcomePage;
