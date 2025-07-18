"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Database, Key, Copy, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Resource {
  _id: string
  name: string
  fields: Array<{
    name: string
    type: string
    required: boolean
  }>
}

interface Project {
  _id: string
  name: string
  description: string
  apiKey: string
  resources: Resource[]
  createdAt: string
}

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newResourceName, setNewResourceName] = useState("")
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      } else if (response.status === 401) {
        router.push("/login")
      } else if (response.status === 404) {
        setError("Project not found")
      } else {
        setError("Failed to load project")
      }
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const createResource = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newResourceName }),
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        setNewResourceName("")
        setDialogOpen(false)
      } else {
        setError("Failed to create resource")
      }
    } catch {
      setError("Network error")
    } finally {
      setCreating(false)
    }
  }

  const copyApiKey = async () => {
    if (project?.apiKey) {
      await navigator.clipboard.writeText(project.apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyBaseUrl = async () => {
    const baseUrl = `${window.location.origin}/api/${projectId}`
    await navigator.clipboard.writeText(baseUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading project...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
          <Button onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mr-4">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600">{project.description || "No description"}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* API Information */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  API Configuration
                </CardTitle>
                <CardDescription>Use these credentials to access your API endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Base URL</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm">
                      {`${typeof window !== "undefined" ? window.location.origin : ""}/api/${projectId}`}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyBaseUrl}>
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">API Key</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm">{project.apiKey}</code>
                    <Button size="sm" variant="outline" onClick={copyApiKey}>
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Include this in the x-api-key header</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resources Section */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Resources</h2>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Resource</DialogTitle>
                  <DialogDescription>Add a new resource to your API project.</DialogDescription>
                </DialogHeader>
                <form onSubmit={createResource} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resourceName">Resource Name</Label>
                    <Input
                      id="resourceName"
                      value={newResourceName}
                      onChange={(e) => setNewResourceName(e.target.value)}
                      placeholder="users, products, posts..."
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? "Creating..." : "Create Resource"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {project.resources.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Database className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                <p className="text-gray-600 text-center mb-4">Create your first resource to start building your API</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Resource
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {project.resources.map((resource) => (
                <Card key={resource._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{resource.name}</span>
                      <Database className="w-5 h-5 text-gray-400" />
                    </CardTitle>
                    <CardDescription>{resource.fields.length} fields defined</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {resource.fields.slice(0, 3).map((field) => (
                        <div key={field.name} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{field.name}</span>
                          <div className="flex items-center space-x-1">
                            <Badge variant="secondary">{field.type}</Badge>
                            {field.required && <Badge variant="outline">required</Badge>}
                          </div>
                        </div>
                      ))}
                      {resource.fields.length > 3 && (
                        <p className="text-xs text-gray-500">+{resource.fields.length - 3} more fields</p>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/project/${projectId}/resource/${resource.name}`)}
                    >
                      Manage Resource
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Alert className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  )
}
