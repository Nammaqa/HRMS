"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, LogIn, Shield, Clock, Users, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setErrorCode("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        setErrorCode(data.code || "");
        setLoading(false);
        return;
      }

      // Determine redirect path based on user role
      let redirectPath = data.redirectTo;
      if (!redirectPath) {
        if (data.user?.role === "admin") {
          redirectPath = "/admin";
        } else if (data.user?.role === "intern") {
          redirectPath = "/employee/dashboard"; // Interns use employee dashboard with limited access
        } else {
          redirectPath = "/employee/dashboard"; // Employees and default
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      router.push(redirectPath);
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Brand & Image */}
      <div className="lg:w-1/2 relative min-h-[40vh] lg:min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        {/* Diagonal Cut with Gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-48 lg:w-64 bg-gradient-to-r from-indigo-900 via-purple-900/80 to-transparent clip-diagonal-left z-10"></div>
        
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-purple-900/70 to-blue-900/50"></div>
        </div>
        
        {/* Animated Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-slower"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float"></div>
        </div>

        <div className="relative h-full p-8 lg:p-12 flex flex-col z-20">
          {/* Large Logo */}
<div className="flex justify-center items-start m-0 p-0">
  <div className="relative w-292 h-52 lg:w-208px lg:h-[98px] m-2 p-1">
    <Image
      src="/logobg.png"
      alt="Company Logo"
      fill
      className="object-contain"
      priority
    />
  </div>
</div>


          {/* Main Content */}
          <div className="flex-1 flex items-center">
            <div className="w-full max-w-2xl">
              {/* Stats Banner */}
              <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">Live System • 24/7 Active</span>
                </div>
              </div>

              {/* Hero Text */}
              <h2 className="text-5xl lg:text-6xl font-bold text-white mb- leading-tight">
                Your Workday, Simplified <br />
                <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {/* Management */}
                </span>
              </h2>
              
              <p className="text-xl text-white/80 mb-12 max-w-xl">
Mark attendance, apply for leave, and stay updated—all from one dashboard.
              </p>

              {/* Features Grid */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                    <Clock className="w-7 h-7 text-purple-300" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Real-time Tracking</h3>
                  <p className="text-white/60">Monitor attendance live with GPS verification</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-blue-300" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Team Management</h3>
                  <p className="text-white/60">Manage shifts, leaves, and schedules efficiently</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                    <CheckCircle className="w-7 h-7 text-green-300" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Automated Reports</h3>
                  <p className="text-white/60">Generate insightful analytics and payroll reports</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-4">
                    <Shield className="w-7 h-7 text-red-300" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Enterprise Security</h3>
                  <p className="text-white/60">Bank-grade encryption and compliance</p>
                </div>
              </div> */}

              {/* Trust Badges */}
              {/* <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">ISO 27001</div>
                    <div className="text-white/60 text-sm">Certified</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/20"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">10K+</div>
                    <div className="text-white/60 text-sm">Active Users</div>
                  </div>
                </div>
              </div>*/}
            </div>
          </div>
        </div>
      </div> 

      {/* Right Side - Login Form */}
      <div className="lg:w-1/2 bg-gradient-to-br from-gray-50 to-white min-h-[60vh] lg:min-h-screen flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md relative">
          {/* Decorative Corner Accents */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-xl"></div>

          {/* Floating Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100">
            {/* Form Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 mb-6 shadow-lg">
                <LogIn className="w-10 h-10 text-gradient-blue-purple" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Welcome Back
              </h2>
              <p className="text-gray-600">
                Sign in to access your dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-red-800">{error}</p>
                    <p className="text-red-600/80 text-sm mt-1">{errorCode === "ACCOUNT_INACTIVE" ? "Please contact HR for assistance." : "Please check your credentials"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Email Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 shadow-sm"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-sm font-semibold text-gray-800">
                    Password
                  </label>
                  {/* <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Forgot password?
                  </button> */}
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-5 h-5 rounded-lg border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 transition-all duration-300 cursor-pointer"
                />
                <label htmlFor="remember" className="ml-3 text-gray-700 cursor-pointer select-none">
                  <span className="font-medium">Remember this device</span>
                  {/* <span className="text-gray-500 text-sm block">Stay signed in for 30 days</span> */}
                </label>
              </div>

              {/* Submit Button */}
<button
  type="submit"
  disabled={loading}
  className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-300"
>
  {loading ? (
    <>
      <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      <span>Authenticating...</span>
    </>
  ) : (
    <>
      <span>Sign In to Dashboard</span>
      <svg
        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 5l7 7m0 0l-7 7m7-7H3"
        />
      </svg>
    </>
  )}
</button>


              {/* Divider */}
              <div className="relative my-8">
                {/* <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div> */}
                {/* <div className="relative flex justify-center"> */}
                  {/* <span className="px-4 bg-white text-gray-500 text-sm font-medium">Or continue with</span> */}
                {/* </div> */}
              </div>

              {/* Social Login */}
              {/* <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="py-3.5 rounded-xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3 group/social"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium text-gray-700 group-hover/social:text-gray-900">Google</span>
                </button>
                <button
                  type="button"
                  className="py-3.5 rounded-xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-3 group/social"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="font-medium text-gray-700 group-hover/social:text-gray-900">GitHub</span>
                </button>
              </div> */}
            </form>

            {/* Demo Credentials */}
            {/* <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Try Demo Accounts</p>
                  <p className="text-gray-600 text-sm">Test the system with sample credentials</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900">Admin Access</span>
                    </div>
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-bold rounded-md">Full Access</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between text-gray-700">
                      <span>Email: <code className="ml-1 font-mono">admin@company.com</code></span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <span>Password: <code className="ml-1 font-mono bg-blue-200 px-2 py-0.5 rounded">admin123</code></span>
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">Copy</button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900">Employee Access</span>
                    </div>
                    <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs font-bold rounded-md">Limited Access</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between text-gray-700">
                      <span>Email: <code className="ml-1 font-mono">employee@company.com</code></span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <span>Password: <code className="ml-1 font-mono bg-purple-200 px-2 py-0.5 rounded">employee123</code></span>
                      <button className="text-purple-600 hover:text-purple-800 text-xs font-medium">Copy</button>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Footer */}
            <div className="mt-8 text-center">
              {/* <p className="text-gray-500 text-sm">
                Need help? <button className="text-blue-600 hover:text-blue-800 font-medium">Contact Support</button>
              </p> */}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
        .clip-diagonal-left {
          clip-path: polygon(100% 0, 0 0, 100% 100%);
        }
        .text-gradient-blue-purple {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </main>
  );
}