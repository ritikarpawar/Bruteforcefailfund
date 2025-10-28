"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface Startup {
  _id: string
  title: string
  description: string
  status: string
  revivalScore: number
  views: number
  createdAt: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [userStartups, setUserStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null)
  const [stats, setStats] = useState({
    totalStartups: 0,
    totalViews: 0,
    activeCollaborations: 0,
    averageRevivalScore: 0,
  })

  // ✅ Fetch user startups & update stats
  const fetchUserData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const token = localStorage.getItem("failfund_token")
      const res = await fetch("http://localhost:5000/api/startups/my", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to fetch startups")
      const data = await res.json()

      setUserStartups(data)
      updateStats(data)
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Calculate and update stats
  const updateStats = (data: Startup[]) => {
    const totalStartups = data.length
    const totalViews = data.reduce((sum, s) => sum + (s.views || 0), 0)
    const activeCollaborations = data.filter((s) => s.status === "in-collaboration").length
    const averageRevivalScore = data.length
      ? Math.round(data.reduce((sum, s) => sum + (s.revivalScore || 0), 0) / data.length)
      : 0

    setStats({
      totalStartups,
      totalViews,
      activeCollaborations,
      averageRevivalScore,
    })
  }

  useEffect(() => {
    fetchUserData()
  }, [user])

  // 🧾 Delete Startup
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this startup?")
    if (!confirmDelete) return
    try {
      const token = localStorage.getItem("failfund_token")
      const res = await fetch(`http://localhost:5000/api/startups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to delete startup")
      alert("Startup deleted successfully!")

      const updated = userStartups.filter((s) => s._id !== id)
      setUserStartups(updated)
      updateStats(updated)
    } catch (error) {
      console.error("Error deleting startup:", error)
      alert("Failed to delete startup")
    }
  }

  // ✏️ Edit Startup Save
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingStartup) return
    try {
      const token = localStorage.getItem("failfund_token")
      const res = await fetch(`http://localhost:5000/api/startups/${editingStartup._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingStartup),
      })

      if (!res.ok) throw new Error("Failed to update startup")

      alert("Startup updated successfully!")
      setEditingStartup(null)
      fetchUserData()
    } catch (error) {
      console.error("Error updating startup:", error)
      alert("Failed to update startup")
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="max-w-6xl mx-auto py-12 px-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground">Loading dashboard...</p>
        </main>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <main className="max-w-6xl mx-auto py-12 px-4">
        {/* Welcome + Stats */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-neutral-dark mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-foreground">Manage your startups and collaborations</p>
          </div>
          <Link
            href="/upload"
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-colors"
          >
            List New Startup
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-border rounded-lg p-6">
            <p className="text-sm text-foreground mb-2">Total Startups</p>
            <p className="text-3xl font-bold text-primary">{stats.totalStartups}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-6">
            <p className="text-sm text-foreground mb-2">Total Views</p>
            <p className="text-3xl font-bold text-primary">{stats.totalViews}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-6">
            <p className="text-sm text-foreground mb-2">Active Collaborations</p>
            <p className="text-3xl font-bold text-primary">{stats.activeCollaborations}</p>
          </div>
          <div className="bg-white border border-border rounded-lg p-6">
            <p className="text-sm text-foreground mb-2">Avg Revival Score</p>
            <p className="text-3xl font-bold text-primary">{stats.averageRevivalScore}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-border rounded-lg">
          <div className="flex border-b border-border">
            {["overview", "startups", "collaborations", "profile"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab ? "text-primary border-b-2 border-primary" : "text-foreground hover:text-primary"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "startups" && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-neutral-dark">Your Startups</h2>
                {userStartups.length > 0 ? (
                  <div className="space-y-4">
                    {userStartups.map((startup) => (
                      <div
                        key={startup._id}
                        className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-dark">{startup.title}</h3>
                            <p className="text-sm text-foreground">{startup.description}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              startup.status === "available"
                                ? "bg-green-100 text-green-700"
                                : startup.status === "in-collaboration"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {startup.status}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-foreground mb-3">
                          <span>Views: {startup.views}</span>
                          <span>Revival Score: {startup.revivalScore}%</span>
                        </div>
                        <div className="flex gap-3">
                          <Link href={`/startup/${startup._id}`} className="text-primary font-medium">
                            View
                          </Link>
                          <button
                            onClick={() => setEditingStartup(startup)}
                            className="text-primary hover:text-primary-light font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(startup._id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-foreground mb-4">You haven't listed any startups yet.</p>
                    <Link
                       href="/upload" className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                       style={{ color: "#fff" }}>
                      + List You First Startup
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ✏️ ShadCN Edit Dialog */}
        <Dialog open={!!editingStartup} onOpenChange={() => setEditingStartup(null)}>
          <DialogContent>
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Startup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  type="text"
                  value={editingStartup?.title || ""}
                  onChange={(e) =>
                    setEditingStartup((prev) => prev && { ...prev, title: e.target.value })
                  }
                  placeholder="Title"
                  required
                />
                <Textarea
                  value={editingStartup?.description || ""}
                  onChange={(e) =>
                    setEditingStartup((prev) => prev && { ...prev, description: e.target.value })
                  }
                  placeholder="Description"
                  required
                />
              </div>
              <DialogFooter className="mt-4 flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </ProtectedRoute>
  )
}
