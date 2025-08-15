"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UserEditModal } from "@/components/admin/user-edit-modal"

interface User {
  _id: string
  name: string
  email: string
  mobile?: string
  city?: string
  bio?: string
  company?: string
  subscriptionStatus: string
  subscriptionPlan?: string
  subscriptionExpiry?: string
  contentGenerated: number
  imagesGenerated: number
  isBlocked: boolean
  createdAt: string
  profilePhoto?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        throw new Error("Failed to fetch users")
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${!isBlocked ? "blocked" : "unblocked"} successfully`,
        })
        fetchUsers()
      } else {
        throw new Error("Failed to update user")
      }
    } catch (error) {
      console.error("Block user error:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        fetchUsers()
      } else {
        throw new Error("Failed to delete user")
      }
    } catch (error) {
      console.error("Delete user error:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleModalClose = (shouldRefresh?: boolean) => {
    setModalOpen(false)
    setSelectedUser(null)
    if (shouldRefresh) {
      fetchUsers()
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      case "free":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and subscriptions</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">{users.length} Total Users</span>
        </div>
      </div>

      {/* Search and Content */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, mobile, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profilePhoto || "/placeholder.svg"} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                          <Badge className={getStatusColor(user.subscriptionStatus)}>{user.subscriptionStatus}</Badge>
                          {user.isBlocked && <Badge className="bg-red-100 text-red-800 border-red-200">Blocked</Badge>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.mobile && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{user.mobile}</span>
                            </div>
                          )}
                          {user.city && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{user.city}</span>
                            </div>
                          )}
                          {user.company && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="h-4 w-4" />
                              <span>{user.company}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Activity className="h-4 w-4" />
                            <span>
                              {user.contentGenerated} content, {user.imagesGenerated} images
                            </span>
                          </div>
                        </div>

                        {user.bio && <p className="text-sm text-gray-600 mb-2">{user.bio}</p>}

                        {user.subscriptionPlan && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Plan:</span> {user.subscriptionPlan}
                            {user.subscriptionExpiry && (
                              <span className="ml-2">
                                (Expires: {new Date(user.subscriptionExpiry).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlockUser(user._id, user.isBlocked)}
                        className={
                          user.isBlocked
                            ? "text-green-600 hover:text-green-700"
                            : "text-orange-600 hover:text-orange-700"
                        }
                      >
                        {user.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UserEditModal open={modalOpen} onClose={handleModalClose} user={selectedUser} />
    </div>
  )
}
