'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getOwnerToken } from '@/lib/auth';

const cardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  tags: z.string().optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface Card {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  tags: string[];
}

interface CardEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  editingCard?: Card;
}

export function CardEditorModal({
  open,
  onOpenChange,
  slug,
  editingCard,
}: CardEditorModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingCard;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      tags: '',
    },
  });

  // Reset form when modal opens/closes or editing card changes
  useEffect(() => {
    if (open) {
      if (editingCard) {
        reset({
          title: editingCard.title,
          description: editingCard.description || '',
          imageUrl: editingCard.imageUrl || '',
          linkUrl: editingCard.linkUrl || '',
          tags: editingCard.tags.join(', '),
        });
      } else {
        reset({
          title: '',
          description: '',
          imageUrl: '',
          linkUrl: '',
          tags: '',
        });
      }
    }
  }, [open, editingCard, reset]);

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (data: CardFormData) => {
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t)
        : [];

      const response = await fetch(`/api/sessions/${slug}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': getOwnerToken(),
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          imageUrl: data.imageUrl || undefined,
          linkUrl: data.linkUrl || undefined,
          tags,
        }),
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error?.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', slug] });
      toast.success('Card added!');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add card');
    },
  });

  // Update card mutation
  const updateCardMutation = useMutation({
    mutationFn: async (data: CardFormData) => {
      if (!editingCard) return;

      const tags = data.tags
        ? data.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t)
        : [];

      const response = await fetch(`/api/cards/${editingCard._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': getOwnerToken(),
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          imageUrl: data.imageUrl || undefined,
          linkUrl: data.linkUrl || undefined,
          tags,
        }),
      });

      const result = await response.json();
      if (!result.ok) throw new Error(result.error?.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', slug] });
      toast.success('Card updated!');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update card');
    },
  });

  const onSubmit = (data: CardFormData) => {
    if (isEditing) {
      updateCardMutation.mutate(data);
    } else {
      createCardMutation.mutate(data);
    }
  };

  const isPending = createCardMutation.isPending || updateCardMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Card' : 'Add New Card'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your card details'
              : 'Add a new item with rich details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., The Shawshank Redemption"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...register('imageUrl')}
            />
            {errors.imageUrl && (
              <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="linkUrl">Link URL</Label>
            <Input
              id="linkUrl"
              type="url"
              placeholder="https://example.com"
              {...register('linkUrl')}
            />
            {errors.linkUrl && (
              <p className="text-sm text-red-600 mt-1">{errors.linkUrl.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="action, drama, classic"
              {...register('tags')}
            />
            {errors.tags && (
              <p className="text-sm text-red-600 mt-1">{errors.tags.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : isEditing
                ? 'Update Card'
                : 'Add Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
