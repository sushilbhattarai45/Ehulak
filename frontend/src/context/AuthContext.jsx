import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import axiosInstance from "../components/api/axiosInstance.js";
import { toast } from "sonner";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [apiKey, setApiKey] = useState(() => {
    const stored = localStorage.getItem("apiKey");
    return stored ? stored : null;
  });
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem("accessToken") || null;
  });
  const [loading, setLoading] = useState(false);
  const [dlqEmails, setDlqEmails] = useState({ emails: [] });
  const [emailEvents, setEmailEvents] = useState({ emails: [] });

  const hasFetchedDLQ = useRef(false); // Ref to track if DLQ emails have been fetched at least once
  // Helper to fetch API key for the user
  const fetchApiKey = async (userId) => {
    try {
      const res = await axiosInstance.get(`/creds/getApiKeyForUser`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("API key fetch response:", res.data);
      if (res.data && res.data.apiKey) {
        setApiKey(res.data.apiKey);
        console.log("hisiid" + apiKey);
        localStorage.setItem("apiKey", res.data.apiKey);
        return res.data.apiKey;
      }
    } catch (e) {
      // Optionally show a toast or handle error
      setApiKey(null);
      localStorage.removeItem("apiKey");
    }
    return null;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", { email, password });
      // Expecting: { success, message, accessToken, user }
      const { accessToken: token, user: userData } = res.data;
      setUser(userData);
      setAccessToken(token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("accessToken", token);
      // Fetch and store API key
      if (userData && (userData._id || userData.userId))
        await fetchApiKey(userData._id || userData.userId);
      toast.success("Signed in successfully");
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/register", {
        email,
        password,
        accountType: "local",
        status: "active",
      });
      const userData = res.data.user || res.data;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      // No accessToken on signup? If yes, handle like login:
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
        localStorage.setItem("accessToken", res.data.accessToken);
      }
      // Fetch and store API key
      if (userData && (userData._id || userData.userId))
        await fetchApiKey(userData._id || userData.userId);
      toast.success("Account created successfully");
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Signup failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

const logout = () => {
  hasFetchedDLQ.current = false;

  setUser(null);
  setApiKey(null);
  setAccessToken(null);

  localStorage.removeItem("user");
  localStorage.removeItem("apiKey");
  localStorage.removeItem("accessToken");
};
    // Fetch DLQ emails and store in context
 async function getDLQEmails (page){
    // alert("NOt again")
      try {
        const res = await axiosInstance.get(`/email/getDLQEmails?page=${page}`, {
          headers: {
            "x-api-key": apiKey,
          },
        });
        // Assume res.data = { emails, page, totalPages, total }
        setDlqEmails({
          emails: res.data.data,
          page: res.data.page || page,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || 0,
        });

        return res.data;
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to fetch DLQ emails");
        setDlqEmails({ emails: [] });
        return null;
      }
    };

  async function getEmailEvents(page) {
    try {
      const res = await axiosInstance.get(`/email/getEmailEvents?page=${page}`, {
        headers: {
          "x-api-key": apiKey,
        },
      });
      setEmailEvents({
        emails: res.data.data,
        page: res.data.page || page,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0,
        dlqTotal: res.data.dlqTotal || 0,
        sentTotal: res.data.sentTotal || 0,
      });
      return res.data;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch email events");
      setEmailEvents({ emails: [] });
      return null;
    }
  }
  // Restore user, API key, and accessToken from localStorage on mount (in case of reload)
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored && !user) {
      setUser(JSON.parse(stored));
    
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken && !accessToken) {
      setAccessToken(storedToken);
    }
    const storedKey = localStorage.getItem("apiKey");
    if (storedKey && !apiKey) {
    setApiKey(storedKey);
    }
    
    else
    {
        setApiKey(null); 
        localStorage.removeItem("apiKey");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
    }
    // Only fetch DLQ emails once on initial load if not already fetched
}

}, []);

  useEffect(() => {
    if (!emailEvents.emails.length) {
      getEmailEvents(1);
    }
    if (!dlqEmails.emails.length) {
      getDLQEmails(1);
    }
  }, [user]);




  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        signup,
        logout,
        apiKey,
        accessToken,
        fetchApiKey,
        dlqEmails,
        getDLQEmails,
        setDlqEmails,
        emailEvents,
        getEmailEvents,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
