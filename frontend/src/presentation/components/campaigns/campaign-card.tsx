import Link from "next/link"
import { Calendar, MapPin, DollarSign } from "lucide-react"
import { Campaign } from "@/domain/entities/campaign"
import { Card, CardContent, CardFooter, CardHeader } from "@/presentation/components/ui/card"
import { Badge } from "@/presentation/components/ui/badge"
import { Button } from "@/presentation/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/presentation/components/ui/avatar"
import Image from "next/image"

const fallbackImages = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80",
]

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api', '') || 'http://localhost:8000';

function getCampaignImage(campaign: Campaign) {
  let imageUrl: string | null = null;

  if (campaign.attach_file && campaign.attach_file.length > 0) {
    imageUrl = campaign.attach_file[0];
  } else if (campaign.image_url && !campaign.image_url.includes('via.placeholder.com')) {
    imageUrl = campaign.image_url;
  } else if (campaign.brand?.avatar && !campaign.brand.avatar.includes('via.placeholder.com')) {
    imageUrl = campaign.brand.avatar;
  }

  if (imageUrl) {
    if (imageUrl.startsWith('/')) {
      return `${BACKEND_URL}${imageUrl}`;
    }
    return imageUrl;
  }

  const index = campaign.id % fallbackImages.length;
  return fallbackImages[index];
}

function isSafeUrl(url?: string | null): boolean {
  return !!url && !url.includes('via.placeholder.com');
}

interface CampaignCardProps {
  campaign: Campaign
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const imageSrc = getCampaignImage(campaign)
  const brandAvatar = isSafeUrl(campaign.brand?.avatar) ? campaign.brand?.avatar : undefined;

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-0">
        <div className="relative h-32 bg-muted w-full">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={campaign.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-pink-500 to-purple-600 opacity-20" />
          )}
          <div className="absolute -bottom-6 left-4">
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage src={brandAvatar} />
              <AvatarFallback>{campaign.brand?.name?.substring(0, 2).toUpperCase() || "B"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-8 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{campaign.title}</h3>
            <p className="text-sm text-muted-foreground">{campaign.brand?.name || "Marca Confidencial"}</p>
          </div>
          <Badge variant={campaign.status === 'approved' ? 'default' : 'secondary'}>
            {campaign.status === 'approved' ? 'Aberta' : campaign.status}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {campaign.description}
        </p>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(campaign.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(campaign.budget)}</span>
          </div>
          {campaign.target_states && campaign.target_states.length > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{campaign.target_states.slice(0, 2).join(", ")}{campaign.target_states.length > 2 ? "..." : ""}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" asChild>
          <Link href={`/dashboard/campaigns/${campaign.id}`}>
            Ver Detalhes
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
