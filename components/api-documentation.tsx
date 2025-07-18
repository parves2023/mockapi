"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, CheckCircle, Download } from "lucide-react"

interface Field {
  name: string
  type: string
  required: boolean
}

interface ApiDocumentationProps {
  projectId: string
  resourceName: string
  apiKey: string
  fields: Field[]
  baseUrl: string
}

export function ApiDocumentation({ projectId, resourceName, apiKey, fields, baseUrl }: ApiDocumentationProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const apiBaseUrl = `${baseUrl}/api/${projectId}/${resourceName}`

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const generateSampleData = () => {
    const sample: Record<string, any> = {}
    fields.forEach((field) => {
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

  const sampleData = generateSampleData()

  const endpoints = [
    {
      method: "GET",
      path: "",
      title: "Get All Records",
      description: "Retrieve all records with optional pagination",
      params: [
        { name: "page", type: "number", description: "Page number (default: 1)" },
        { name: "limit", type: "number", description: "Records per page (default: 10)" },
        { name: "sort", type: "string", description: "Sort field (e.g., 'createdAt')" },
        { name: "order", type: "string", description: "Sort order: 'asc' or 'desc'" },
      ],
      response: {
        data: [sampleData],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
    {
      method: "GET",
      path: "/:id",
      title: "Get Single Record",
      description: "Retrieve a specific record by ID",
      params: [],
      response: sampleData,
    },
    {
      method: "POST",
      path: "",
      title: "Create Record",
      description: "Create a new record",
      body: sampleData,
      response: { ...sampleData, _id: "507f1f77bcf86cd799439011", createdAt: "2024-01-15T10:30:00Z" },
    },
    {
      method: "PUT",
      path: "/:id",
      title: "Update Record",
      description: "Update an existing record completely",
      body: sampleData,
      response: { ...sampleData, _id: "507f1f77bcf86cd799439011", updatedAt: "2024-01-15T10:35:00Z" },
    },
    {
      method: "PATCH",
      path: "/:id",
      title: "Partial Update",
      description: "Update specific fields of a record",
      body: { [fields[0]?.name || "field"]: "Updated value" },
      response: { ...sampleData, _id: "507f1f77bcf86cd799439011", updatedAt: "2024-01-15T10:35:00Z" },
    },
    {
      method: "DELETE",
      path: "/:id",
      title: "Delete Record",
      description: "Delete a specific record",
      params: [],
      response: { message: "Record deleted successfully" },
    },
  ]

  const generateCurlCommand = (endpoint: any) => {
    const url = `${apiBaseUrl}${endpoint.path.replace(":id", "507f1f77bcf86cd799439011")}`
    let curl = `curl -X ${endpoint.method} "${url}"`

    // Add headers
    curl += ` \\\n  -H "x-api-key: ${apiKey}"`
    curl += ` \\\n  -H "Content-Type: application/json"`

    // Add query parameters for GET requests
    if (endpoint.method === "GET" && endpoint.params.length > 0 && endpoint.path === "") {
      const queryParams = endpoint.params.map((p) => `${p.name}=1`).join("&")
      curl = curl.replace(`"${apiBaseUrl}"`, `"${apiBaseUrl}?${queryParams}"`)
    }

    // Add body for POST/PUT/PATCH requests
    if (endpoint.body) {
      curl += ` \\\n  -d '${JSON.stringify(endpoint.body, null, 2)}'`
    }

    return curl
  }

  const generatePostmanCollection = () => {
    const collection = {
      info: {
        name: `${resourceName} API`,
        description: `API collection for ${resourceName} resource`,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      auth: {
        type: "apikey",
        apikey: [
          { key: "key", value: "x-api-key", type: "string" },
          { key: "value", value: apiKey, type: "string" },
        ],
      },
      item: endpoints.map((endpoint) => ({
        name: endpoint.title,
        request: {
          method: endpoint.method,
          header: [
            { key: "x-api-key", value: apiKey, type: "text" },
            { key: "Content-Type", value: "application/json", type: "text" },
          ],
          url: {
            raw: `${apiBaseUrl}${endpoint.path}`,
            host: [baseUrl.replace("https://", "").replace("http://", "")],
            path: ["api", projectId, resourceName, ...endpoint.path.split("/").filter(Boolean)],
            ...(endpoint.params.length > 0 &&
              endpoint.path === "" && {
                query: endpoint.params.map((p) => ({
                  key: p.name,
                  value: "1",
                  description: p.description,
                })),
              }),
          },
          ...(endpoint.body && {
            body: {
              mode: "raw",
              raw: JSON.stringify(endpoint.body, null, 2),
              options: { raw: { language: "json" } },
            },
          }),
        },
        response: [
          {
            name: "Success Response",
            originalRequest: {},
            status: "OK",
            code: 200,
            body: JSON.stringify(endpoint.response, null, 2),
          },
        ],
      })),
    }

    return JSON.stringify(collection, null, 2)
  }

  const downloadPostmanCollection = () => {
    const collection = generatePostmanCollection()
    const blob = new Blob([collection], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${resourceName}-api-collection.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* API Overview */}
      <Card>
        <CardHeader>
          <CardTitle>API Overview</CardTitle>
          <CardDescription>Base information for accessing your {resourceName} API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Base URL</label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">{apiBaseUrl}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(apiBaseUrl, "baseUrl")}>
                {copied === "baseUrl" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">API Key</label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">{apiKey}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(apiKey, "apiKey")}>
                {copied === "apiKey" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Include this in the x-api-key header</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Authentication</label>
            <p className="text-sm text-gray-600 mt-1">
              All requests must include the API key in the <code>x-api-key</code> header
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resource Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Schema</CardTitle>
          <CardDescription>Fields available in your {resourceName} resource</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{field.name}</span>
                  {field.required && (
                    <Badge variant="outline" className="ml-2">
                      required
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary">{field.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Available endpoints for your {resourceName} resource</CardDescription>
            </div>
            <Button onClick={downloadPostmanCollection} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Postman Collection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Badge
                    variant={
                      endpoint.method === "GET"
                        ? "secondary"
                        : endpoint.method === "POST"
                          ? "default"
                          : endpoint.method === "DELETE"
                            ? "destructive"
                            : "outline"
                    }
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono">
                    {apiBaseUrl}
                    {endpoint.path}
                  </code>
                </div>

                <h4 className="font-semibold mb-2">{endpoint.title}</h4>
                <p className="text-gray-600 text-sm mb-4">{endpoint.description}</p>

                <Tabs defaultValue="curl" className="w-full">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                    {endpoint.params && endpoint.params.length > 0 && (
                      <TabsTrigger value="params">Parameters</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="curl" className="mt-4">
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{generateCurlCommand(endpoint)}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 bg-transparent"
                        onClick={() => copyToClipboard(generateCurlCommand(endpoint), `curl-${index}`)}
                      >
                        {copied === `curl-${index}` ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="response" className="mt-4">
                    <div className="relative">
                      <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                        <code>{JSON.stringify(endpoint.response, null, 2)}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 bg-transparent"
                        onClick={() => copyToClipboard(JSON.stringify(endpoint.response, null, 2), `response-${index}`)}
                      >
                        {copied === `response-${index}` ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  {endpoint.params && endpoint.params.length > 0 && (
                    <TabsContent value="params" className="mt-4">
                      <div className="space-y-3">
                        {endpoint.params.map((param) => (
                          <div key={param.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{param.name}</span>
                              <p className="text-sm text-gray-600">{param.description}</p>
                            </div>
                            <Badge variant="outline">{param.type}</Badge>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>Common patterns for using your API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">JavaScript (Fetch API)</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
              <code>{`// Get all records
fetch('${apiBaseUrl}', {
  headers: {
    'x-api-key': '${apiKey}'
  }
})
.then(response => response.json())
.then(data => console.log(data));

// Create a new record
fetch('${apiBaseUrl}', {
  method: 'POST',
  headers: {
    'x-api-key': '${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(sampleData, null, 2)})
})
.then(response => response.json())
.then(data => console.log(data));`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Python (Requests)</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
              <code>{`import requests

# Get all records
response = requests.get('${apiBaseUrl}', 
    headers={'x-api-key': '${apiKey}'})
data = response.json()

# Create a new record
response = requests.post('${apiBaseUrl}',
    headers={
        'x-api-key': '${apiKey}',
        'Content-Type': 'application/json'
    },
    json=${JSON.stringify(sampleData, null, 2)})
data = response.json()`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
