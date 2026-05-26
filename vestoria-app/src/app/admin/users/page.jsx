"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Search, UserCog, Ban, Trash2, CheckCircle } from "lucide-react";

export default function UserManagement() {
  const router = useRouter();
  const { setImpersonatingId } = useStore();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [editingUser, setEditingUser] = useState(null);
  const [editBalance, setEditBalance] = useState("");
  const [editProfit, setEditProfit] = useState("");

  useEffect(() => {
    const unSub = onSnapshot(query(collection(db, "users")), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unSub();
  }, []);

  const saveUserBalance = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, "users", editingUser.id), { 
        balance: Number(editBalance), 
        profit: Number(editProfit),
        role: editingUser.role || 'user'
      });
      alert("✅ User Profile Updated");
      setEditingUser(null);
    } catch (err) { alert("Error updating profile"); }
  };

  const toggleBanStatus = async (user) => {
    const newStatus = user.status === "banned" ? "active" : "banned";
    if (window.confirm(`Are you sure you want to ${newStatus} this user?`)) {
      await updateDoc(doc(db, "users", user.id), { status: newStatus });
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("Delete this user permanently? This cannot be undone.")) {
      await deleteDoc(doc(db, "users", id));
    }
  };

  const filteredUsers = users.filter(u => 
    (u.email || "").toLowerCase().includes(search.toLowerCase()) || 
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.id || "").includes(search)
  );

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 text-sm">Manage accounts, balances, and security statuses.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 pl-10 pr-4 py-3 rounded-xl text-white outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-800/50 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-4 font-medium">User Profile</th>
              <th className="p-4 font-medium">Role / Status</th>
              <th className="p-4 font-medium">Wallets</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      {(u.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      <p className="text-[10px] text-gray-600 font-mono mt-0.5">ID: {u.id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'}`}>
                      {u.role || 'user'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.status === 'banned' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {u.status || 'active'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-sm"><span className="text-gray-500">Main:</span> <span className="text-green-400 font-bold">Rs. {u.balance || 0}</span></p>
                  <p className="text-sm"><span className="text-gray-500">Profit:</span> <span className="text-cyan-400 font-bold">Rs. {u.profit || 0}</span></p>
                  <p className="text-xs mt-1"><span className="text-gray-500">Ref:</span> <span className="text-purple-400">Rs. {u.referralEarnings || 0}</span></p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setImpersonatingId(u.id);
                        router.push("/dashboard");
                      }}
                      className="p-2 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 rounded-lg transition font-bold text-xs" title="Login As User"
                    >
                      Login As
                    </button>
                    <button 
                      onClick={() => { setEditingUser(u); setEditBalance(u.balance || 0); setEditProfit(u.profit || 0); }} 
                      className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition" title="Edit Balances"
                    >
                      <UserCog className="w-4 h-4" />
                    </button>
                    {u.role !== 'admin' && (
                      <>
                        <button onClick={() => toggleBanStatus(u)} className={`p-2 rounded-lg transition ${u.status === 'banned' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'}`} title={u.status === 'banned' ? "Unban User" : "Ban User"}>
                          {u.status === 'banned' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition" title="Delete User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-3xl w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Edit Balances</h3>
            <p className="text-gray-400 text-sm mb-4">{editingUser.email}</p>
            <form onSubmit={saveUserBalance} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Main Balance</label>
                <input type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} className="w-full bg-gray-800 p-3 rounded-xl outline-none" required />
              </div>
              <div>
                <label className="text-sm text-gray-400">Profit Wallet</label>
                <input type="number" value={editProfit} onChange={e => setEditProfit(e.target.value)} className="w-full bg-gray-800 p-3 rounded-xl outline-none" required />
              </div>
              <div>
                <label className="text-sm text-gray-400">User Role</label>
                <select 
                  value={editingUser.role || "user"} 
                  onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                  className="w-full bg-gray-800 p-3 rounded-xl outline-none"
                >
                  <option value="user">User</option>
                  <option value="support">Support</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-800 py-3 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 bg-purple-500 py-3 rounded-xl font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
