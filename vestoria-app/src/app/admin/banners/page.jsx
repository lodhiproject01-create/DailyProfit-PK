"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Image as ImageIcon, Plus, Trash2, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { ImageUploader } from "@/components/CloudinaryUploader";

export default function BannersManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [form, setForm] = useState({ imageUrl: "", targetUrl: "" });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "banners"), (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const newRef = doc(collection(db, "banners"));
      await setDoc(newRef, {
        ...form,
        createdAt: serverTimestamp()
      });
      setForm({ imageUrl: "", targetUrl: "" });
      setMsg({ type: "success", text: "Banner added successfully!" });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      alert("Error adding banner");
    } finally {
      setAdding(false);
    }
  };

  const deleteBanner = async (id) => {
    if (window.confirm("Delete this banner?")) {
      await deleteDoc(doc(db, "banners", id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-purple-400" /> Banners & Sliders
        </h2>
        <p className="text-gray-400 text-sm mt-1">Manage the promotional image sliders shown at the top of the user dashboard.</p>
      </div>

      {msg && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Form */}
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-3xl h-fit">
          <h3 className="text-lg font-bold text-white mb-4">Add New Banner</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Upload Banner Image (Landscape aspect ratio)</label>
              <ImageUploader 
                imageType="banners" 
                userId="admin" 
                onUploadSuccess={(data) => {
                  setForm({ ...form, imageUrl: data ? data.image_url : "" });
                }}
                label="Homepage Banner Image"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Target URL (Optional)</label>
              <input 
                type="url" 
                value={form.targetUrl}
                onChange={e => setForm({...form, targetUrl: e.target.value})}
                placeholder="https://t.me/yourchannel"
                className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-purple-400"
              />
              <p className="text-xs text-gray-500 mt-1">Link to open when user clicks the banner.</p>
            </div>
            
            {form.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-gray-700 aspect-[21/9] relative">
                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src='https://placehold.co/600x250/1f2937/fff?text=Invalid+Image+URL'} />
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-[10px] font-bold text-white">PREVIEW</div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={adding || !form.imageUrl}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {adding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-5 h-5" /> Add Banner</>}
            </button>
          </form>
        </div>

        {/* Banners List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Active Banners ({banners.length})</h3>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-gray-800 rounded-3xl" />
              <div className="h-32 bg-gray-800 rounded-3xl" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-3xl text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No banners active. Dashboard will look plain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map(b => (
                <div key={b.id} className="bg-gray-800 border border-gray-700 rounded-3xl overflow-hidden group relative">
                  <div className="aspect-[21/9] w-full relative">
                    <img src={b.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 backdrop-blur-sm">
                      {b.targetUrl && (
                        <a href={b.targetUrl} target="_blank" rel="noreferrer" className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition">
                          <LinkIcon className="w-5 h-5" />
                        </a>
                      )}
                      <button onClick={() => deleteBanner(b.id)} className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
