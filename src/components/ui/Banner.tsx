// /components/ui/Banner.tsx
const Banner = ({ text, color }: { text: string; color: string }) => (
  <div className={`w-full border-l-4 px-6 py-2 mt-2 text-sm font-medium rounded-r-lg shadow-sm ${color}`}>
    {text}
  </div>
);

export default Banner;
