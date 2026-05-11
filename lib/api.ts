// Direct link to your backend server
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${API_URL}${endpoint}`);
    return res;
  },
  post: async (endpoint: string, body: any) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  },
  patch: async (endpoint: string, body: any) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  },
  upload: async (endpoint: string, formData: FormData) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });
    return res;
  },
  imageUrl: (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    
    // Clean up the path
    let cleanPath = path;
    if (!cleanPath.startsWith("/") && !cleanPath.startsWith("uploads/")) {
      cleanPath = `/uploads/${cleanPath}`;
    } else if (!cleanPath.startsWith("/")) {
      cleanPath = `/${cleanPath}`;
    }
    
    // Ensure API_URL doesn't end with slash and cleanPath starts with one
    const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
    const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    
    return `${baseUrl}${finalPath}`;
  }
};
