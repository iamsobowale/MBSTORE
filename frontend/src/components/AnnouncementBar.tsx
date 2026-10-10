import { useEffect, useState } from "react";

const MESSAGES = [
  "Free shipping on orders over ₦100,000",
  "Use code WELCOME10 for 10% off your first order",
  "New arrivals just dropped — shop the collection",
];

/** Thin rotating promo bar pinned above the header. */
export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mb-announce">
      {/* key forces the fade-in animation to replay on each message change */}
      <span key={index}>{MESSAGES[index]}</span>
    </div>
  );
}
