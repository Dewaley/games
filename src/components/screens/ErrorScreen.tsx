import React from "react";

const ErrorScreen = ({ ctaBtn,message }: { ctaBtn: React.ReactNode; message: string }) => {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="flex h-screen items-center justify-center">
        <div className="text-center shadow-lg rounded-lg p-8 max-w-xl">
          <h1 className="text-4xl font-bold mb-4">
            Oops! Something Went Wrong 🛠️
          </h1>
          <p className="text-lg mb-6">
            {message}
          </p>
          {ctaBtn}
          <p className="text-sm text-gray-500 mt-4">
            If the issue persists, refresh the page or come back later. We’re
            working to fix this! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorScreen;
