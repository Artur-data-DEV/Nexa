"use client"

import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/presentation/components/ui/dialog"
import { Button } from "@/presentation/components/ui/button"
import { Label } from "@/presentation/components/ui/label"
import { Textarea } from "@/presentation/components/ui/textarea"
import { Checkbox } from "@/presentation/components/ui/checkbox"
import { Star, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { AxiosError } from "axios"
import { api } from "@/infrastructure/api/axios-adapter"
import { Contract } from "@/domain/entities/contract"
import { cn } from "@/lib/utils"

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    contract: Contract
    onReviewSubmitted: () => void
}

export default function ReviewModal({
    isOpen,
    onClose,
    contract,
    onReviewSubmitted,
}: ReviewModalProps) {
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const [ratingCategories, setRatingCategories] = useState({
        communication: 5,
        quality: 5,
        timeliness: 5,
        professionalism: 5,
    })
    const [isPublic, setIsPublic] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (rating < 1) {
            toast.error("Por favor, selecione uma avaliação")
            return
        }

        setIsSubmitting(true)

        try {
            const response = await api.post<{ success: boolean; message?: string }>("/reviews", {
                contract_id: contract.id,
                rating,
                comment: comment.trim() || undefined,
                rating_categories: ratingCategories,
                is_public: isPublic,
            })

            if (response.success) {
                toast.success("Avaliação enviada com sucesso!")
                onReviewSubmitted()
                onClose()
            } else {
                throw new Error(response.message || "Erro ao enviar avaliação")
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message?: string }>
            console.error("Error submitting review:", axiosError)
            toast.error(axiosError.response?.data?.message || "Erro ao enviar avaliação")
        } finally {
            setIsSubmitting(false)
        }
    }

    const renderStars = (
        value: number,
        onChange: (value: number) => void,
        size: "sm" | "md" | "lg" = "md"
    ) => {
        const sizeClasses = {
            sm: "h-4 w-4",
            md: "h-5 w-5",
            lg: "h-6 w-6",
        }

        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="p-1 hover:scale-110 transition-transform"
                    >
                        <Star
                            className={cn(
                                sizeClasses[size],
                                star <= value ? "text-yellow-500 fill-current" : "text-muted border-muted-foreground/20"
                            )}
                        />
                    </button>
                ))}
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Avaliar Parceria
                    </DialogTitle>
                    <DialogDescription>
                        Como foi trabalhar em &quot;<span className="font-semibold">{contract.title}</span>&quot;?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Avaliação Geral</Label>
                        <div className="flex items-center gap-3">
                            {renderStars(rating, setRating, "lg")}
                            <span className="text-lg font-semibold">{rating}/5</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Comunicação</Label>
                            {renderStars(ratingCategories.communication, (val) => setRatingCategories(p => ({ ...p, communication: val })), "sm")}
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Qualidade</Label>
                            {renderStars(ratingCategories.quality, (val) => setRatingCategories(p => ({ ...p, quality: val })), "sm")}
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Pontualidade</Label>
                            {renderStars(ratingCategories.timeliness, (val) => setRatingCategories(p => ({ ...p, timeliness: val })), "sm")}
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Profissionalismo</Label>
                            {renderStars(ratingCategories.professionalism, (val) => setRatingCategories(p => ({ ...p, professionalism: val })), "sm")}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="comment">Comentário (opcional)</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Compartilhe sua experiência..."
                            rows={3}
                            maxLength={1000}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="public-review"
                                checked={isPublic}
                                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                            />
                            <Label htmlFor="public-review" className="text-sm cursor-pointer">
                                Tornar esta avaliação pública
                            </Label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                Enviar Avaliação
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
