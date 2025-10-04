// app/login/page.js
"use client";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // keep session cookie
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setMessage(data.message || data.error);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form
        onSubmit={handleLogin}
        className="flex flex-col bg-gray-100 p-6 rounded-xl gap-3 w-80"
      >
        <h1 className="text-xl font-bold text-center">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 rounded-md border"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 rounded-md border"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          Log In
        </button>
      </form>

      {message && <p className="mt-3 text-gray-700">{message}</p>}
    </div>
  );
}
