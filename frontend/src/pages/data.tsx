import * as React from "react";
import { URLStats } from "../components/ui/url-stats";

export default function DataPage() {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get("url");
    setUrl(queryUrl);
  }, []);

  if (!url) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">URL downtimes</h1>
        <p className="text-muted-foreground mt-2">No URL specified in query.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">URL downtimes</h1>
      <URLStats url={url} />
    </div>
  );
}
