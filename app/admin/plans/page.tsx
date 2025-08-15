"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Star, Crown, Zap, Eye, EyeOff } from "lucide-react"
import { CreditCard } from "lucide-react" // Added import for CreditCard
import { toast } from "sonner"

interface Plan {
  id: string
  _id?: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  durationDays: number
  features: string[]
  imageLimit: number
  contentLimit: number
  badge?: string
  color?: string
  icon?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const iconOptions = [
  { value: "Star", label: "Star", icon: Star },
  { value: "Crown", label: "Crown", icon: Crown },
  { value: "Zap", label: "Zap", icon: Zap },
]

const colorOptions = [
  { value: "from-blue-500 to-blue-600", label: "Blue" },
  { value: "from-green-500 to-green-600", label: "Green" },
  { value: "from-purple-500 to-purple-600", label: "Purple" },
  { value: "from-orange-500 to-orange-600", label: "Orange" },
  { value: "from-red-500 to-red-600", label: "Red" },
]

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    originalPrice: "",
    durationDays: "",
    features: "",
    imageLimit: "",
    contentLimit: "",
    badge: "",
    color: "from-blue-500 to-blue-600",
    icon: "Star",
    isActive: true,
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      } else {
        toast.error("Failed to fetch plans")
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error)
      toast.error("Failed to fetch plans")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check plan limits
    if (!editingPlan && plans.length >= 3) {
      toast.error("Maximum 3 plans allowed. Please delete an existing plan first.")
      return
    }

    try {
      const planData = {
        ...formData,
        price: Number.parseInt(formData.price),
        originalPrice: formData.originalPrice ? Number.parseInt(formData.originalPrice) : undefined,
        durationDays: Number.parseInt(formData.durationDays),
        features: formData.features.split("\n").filter((f) => f.trim()),
        imageLimit: Number.parseInt(formData.imageLimit),
        contentLimit: formData.contentLimit === "-1" ? -1 : Number.parseInt(formData.contentLimit),
      }

      const url = editingPlan ? `/api/plans/${editingPlan.id}` : "/api/plans"
      const method = editingPlan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      })

      if (response.ok) {
        toast.success(editingPlan ? "Plan updated successfully" : "Plan created successfully")
        fetchPlans()
        resetForm()
        setIsCreateModalOpen(false)
        setEditingPlan(null)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to save plan")
      }
    } catch (error) {
      console.error("Failed to save plan:", error)
      toast.error("Failed to save plan")
    }
  }

  const handleDelete = async (planId: string) => {
    // Check minimum plan requirement
    if (plans.length <= 1) {
      toast.error("Minimum 1 plan required. Cannot delete the last plan.")
      return
    }

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Plan deleted successfully")
        fetchPlans()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to delete plan")
      }
    } catch (error) {
      console.error("Failed to delete plan:", error)
      toast.error("Failed to delete plan")
    }
  }

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        toast.success(`Plan ${!isActive ? "activated" : "deactivated"} successfully`)
        fetchPlans()
      } else {
        toast.error("Failed to update plan status")
      }
    } catch (error) {
      console.error("Failed to update plan status:", error)
      toast.error("Failed to update plan status")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      originalPrice: "",
      durationDays: "",
      features: "",
      imageLimit: "",
      contentLimit: "",
      badge: "",
      color: "from-blue-500 to-blue-600",
      icon: "Star",
      isActive: true,
    })
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: plan.price.toString(),
      originalPrice: plan.originalPrice?.toString() || "",
      durationDays: plan.durationDays.toString(),
      features: plan.features.join("\n"),
      imageLimit: plan.imageLimit.toString(),
      contentLimit: plan.contentLimit.toString(),
      badge: plan.badge || "",
      color: plan.color || "from-blue-500 to-blue-600",
      icon: plan.icon || "Star",
      isActive: plan.isActive,
    })
    setIsCreateModalOpen(true)
  }

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((opt) => opt.value === iconName)
    return iconOption ? iconOption.icon : Star
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
          <p className="text-gray-600 mt-2">Loading plans...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
          <p className="text-gray-600 mt-2">Manage subscription plans and pricing</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="text-sm">
              {plans.length}/3 Plans
            </Badge>
            {plans.length >= 3 && (
              <Badge variant="destructive" className="text-sm">
                Maximum limit reached
              </Badge>
            )}
            {plans.length <= 1 && (
              <Badge variant="destructive" className="text-sm">
                Minimum 1 plan required
              </Badge>
            )}
          </div>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm} 
              disabled={plans.length >= 3}
              title={plans.length >= 3 ? "Maximum 3 plans reached. Delete a plan first." : "Create new plan"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Original Price (₹)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="durationDays">Duration (Days)</Label>
                  <Input
                    id="durationDays"
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="imageLimit">Image Limit</Label>
                  <Input
                    id="imageLimit"
                    type="number"
                    value={formData.imageLimit}
                    onChange={(e) => setFormData({ ...formData, imageLimit: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contentLimit">Content Limit (-1 for unlimited)</Label>
                  <Input
                    id="contentLimit"
                    type="number"
                    value={formData.contentLimit}
                    onChange={(e) => setFormData({ ...formData, contentLimit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="badge">Badge (optional)</Label>
                  <Input
                    id="badge"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Most Popular"
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <select
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {iconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <select
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active Plan</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setEditingPlan(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingPlan ? "Update Plan" : "Create Plan"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const IconComponent = getIconComponent(plan.icon || "Star")
          return (
            <Card key={plan.id || plan.slug} className={`relative ${!plan.isActive ? "opacity-60" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center text-white`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-sm text-gray-600">{plan.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {plan.badge}
                      </Badge>
                    )}
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">₹{plan.price}</div>
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-500 line-through">₹{plan.originalPrice}</div>
                  )}
                  <div className="text-sm text-gray-600">{plan.durationDays} days</div>
                </div>

                <p className="text-gray-600 text-sm">{plan.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Image Limit:</span>
                    <span className="font-medium">{plan.imageLimit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Content Limit:</span>
                    <span className="font-medium">{plan.contentLimit === -1 ? "Unlimited" : plan.contentLimit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Features:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={feature + index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 3 && <li className="text-gray-500">+{plan.features.length - 3} more</li>}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => togglePlanStatus(plan.id, plan.isActive)}>
                      {plan.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 bg-transparent"
                        disabled={plans.length <= 1}
                        title={plans.length <= 1 ? "Cannot delete the last plan" : "Delete plan"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{plan.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(plan.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {plans.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Found</h3>
          <p className="text-gray-600 mb-4">
            Create your first subscription plan to get started. 
            <br />
            <span className="text-sm text-gray-500">Minimum 1 plan required, maximum 3 plans allowed.</span>
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      )}
    </div>
  )
}
