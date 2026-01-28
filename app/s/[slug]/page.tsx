'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Loader2, Plus, ArrowLeft, MoreVertical, Share2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getOwnerToken } from '@/lib/auth';
import { CardItem } from '@/components/CardItem';
import { CardEditorModal } from '@/components/CardEditorModal';
import { EditableText } from '@/components/EditableText';
import { ShareDialog } from '@/components/ShareDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

interface Card {
  _id: string;
  sessionId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  tags: string[];
}

interface Session {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  cardOrder: string[];
}

export default function SessionPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch session data
  const { data, isLoading, error } = useQuery({
    queryKey: ['session', params.slug],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${params.slug}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error?.message);
      return result.data as { session: Session; cards: Card[] };
    },
  });

  // Local state for cards order (for optimistic updates)
  const [localCards, setLocalCards] = useState<Card[]>([]);

  // Update local cards when data changes
  useState(() => {
    if (data?.cards) {
      setLocalCards(data.cards);
    }
  });

  // Ensure localCards stays in sync with server data
  if (data?.cards && localCards.length !== data.cards.length) {
    setLocalCards(data.cards);
  }

  // Update card order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (cardOrder: string[]) => {
      const response = await fetch(`/api/sessions/${params.slug}/order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': getOwnerToken(),
        },
        body: JSON.stringify({ cardOrder }),
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error?.message);
      return result.data;
    },
    onError: (error: Error, variables, context: any) => {
      toast.error('Failed to save order');
      // Rollback to previous order
      if (context?.previousCards) {
        setLocalCards(context.previousCards);
      }
    },
  });

  // Add card mutation (quick add)
  const addCardMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch(`/api/sessions/${params.slug}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': getOwnerToken(),
        },
        body: JSON.stringify({ title }),
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error?.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', params.slug] });
      toast.success('Card added!');
      setQuickAddTitle('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add card');
    },
  });

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'x-owner-token': getOwnerToken(),
        },
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error?.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', params.slug] });
      toast.success('Card deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete card');
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: { title?: string; description?: string }) => {
      const response = await fetch(`/api/sessions/${params.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': getOwnerToken(),
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error?.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', params.slug] });
      toast.success('Updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update');
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sessions/${params.slug}`, {
        method: 'DELETE',
        headers: {
          'x-owner-token': getOwnerToken(),
        },
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error?.message);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Session deleted');
      router.push('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete session');
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = localCards.findIndex((card) => card._id === active.id);
    const newIndex = localCards.findIndex((card) => card._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const previousCards = localCards;
    const newCards = arrayMove(localCards, oldIndex, newIndex);
    setLocalCards(newCards);

    // Update server
    const newOrder = newCards.map((card) => card._id);
    updateOrderMutation.mutate(newOrder, {
      onError: () => {
        setLocalCards(previousCards);
      },
    });
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;
    addCardMutation.mutate(quickAddTitle.trim());
  };

  const handleDeleteSession = () => {
    if (confirm('Are you sure you want to delete this ranking session? This cannot be undone.')) {
      deleteSessionMutation.mutate();
    }
  };

  const activeCard = activeId ? localCards.find((card) => card._id === activeId) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Session not found</h1>
          <p className="text-gray-600 mb-4">This ranking session doesn't exist</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { session } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <EditableText
                value={session.title}
                onSave={(value) => updateSessionMutation.mutate({ title: value })}
                className="text-3xl font-bold"
              />
              {session.description && (
                <EditableText
                  value={session.description}
                  onSave={(value) => updateSessionMutation.mutate({ description: value })}
                  className="text-gray-600 mt-2"
                  multiline
                />
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShareDialogOpen(true)}
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteSession}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Add */}
        <div className="mb-6">
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <Input
              placeholder="Quick add a card..."
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={addCardMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvancedModal(true)}
            >
              Advanced
            </Button>
          </form>
        </div>

        {/* Cards List */}
        {localCards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No cards yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first card to start ranking!
            </p>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={localCards.map((card) => card._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                <AnimatePresence>
                  {localCards.map((card, index) => (
                    <CardItem
                      key={card._id}
                      card={card}
                      index={index}
                      onDelete={() => deleteCardMutation.mutate(card._id)}
                      slug={params.slug}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>

            <DragOverlay>
              {activeCard ? (
                <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-purple-500 opacity-90">
                  <div className="font-semibold">{activeCard.title}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Advanced Add Modal */}
        <CardEditorModal
          open={showAdvancedModal}
          onOpenChange={setShowAdvancedModal}
          slug={params.slug}
        />

        {/* Share Dialog */}
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          slug={params.slug}
        />
      </div>
    </div>
  );
}
