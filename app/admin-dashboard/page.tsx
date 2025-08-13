"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function formatDate(date?: string | number | Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [freeCount, setFreeCount] = useState(0);
  const [changing, setChanging] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);

  const fetchUsers = async (filterType = "all") => {
    setLoading(true);
    let url = "/api/admin/users";
    if (filterType !== "all") url += `?filter=${filterType}`;
    const res = await fetch(url);
    const data = await res.json();
    setUsers((data.users as any[]) || []);
    setActiveCount(Number(data.activeCount || 0));
    setFreeCount(Number(data.freeCount || 0));
    setLoading(false);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.email !== "admin@zuperstudio.com") {
      router.replace("/signin");
      return;
    }
    fetchUsers(filter);
  }, [session, status, router, filter]);

  const handleBlockToggle = async (userId: string, blocked: boolean) => {
    setChanging(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, blocked }),
    });
    await fetchUsers(filter);
    setChanging(false);
  };

  const handleLogout = () => signOut({ callbackUrl: "/signin" });

  const handlePasswordChange = async () => {
    setPasswordMsg("");
    setChanging(true);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    if (res.ok) {
      setPasswordMsg("Password changed successfully.");
      setShowPasswordModal(false);
      setNewPassword("");
    } else {
      setPasswordMsg("Failed to change password.");
    }
    setChanging(false);
  };

  const openActiveModal = async () => {
    setShowActiveModal(true);
    // Fetch only active users for modal
    const res = await fetch("/api/admin/users?filter=active");
    const data = await res.json();
    setActiveUsers((data.users as any[]) || []);
  };

  const openUserDetails = (user: any) => {
    setUserDetails(user);
    setShowUserDetails(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 text-gray-700 animate-pulse">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 text-gray-900 p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <div className="flex gap-4">
          <button onClick={() => setShowPasswordModal(true)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition">Change Password</button>
          <button onClick={handleLogout} className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow transition">Logout</button>
        </div>
      </div>
      <div className="mb-10 flex gap-8 flex-wrap">
        <div
          className="bg-white rounded-xl shadow-lg p-6 flex-1 min-w-[200px] hover:scale-105 transition-transform border-t-4 border-green-400 cursor-pointer group"
          onClick={openActiveModal}
        >
          <div className="text-lg font-semibold text-gray-600 mb-1 group-hover:text-green-700 transition">Active Subscriptions</div>
          <div className="text-3xl font-extrabold text-green-600 group-hover:text-green-800 transition">{activeCount}</div>
        </div>
        <div
          className="bg-white rounded-xl shadow-lg p-6 flex-1 min-w-[200px] hover:scale-105 transition-transform border-t-4 border-blue-400 cursor-pointer group"
          onClick={() => setFilter("free")}
        >
          <div className="text-lg font-semibold text-gray-600 mb-1 group-hover:text-blue-700 transition">Free Users</div>
          <div className="text-3xl font-extrabold text-blue-600 group-hover:text-blue-800 transition">{freeCount}</div>
        </div>
        <div
          className="bg-white rounded-xl shadow-lg p-6 flex-1 min-w-[200px] hover:scale-105 transition-transform border-t-4 border-gray-400 cursor-pointer group"
          onClick={() => setFilter("all")}
        >
          <div className="text-lg font-semibold text-gray-600 mb-1 group-hover:text-gray-700 transition">Total Users</div>
          <div className="text-3xl font-extrabold text-gray-800 group-hover:text-black transition">{activeCount + freeCount}</div>
        </div>
      </div>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg font-semibold shadow transition border ${filter === "all" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"}`}
          onClick={() => setFilter("all")}
        >
          All Users
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold shadow transition border ${filter === "active" ? "bg-green-600 text-white" : "bg-white text-green-600 border-green-600 hover:bg-green-50"}`}
          onClick={() => setFilter("active")}
        >
          Active Subscriptions
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold shadow transition border ${filter === "free" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"}`}
          onClick={() => setFilter("free")}
        >
          Free Users
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-2xl shadow-xl p-8 mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subscription</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Content Posted</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Block/Unblock</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">View Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-blue-50 transition">
                <td className="px-6 py-4 whitespace-nowrap font-mono text-blue-700">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.subscriptionPlan || user.subscriptionStatus || "free"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center font-semibold">{user.contentCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${user.blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {user.blocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className={`px-4 py-1 rounded-lg font-semibold shadow transition ${user.blocked ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white`}
                    disabled={changing}
                    onClick={() => handleBlockToggle(user._id, !user.blocked)}
                  >
                    {user.blocked ? "Unblock" : "Block"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.subscriptionStatus === 'active' && (
                    <button onClick={() => openUserDetails(user)} className="px-3 py-1 bg-blue-500 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition">View Details</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 transition-all">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-blue-500 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-blue-700">Change Admin Password</h2>
            <input
              type="password"
              className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={handlePasswordChange} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition" disabled={changing}>Change</button>
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition">Cancel</button>
            </div>
            {passwordMsg && <div className="mt-2 text-green-600">{passwordMsg}</div>}
          </div>
        </div>
      )}
      {/* Active Subscriptions Modal */}
      {showActiveModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 transition-all">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl border-t-4 border-green-500 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-700">Active Subscriptions</h2>
              <button onClick={() => setShowActiveModal(false)} className="text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Start</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">End</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">All Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-green-50 transition">
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-blue-700">{user.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{user.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{user.subscriptionPlan}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{user.subscriptionAmount ? `₹${user.subscriptionAmount}` : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatDate(user.subscriptionStart)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatDate(user.subscriptionExpiry)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button onClick={() => openUserDetails(user)} className="px-3 py-1 bg-blue-500 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition">All Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* User Details Modal */}
      {showUserDetails && userDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 transition-all">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-blue-500 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700">User Subscription Details</h2>
              <button onClick={() => setShowUserDetails(false)} className="text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
            </div>
            <div className="space-y-2">
              <div><span className="font-semibold">Email:</span> {userDetails.email}</div>
              <div><span className="font-semibold">Name:</span> {userDetails.name}</div>
              <div><span className="font-semibold">Plan:</span> {userDetails.subscriptionPlan}</div>
              <div><span className="font-semibold">Amount:</span> {userDetails.subscriptionAmount ? `₹${userDetails.subscriptionAmount}` : '-'}</div>
              <div><span className="font-semibold">Start Date:</span> {formatDate(userDetails.subscriptionStart)}</div>
              <div><span className="font-semibold">End Date:</span> {formatDate(userDetails.subscriptionExpiry)}</div>
              <div><span className="font-semibold">Status:</span> {userDetails.blocked ? 'Blocked' : 'Active'}</div>
              <div><span className="font-semibold">Content Posted:</span> {userDetails.contentCount}</div>
              <div><span className="font-semibold">User ID:</span> {userDetails._id}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
