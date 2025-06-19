import React from "react";

interface AppVersionProps {
  version?: string;
  env?: "PROD" | "QA" | string;
  className?: string;
}

const AppVersion: React.FC<AppVersionProps> = ({
  version = import.meta.env.VITE_APP_VERSION ?? "0.1.1",
  env = import.meta.env.VITE_APP_ENV ?? "PROD",
  className = "",
}) => {
  const isQA = env.toUpperCase() === "QA";

  return (
    <div
      className={`text-xs font-mono text-gray-400 px-3 py-1 border-t border-gray-800 bg-gray-900 ${className}`}
    >
      <span>
        v{version} {isQA && <span className="text-yellow-400 ml-1">(QA)</span>}
      </span>
    </div>
  );
};

export default AppVersion;
