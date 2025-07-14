import React from "react";

const Logo: React.FC = () => {
  return (
    <div className="flex items-center text-xl">
      <img
        src="/main_logo.png"
        alt="logo"
        className="h-8 w-auto sm:h-10 lg:h-10 max-w-full object-contain"
      />
    </div>
  );
};

export default Logo;
