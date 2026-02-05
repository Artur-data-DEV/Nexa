"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/presentation/components/ui/dialog"
import { Button } from "@/presentation/components/ui/button"
import { ScrollArea } from "@/presentation/components/ui/scroll-area"
import { Checkbox } from "@/presentation/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface TermsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    content: string
    onAccept: () => Promise<void>
    onReject?: () => void
}

export function TermsModal({
    open,
    onOpenChange,
    title,
    content,
    onAccept,
    onReject
}: TermsModalProps) {
    const [accepted, setAccepted] = useState(false)
    const [loading, setLoading] = useState(false)

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setAccepted(false)
            setLoading(false)
        }
    }, [open])

    const handleAccept = async () => {
        if (!accepted) return
        setLoading(true)
        try {
            await onAccept()
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to accept terms", error)
        } finally {
            setLoading(false)
        }
    }

    const handleReject = () => {
        if (onReject) onReject()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-150 h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Por favor, leia atentamente os termos antes de prosseguir.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1 p-4 border rounded-md bg-muted/50 my-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                </ScrollArea>

                <div className="flex items-center space-x-2 py-4">
                    <Checkbox 
                        id="terms" 
                        checked={accepted} 
                        onCheckedChange={(checked) => setAccepted(checked as boolean)} 
                    />
                    <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Li e concordo com os termos e condições
                    </label>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleReject} disabled={loading}>
                        Recusar
                    </Button>
                    <Button onClick={handleAccept} disabled={!accepted || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Aceitar e Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
