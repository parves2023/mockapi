# 🚀 Mock API Clone

A lightweight, self-hosted version of MockAPI for quickly creating RESTful API endpoints. Ideal for prototyping, frontend development, and testing — without writing any backend code.

🌐 **Live Link**: [mock-api-easyserver.vercel.app](https://mock-api-easyserver.vercel.app/)

---

## 📸 Features

* 🔐 User authentication with JWT
* 📁 Project and Collection management
* 📦 CRUD endpoints auto-generated for your data
* 💾 MongoDB integration
* ✨ Fully responsive UI
* ⚡ Built with **Next.js**, **MongoDB**, and **TailwindCSS**

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/parves2023/mockapi
cd mockapi
```

### 2. Environment Setup

Create a `.env.local` file in the root of the project and add the following:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
```

Server will run at [http://localhost:3000](http://localhost:3000)

---

## 🧪 How to Use

1. Visit the live site: [mock-api-easyserver.vercel.app](https://mock-api-easyserver.vercel.app/)
2. Create an account and log in.
3. Create a new **Project**.
4. Add **Collections** to your project with a custom schema.
5. Instantly use RESTful API endpoints like:

```bash
GET    /api/{projectId}/{collection}
POST   /api/{projectId}/{collection}
PUT    /api/{projectId}/{collection}/{id}
DELETE /api/{projectId}/{collection}/{id}
```

---

## 🛠 Tech Stack

* **Frontend**: Next.js, TypeScript, TailwindCSS
* **Backend**: Next.js API Routes, MongoDB, Mongoose
* **Auth**: JWT-based authentication
* **Deployment**: Vercel

---


---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Let me know if you'd like a badge section or want to deploy instructions for Docker or Netlify too.
