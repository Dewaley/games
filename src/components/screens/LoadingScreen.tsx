import React from "react";
import { ClimbingBoxLoader } from "react-spinners";

const LoadingScreen = () => {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <ClimbingBoxLoader color="#ffffff" />
    </div>
  );
};

export default LoadingScreen;
