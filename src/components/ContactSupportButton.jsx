import { Mail } from 'lucide-react';

export default function ContactSupportButton({ email = 'services@scoopify.club' }) {
  const handleClick = () => {
    window.open(`mailto:${email}?subject=Scoopify%20Club%20Customer%20Support`, '_blank');
  };
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 rounded bg-blue-100 text-blue-800 font-semibold hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Contact Support"
    >
      <Mail className="w-4 h-4" />
      Contact Support
    </button>
  );
}
