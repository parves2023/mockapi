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
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Play,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  Copy,
  CheckCircle,
} from "lucide-react"

interface Field {
  name: string
  type: "string" | "number" | "boolean" | "null" | "undefined"
  required: boolean
}

interface Resource {
  _id: string
  name: string
  fields: Field[]
}

interface Project {
  _id: string
  name: string
  apiKey: string
  resources: Resource[]
}

interface ResourceData {
  _id: string
  data: Record<string, any>
  createdAt: string
}

export default function ResourceDetailPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [resource, setResource] = useState<Resource | null>(null)
  const [resourceData, setResourceData] = useState<ResourceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"fields" | "data" | "api">("fields")
  const [copied, setCopied] = useState<string | null>(null)

  // Field management
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [newField, setNewField] = useState<Field>({ name: "", type: "string", required: false })
  const [editingField, setEditingField] = useState<Field | null>(null)

  // Data management
  const [dataDialogOpen, setDataDialogOpen] = useState(false)
  const [generatingData, setGeneratingData] = useState(false)
  const [recordCount, setRecordCount] = useState(10)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const resourceName = params.resource as string

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const apiBaseUrl = `${baseUrl}/api/${projectId}/${resourceName}`

  useEffect(() => {
    fetchProject()
    fetchResourceData()
  }, [projectId, resourceName, currentPage])

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        const foundResource = data.project.resources.find((r: Resource) => r.name === resourceName)
        setResource(foundResource || null)
      } else if (response.status === 401) {
        router.push("/login")
      } else {
        setError("Failed to load project")
      }
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const fetchResourceData = async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/resources/${resourceName}/data?page=${currentPage}&limit=${itemsPerPage}`,
      )
      if (response.ok) {
        const data = await response.json()
        setResourceData(data.data)
        setTotalPages(Math.ceil(data.total / itemsPerPage))
      }
    } catch {
      console.error("Failed to fetch resource data")
    }
  }

  const saveField = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/projects/${projectId}/resources/${resourceName}/fields`, {
        method: editingField ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newField),
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        const updatedResource = data.project.resources.find((r: Resource) => r.name === resourceName)
        setResource(updatedResource)
        setNewField({ name: "", type: "string", required: false })
        setEditingField(null)
        setFieldDialogOpen(false)
      } else {
        setError("Failed to save field")
      }
    } catch {
      setError("Network error")
    }
  }

  const deleteField = async (fieldName: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/resources/${resourceName}/fields/${fieldName}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        const updatedResource = data.project.resources.find((r: Resource) => r.name === resourceName)
        setResource(updatedResource)
      }
    } catch {
      setError("Failed to delete field")
    }
  }

  const generateDummyData = async () => {
    setGeneratingData(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/resources/${resourceName}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: recordCount }),
      })

      if (response.ok) {
        fetchResourceData()
        setDataDialogOpen(false)
      } else {
        setError("Failed to generate data")
      }
    } catch {
      setError("Network error")
    } finally {
      setGeneratingData(false)
    }
  }

  const deleteRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/resources/${resourceName}/data/${recordId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchResourceData()
      }
    } catch {
      setError("Failed to delete record")
    }
  }

  const generateSampleData = () => {
    if (!resource) return {}
    const sample: Record<string, any> = {}
    resource.fields.forEach((field) => {
      switch (field.type) {
        case "string":
          sample[field.name] = "Sample text"
          break
        case "number":
          sample[field.name] = 123
          break
        case "boolean":
          sample[field.name] = true
          break
        case "null":
          sample[field.name] = null
          break
        case "undefined":
          sample[field.name] = undefined
          break
        default:
          sample[field.name] = "Sample value"
      }
    })
    return sample
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading resource...</div>
      </div>
    )
  }

  if (error || !project || !resource) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Resource not found"}</p>
          <Button onClick={() => router.push(`/project/${projectId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
        </div>
      </div>
    )
  }

  const sampleData = generateSampleData()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push(`/project/${projectId}`)} className="mr-4">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{resource.name}</h1>
                <p className="text-gray-600">
                  {project.name} • {resource.fields.length} fields
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            <Button
              variant={activeTab === "fields" ? "default" : "outline"}
              onClick={() => setActiveTab("fields")}
              className="flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Field Designer
            </Button>
            <Button
              variant={activeTab === "data" ? "default" : "outline"}
              onClick={() => setActiveTab("data")}
              className="flex items-center"
            >
              <Database className="w-4 h-4 mr-2" />
              Data Explorer
            </Button>
            <Button
              variant={activeTab === "api" ? "default" : "outline"}
              onClick={() => setActiveTab("api")}
              className="flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              API Usage
            </Button>
          </div>

          {/* Field Designer Tab */}
          {activeTab === "fields" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Resource Fields</h2>
                <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingField ? "Edit Field" : "Add New Field"}</DialogTitle>
                      <DialogDescription>Define a new field for your resource schema.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveField} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fieldName">Field Name</Label>
                        <Input
                          id="fieldName"
                          value={newField.name}
                          onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                          placeholder="name, email, age..."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fieldType">Field Type</Label>
                        <Select
                          value={newField.type}
                          onValueChange={(value: any) => setNewField({ ...newField, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="null">Null</SelectItem>
                            <SelectItem value="undefined">Undefined</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="required"
                          checked={newField.required}
                          onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
                        />
                        <Label htmlFor="required">Required field</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setFieldDialogOpen(false)
                            setEditingField(null)
                            setNewField({ name: "", type: "string", required: false })
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">{editingField ? "Update Field" : "Add Field"}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {resource.fields.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Settings className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No fields defined</h3>
                    <p className="text-gray-600 text-center mb-4">Add fields to define your resource schema</p>
                    <Button onClick={() => setFieldDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Field
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Schema Definition</CardTitle>
                    <CardDescription>Manage the fields for your {resource.name} resource</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resource.fields.map((field) => (
                          <TableRow key={field.name}>
                            <TableCell className="font-medium">{field.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{field.type}</Badge>
                            </TableCell>
                            <TableCell>
                              {field.required ? (
                                <Badge variant="outline">Required</Badge>
                              ) : (
                                <span className="text-gray-500">Optional</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setNewField(field)
                                    setEditingField(field)
                                    setFieldDialogOpen(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteField(field.name)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Data Explorer Tab */}
          {activeTab === "data" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Resource Data</h2>
                <div className="flex space-x-2">
                  <Dialog open={dataDialogOpen} onOpenChange={setDataDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={resource.fields.length === 0}>
                        <Play className="w-4 h-4 mr-2" />
                        Generate Data
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate Dummy Data</DialogTitle>
                        <DialogDescription>Create fake data for testing your API endpoints.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="recordCount">Number of Records</Label>
                          <Input
                            id="recordCount"
                            type="number"
                            min="1"
                            max="100"
                            value={recordCount}
                            onChange={(e) => setRecordCount(Number.parseInt(e.target.value) || 10)}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setDataDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={generateDummyData} disabled={generatingData}>
                            {generatingData ? "Generating..." : "Generate Data"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {resource.fields.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Database className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No fields defined</h3>
                    <p className="text-gray-600 text-center mb-4">Define fields first before generating data</p>
                    <Button onClick={() => setActiveTab("fields")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Go to Field Designer
                    </Button>
                  </CardContent>
                </Card>
              ) : resourceData.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Database className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
                    <p className="text-gray-600 text-center mb-4">Generate some dummy data to get started</p>
                    <Button onClick={() => setDataDialogOpen(true)}>
                      <Play className="w-4 h-4 mr-2" />
                      Generate Dummy Data
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Data Records</CardTitle>
                    <CardDescription>View and manage your resource data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          {resource.fields.map((field) => (
                            <TableHead key={field.name}>{field.name}</TableHead>
                          ))}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resourceData.map((record) => (
                          <TableRow key={record._id}>
                            <TableCell className="font-mono text-sm">{record._id.slice(-8)}</TableCell>
                            {resource.fields.map((field) => (
                              <TableCell key={field.name}>
                                {typeof record.data[field.name] === "object"
                                  ? JSON.stringify(record.data[field.name])
                                  : String(record.data[field.name] ?? "—")}
                              </TableCell>
                            ))}
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => deleteRecord(record._id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* API Usage Tab */}
          {activeTab === "api" && (
            <div className="space-y-6">
              {/* API Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>Use these credentials to access your {resource.name} API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Base URL</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">{apiBaseUrl}</code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(apiBaseUrl, "baseUrl")}>
                        {copied === "baseUrl" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">API Key</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">{project.apiKey}</code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(project.apiKey, "apiKey")}>
                        {copied === "apiKey" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Include this in the x-api-key header</p>
                  </div>
                </CardContent>
              </Card>

              {/* API Endpoints */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Endpoints</CardTitle>
                  <CardDescription>Copy and paste these examples to use with Postman or your code</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* GET All Records */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge variant="secondary">GET</Badge>
                      <span className="font-semibold">Get All Records</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">cURL Command</Label>
                        <div className="relative mt-1">
                          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                            <code>{`curl -X GET "${apiBaseUrl}?page=1&limit=10" \\
  -H "x-api-key: ${project.apiKey}"`}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 bg-transparent"
                            onClick={() =>
                              copyToClipboard(
                                `curl -X GET "${apiBaseUrl}?page=1&limit=10" \\\n  -H "x-api-key: ${project.apiKey}"`,
                                "get-all",
                              )
                            }
                          >
                            {copied === "get-all" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">JavaScript Example</Label>
                        <div className="relative mt-1">
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                            <code>{`fetch('${apiBaseUrl}', {
  headers: {
    'x-api-key': '${project.apiKey}'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GET Single Record */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge variant="secondary">GET</Badge>
                      <span className="font-semibold">Get Single Record</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">cURL Command</Label>
                        <div className="relative mt-1">
                          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                            <code>{`curl -X GET "${apiBaseUrl}/RECORD_ID" \\
  -H "x-api-key: ${project.apiKey}"`}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 bg-transparent"
                            onClick={() =>
                              copyToClipboard(
                                `curl -X GET "${apiBaseUrl}/RECORD_ID" \\\n  -H "x-api-key: ${project.apiKey}"`,
                                "get-single",
                              )
                            }
                          >
                            {copied === "get-single" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* POST Create Record */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge variant="default">POST</Badge>
                      <span className="font-semibold">Create New Record</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">cURL Command</Label>
                        <div className="relative mt-1">
                          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                            <code>{`curl -X POST "${apiBaseUrl}" \\
  -H "x-api-key: ${project.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sampleData, null, 2)}'`}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 bg-transparent"
                            onClick={() =>
                              copyToClipboard(
                                `curl -X POST "${apiBaseUrl}" \\\n  -H "x-api-key: ${project.apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(sampleData, null, 2)}'`,
                                "post-create",
                              )
                            }
                          >
                            {copied === "post-create" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">JavaScript Example</Label>
                        <div className="relative mt-1">
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                            <code>{`fetch('${apiBaseUrl}', {
  method: 'POST',
  headers: {
    'x-api-key': '${project.apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(sampleData, null, 2)})
})
.then(response => response.json())
.then(data => console.log(data));`}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PUT Update Record */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge variant="outline">PUT</Badge>
                      <span className="font-semibold">Update Record</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">cURL Command</Label>
                        <div className="relative mt-1">
                          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                            <code>{`curl -X PUT "${apiBaseUrl}/RECORD_ID" \\
  -H "x-api-key: ${project.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sampleData, null, 2)}'`}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 bg-transparent"
                            onClick={() =>
                              copyToClipboard(
                                `curl -X PUT "${apiBaseUrl}/RECORD_ID" \\\n  -H "x-api-key: ${project.apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(sampleData, null, 2)}'`,
                                "put-update",
                              )
                            }
                          >
                            {copied === "put-update" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DELETE Record */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge variant="destructive">DELETE</Badge>
                      <span className="font-semibold">Delete Record</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">cURL Command</Label>
                        <div className="relative mt-1">
                          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                            <code>{`curl -X DELETE "${apiBaseUrl}/RECORD_ID" \\
  -H "x-api-key: ${project.apiKey}"`}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 bg-transparent"
                            onClick={() =>
                              copyToClipboard(
                                `curl -X DELETE "${apiBaseUrl}/RECORD_ID" \\\n  -H "x-api-key: ${project.apiKey}"`,
                                "delete-record",
                              )
                            }
                          >
                            {copied === "delete-record" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Authentication</h4>
                    <p className="text-sm text-gray-600">
                      Always include your API key in the <code className="bg-gray-100 px-1 rounded">x-api-key</code>{" "}
                      header for all requests.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pagination</h4>
                    <p className="text-sm text-gray-600">
                      Use <code className="bg-gray-100 px-1 rounded">?page=1&limit=10</code> parameters to paginate
                      through results.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Response Format</h4>
                    <p className="text-sm text-gray-600">
                      All responses are in JSON format with proper HTTP status codes.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Testing with Postman</h4>
                    <p className="text-sm text-gray-600">
                      Copy the cURL commands above and import them into Postman, or create a new request with the URL
                      and headers shown.
                    </p>
                  </div>
                </CardContent>
              </Card>
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
