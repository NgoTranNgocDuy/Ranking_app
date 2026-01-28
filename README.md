# 🎯 Ranking Cards

A production-quality, full-stack web application for creating and managing beautiful ranking lists with smooth drag-and-drop functionality.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## ✨ Features

- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS and shadcn/ui
- 🖱️ **Smooth Drag & Drop** - Buttery smooth reordering with @dnd-kit (mouse, touch, keyboard)
- 💾 **Persistent Storage** - MongoDB backend with Mongoose ODM
- 🔗 **Shareable Links** - Each ranking session gets a unique, shareable URL
- 🖼️ **Rich Cards** - Add titles, descriptions, images, links, and tags
- ⚡ **Optimistic Updates** - Instant UI feedback with automatic error rollback
- 📱 **Mobile Friendly** - Fully responsive design, works great on all devices
- 🎭 **Smooth Animations** - Framer Motion for delightful micro-interactions
- 🔐 **Simple Auth** - Local token-based ownership (no login required)
- 🎯 **Type Safe** - Full TypeScript support with Zod validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or MongoDB Atlas)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd Ranking_app
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/ranking-cards
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ranking-cards
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **@dnd-kit** - Modern drag-and-drop toolkit
- **Framer Motion** - Animation library
- **TanStack Query** - Powerful data synchronization
- **React Hook Form** - Form validation
- **Zod** - Schema validation
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

## 📂 Project Structure

```
Ranking_app/
├── app/
│   ├── api/
│   │   ├── sessions/
│   │   │   ├── [slug]/
│   │   │   │   ├── cards/
│   │   │   │   │   └── route.ts      # Create cards
│   │   │   │   ├── order/
│   │   │   │   │   └── route.ts      # Update card order
│   │   │   │   └── route.ts          # Get/update/delete session
│   │   │   └── route.ts               # List/create sessions
│   │   └── cards/
│   │       └── [id]/
│   │           └── route.ts           # Update/delete card
│   ├── s/
│   │   └── [slug]/
│   │       └── page.tsx               # Session ranking page
│   ├── globals.css                    # Global styles
│   ├── layout.tsx                     # Root layout
│   └── page.tsx                       # Home page
├── components/
│   ├── ui/                            # shadcn/ui components
│   ├── CardItem.tsx                   # Draggable card component
│   ├── CardEditorModal.tsx            # Add/edit card modal
│   ├── EditableText.tsx               # Inline text editing
│   ├── ShareDialog.tsx                # Share link dialog
│   └── providers.tsx                  # React Query provider
├── lib/
│   ├── models/
│   │   ├── Card.ts                    # Card Mongoose model
│   │   └── RankingSession.ts         # Session Mongoose model
│   ├── auth.ts                        # Simple ownership system
│   ├── db.ts                          # MongoDB connection
│   ├── reorder.ts                     # Array reordering utility
│   ├── slug.ts                        # Slug generation
│   ├── utils.ts                       # Utility functions
│   └── validators.ts                  # Zod schemas
├── .env.local                         # Environment variables
├── .env.example                       # Environment template
├── next.config.js                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind configuration
├── tsconfig.json                      # TypeScript configuration
└── package.json                       # Dependencies
```

## 🎯 Core Features

### Creating a Ranking Session

1. Click "Create New Ranking" on the home page
2. Enter a title and optional description
3. A unique shareable URL is generated automatically

### Adding Cards

**Quick Add:**
- Use the quick add bar at the top for fast entry
- Just type a title and press Enter

**Advanced Add:**
- Click "Advanced" for the full form
- Add description, image URL, link, and tags

### Ranking (Reordering)

- **Mouse:** Click and drag the grip handle
- **Touch:** Long press and drag on mobile
- **Keyboard:** Tab to card, Space to grab, Arrow keys to move, Space to drop

### Sharing

- Click the Share button in the header
- Copy the unique URL
- Anyone with the link can view (but not edit)

### Editing

- Click the three-dot menu on any card
- Select "Edit" to modify or "Delete" to remove
- Session title and description are editable inline

## 🗄️ Data Model

### RankingSession Collection

```typescript
{
  _id: ObjectId,
  title: string,
  description?: string,
  slug: string,              // Unique URL identifier
  ownerId?: string,          // Anonymous owner token
  cardOrder: ObjectId[],     // Ordered array of card IDs
  createdAt: Date,
  updatedAt: Date
}
```

### Card Collection

```typescript
{
  _id: ObjectId,
  sessionId: ObjectId,       // Reference to session
  title: string,
  description?: string,
  imageUrl?: string,
  linkUrl?: string,
  tags: string[],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Sessions

- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List recent sessions
- `GET /api/sessions/[slug]` - Get session with cards
- `PATCH /api/sessions/[slug]` - Update session
- `DELETE /api/sessions/[slug]` - Delete session
- `PATCH /api/sessions/[slug]/order` - Update card order

### Cards

- `POST /api/sessions/[slug]/cards` - Create card
- `PATCH /api/cards/[id]` - Update card
- `DELETE /api/cards/[id]` - Delete card

All mutations require `x-owner-token` header for authorization.

## 🎨 UI Components

Built with **shadcn/ui** for consistency and accessibility:

- Button, Input, Textarea, Label
- Dialog (modals)
- Dropdown Menu
- Card components
- Toast notifications (Sonner)

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

### Code Quality

- **TypeScript** - Full type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting (configure as needed)

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add `MONGODB_URI` environment variable
4. Deploy!

### Other Platforms

The app works on any platform that supports Next.js:
- Netlify
- Railway
- Render
- DigitalOcean App Platform

**Important:** Make sure to set the `MONGODB_URI` environment variable!

## 🔒 Security Notes

- **Simple Ownership**: Uses local storage token to identify session owners
- **No Authentication**: This is a simple demo app without user accounts
- **Validation**: Input validation on both client and server with Zod
- **Rate Limiting**: Consider adding rate limiting for production use

## 🎓 Learning Resources

This project demonstrates:

- Next.js 14 App Router patterns
- Server/Client component architecture
- MongoDB integration with Mongoose
- Drag & drop with @dnd-kit
- Form handling with React Hook Form
- Type-safe APIs with Zod
- Optimistic UI updates with TanStack Query
- Modern CSS with Tailwind

## 🐛 Troubleshooting

### MongoDB Connection Issues

If you see connection errors:

1. Check your `MONGODB_URI` in `.env.local`
2. Ensure MongoDB is running (if local)
3. Check firewall/network settings
4. For Atlas: Whitelist your IP address

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes!

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## ⭐ Acknowledgments

Built with amazing open-source tools:

- [Next.js](https://nextjs.org/)
- [dnd-kit](https://dndkit.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/)

---

Made with ❤️ using Next.js, TypeScript, and MongoDB
