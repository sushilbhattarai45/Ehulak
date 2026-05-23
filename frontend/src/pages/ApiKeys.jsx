import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";

import axiosInstance from "../components/api/axiosInstance.js";
import { Plus, Copy, Eye, EyeOff } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";


export default function ApiKeys() {
  const { apiKey, user, accessToken, fetchApiKey } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };
  const createKey = async () => {
    try {
      const newKey = await axiosInstance.post("/creds/createApiKey",{}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

        console.log("API key creation response:", newKey.data.apiKey);

      

      await fetchApiKey(user._id || user.userId); 
      
      // Refresh the API key in context after creation
    } catch (e) {
      // Optionally show a toast or handle error

      console.error("Error creating API key:", e);
    }

    // Implement API key creation logic here, e.g. call an endpoint to generate a new key
    // After successful creation, you would typically fetch the new key and update the context
  };

  return (
    <div>
      <PageHeader
        title="API Key"
        description="Your API key is used to authenticate requests against the Send Email API. Keep it secret!"
        actions={
          !apiKey && (
            <button
              onClick={createKey}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-base"
            >
              <Plus className="h-4 w-4" /> Create key
            </button>
          )
        }
      />
      {apiKey ? (
        <div className="mt-8 max-w-xl mx-auto border border-border rounded-lg bg-card px-4 py-3 flex flex-row items-center gap-4 shadow-sm">
          <span className="font-semibold mr-2">Key:</span>
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded select-all break-all flex-1 min-w-0" style={{maxWidth: 320}}>
            {showKey ? apiKey : "••••••••••••••••••••••••••••••••"}
          </span>
          <button
            className="ml-2 text-muted-foreground hover:text-foreground transition-base"
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? "Hide API Key" : "Show API Key"}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            className="ml-2 text-muted-foreground hover:text-foreground transition-base"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy</span>
          </button>
          {copied && <span className="ml-2 text-xs text-green-600">Copied!</span>}
        </div>
      ) : (
        <div className="mt-8 text-center text-muted-foreground text-sm">
          No API key found for your account.
          <br />
          Click "Create key" to generate a new API key.
        </div>
      )}
      {apiKey && (
        <div className="max-w-xl mx-auto text-xs text-muted-foreground mt-2 text-right">
          This key is associated with your account: <span className="font-mono">{user?.email}</span>
        </div>
      )}
    </div>
  );
}
