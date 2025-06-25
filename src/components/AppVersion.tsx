import React from "react";

interface AppVersionProps {
  version?: string;
  env?: "PROD" | "QA" | string;
  className?: string;
}

const AppVersion: React.FC<AppVersionProps> = ({
  version = import.meta.env.VITE_APP_VERSION ?? "0.1.2",
  env = import.meta.env.VITE_APP_ENV ?? "PROD",
  className = "",
}) => {
  const isQA = env.toUpperCase() === "QA";

  return (
    <div
      className={`text-xs text-gray-400 px-3 py-1 border-gray-800 ${className}`}
    >
      <span>
        v{version} {isQA && <span className="text-yellow-400 ml-1">(QA)</span>}
      </span>
    </div>
  );
};

export default AppVersion;
