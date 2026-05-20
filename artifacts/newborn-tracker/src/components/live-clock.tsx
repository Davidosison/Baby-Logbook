import { useEffect, useState } from "react";
import { format } from "date-fns";

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm font-medium text-muted-foreground tabular-nums">
      {format(time, "HH:mm:ss")}
    </div>
  );
}