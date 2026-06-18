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
  const apiKeyDisabledKey = (userId) => `apiKeyDisabled:${userId}`;

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
        localStorage.setItem("apiKey", res.data.apiKey);
        return res.data.apiKey;
      }
    } catch (e) {
      // Optionally show a toast or handle error
      setApiKey(null);
      localStorage.removeItem("apiKey");
      if (userId) localStorage.removeItem(apiKeyDisabledKey(userId));
    }
    return null;
  };

  const deleteApiKey = async () => {
    if (!apiKey || !accessToken) return false;
    try {
      await axiosInstance.post(
        "/creds/deleteApiKey",
        { apiKeyValue: apiKey },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setApiKey(null);
      localStorage.removeItem("apiKey");
      if (user?.userId) localStorage.removeItem(apiKeyDisabledKey(user.userId));
      toast.success("API key deleted");
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete API key");
      return false;
    }
  };

  const disableApiKey = async () => {
    if (!apiKey || !accessToken) return false;
    try {
      await axiosInstance.post(
        "/creds/disableApiKey",
        { apiKeyValue: apiKey },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (user?.userId) {
        localStorage.setItem(apiKeyDisabledKey(user.userId), "true");
      }
      toast.success("API key disabled");
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to disable API key");
      return false;
    }
  };

  const isApiKeyDisabled = () => {
    if (!user?.userId || !apiKey) return false;
    return localStorage.getItem(apiKeyDisabledKey(user.userId)) === "true";
  };

  const createOtp = async (email) => {
    try {
      await axiosInstance.post("/auth/generateOtp", { email });
      toast.success("Verification code sent to your email");
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to send verification code");
      return false;
    }
  };

  const validateOtp = async (email, otp) => {
    try {
      await axiosInstance.post("/auth/validateOtp", { email, otp });
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Invalid verification code");
      return false;
    }
  };

  const loginWithGoogle = async (credential) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/google", { credential },
        { withCredentials: true }
      );

      const { accessToken: token, user: userData } = res.data;
      setAccessToken(token);
      localStorage.setItem("accessToken", token);

      if (userData?.firstTimeLogin) {
        return { success: true, needsProfile: true, user: userData, accessToken: token };
      }
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      if (userData?.userId) await fetchApiKey(userData.userId);
      toast.success("Signed in with Google");
      return { success: true, needsProfile: false };
    } catch (e) {
      toast.error(e?.response?.data?.message || "Google sign-in failed");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", { email, password },
        { withCredentials: true }
      );
      const { accessToken: token, user: userData } = res.data;
      setAccessToken(token);
      localStorage.setItem("accessToken", token);

      if (userData?.firstTimeLogin) {
        return { success: true, needsProfile: true, user: userData, accessToken: token };
      }

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      if (userData?.userId) await fetchApiKey(userData.userId);
      toast.success("Signed in successfully");
      return { success: true, needsProfile: false };
    } catch (e) {
      toast.error(e?.response?.data?.message || "Login failed");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password) => {
    setLoading(true);
    try {
      await axiosInstance.post("/auth/register", {
        email,
        password,
        accountType: "local",
        status: "active",
      },    );
      toast.success("Account created. Please sign in to continue.");
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Signup failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUseCustomSMTP = async (useCustomSMTP) => {
    if (!user?.userId) return false;
    const previous = user.useCustomSMTP;
    setUser((prev) => (prev ? { ...prev, useCustomSMTP } : prev));
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/updateUser", {
        userId: user.userId,
        name: user.name,
        email: user.email,
        organization: user.organization,
        useCustomSMTP,
      });
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success(
        userData.useCustomSMTP
          ? "Custom SMTP enabled"
          : "Custom SMTP disabled — using platform SMTP",
      );
      return true;
    } catch (e) {
      setUser((prev) => (prev ? { ...prev, useCustomSMTP: previous } : prev));
      toast.error(e?.response?.data?.message || "Failed to update SMTP preference");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, name, email, organization) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/updateUser", {
        userId,
        name,
        email,
        organization,
      });
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      if (userData?.userId) await fetchApiKey(userData.userId);
      toast.success("Profile updated successfully");
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeFirstLogin = async (pendingUser, accessToken, name, organization) => {
    setAccessToken(accessToken);
    localStorage.setItem("accessToken", accessToken);
    const ok = await updateUser(pendingUser.userId, name, organization);
    return ok;
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
  const handleLogout = () => {
    logout();
  };

  window.addEventListener("auth:logout", handleLogout);

  return () => {
    window.removeEventListener("auth:logout", handleLogout);
  };
}, []);

  useEffect(() => {
    // if (apiKey&& !emailEvents.emails.length) {
    //   getEmailEvents(1);
    // }
    // if (apiKey&& !dlqEmails.emails.length) {
    //   getDLQEmails(1);
    // }
    if(accessToken)
    {
      getEmailEvents(1);
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
        loginWithGoogle,
        signup,
        createOtp,
        validateOtp,
        updateUser,
        updateUseCustomSMTP,
        completeFirstLogin,
        logout,
        apiKey,
        accessToken,
        fetchApiKey,
        deleteApiKey,
        disableApiKey,
        isApiKeyDisabled,
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
