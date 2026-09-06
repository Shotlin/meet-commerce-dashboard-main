import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { BannerGallery } from '../components/domain/BannerGallery';
import { Palette } from 'lucide-react';

export const ContentPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Banners"
        subtitle="Promotional artwork shown on the storefront carousel — create, edit, and reorder live banners."
        badge={<Badge variant="brand" icon={<Palette className="w-3.5 h-3.5" />}>Live API</Badge>}
      />

      <BannerGallery />
    </div>
  );
};
