export default function Loading() {
  return (
    <div className="min-h-screen bg-mountain-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <span className="w-10 h-10 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin inline-block" />
        <h2 className="font-heading font-bold text-snow-white text-lg">Loading Viberide...</h2>
      </div>
    </div>
  );
}
