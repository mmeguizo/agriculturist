export default function LoadingSpinner({
  size = "md",
  label,
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };
  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-gray-200 border-t-green-600`}
      />
      {label && <p className="text-sm font-medium text-gray-500">{label}</p>}
    </div>
  );
}
