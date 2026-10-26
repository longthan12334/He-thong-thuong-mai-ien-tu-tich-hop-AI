import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { fallbackProducts } from '@/lib/mock-data';
import { API_BASE_URL } from '@/lib/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Tối ưu hóa SEO: Server-Side Rendering (SSR) & Dynamic OpenGraph Metadata
 * Trích xuất dữ liệu sản phẩm động để khi chia sẻ link lên Facebook, Zalo, Twitter, Telegram
 * tự động hiển thị ảnh bìa, tiêu đề sản phẩm, mô tả sang trọng và giá niêm yết.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);

  let product: any = null;

  try {
    const res = await fetch(`${API_BASE_URL}/products/${numId}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      product = await res.json();
    }
  } catch {
    // Dự phòng dữ liệu mẫu nếu API backend ngắt kết nối
  }

  if (!product) {
    product = fallbackProducts.find((p) => p.id === numId);
  }

  if (!product) {
    return {
      title: 'Sản Phẩm Cao Cấp | Aethelgard Mall',
      description: 'Khám phá bộ sưu tập thời trang thượng lưu độc bản tại Aethelgard Mall.',
    };
  }

  const title = `${product.name} | Aethelgard Luxury Mall`;
  const description =
    product.description ||
    `Khám phá tác phẩm thời trang xa xỉ ${product.name} tuyển chọn độc quyền tại Aethelgard Mall. Chế tác tinh tế, đẳng cấp vượt thời gian.`;
  const imageUrl = product.imageUrl?.startsWith('http')
    ? product.imageUrl
    : `http://localhost:3001${product.imageUrl || '/img/products/gucci-runway.jpg'}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `http://localhost:3001/product-detail/${numId}`,
      siteName: 'Aethelgard Mall — Sàn Thời Trang Cao Cấp',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    other: {
      'product:price:amount': (product.basePrice || 0).toString(),
      'product:price:currency': 'VND',
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);

  let product: any = null;
  try {
    const res = await fetch(`${API_BASE_URL}/products/${numId}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) product = await res.json();
  } catch {}

  if (!product) {
    product = fallbackProducts.find((p) => p.id === numId);
  }

  // Schema Markup chuẩn JSON-LD cho Google Shopping & Rich Results
  const jsonLd = product
    ? {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: [
          product.imageUrl?.startsWith('http')
            ? product.imageUrl
            : `http://localhost:3001${product.imageUrl || '/img/products/gucci-runway.jpg'}`,
        ],
        description: product.description || product.name,
        sku: product.sku || `SKU-${product.id}`,
        brand: {
          '@type': 'Brand',
          name: product.categoryName?.includes('Gucci') ? 'Gucci' : 'Aethelgard Boutique',
        },
        offers: {
          '@type': 'Offer',
          url: `http://localhost:3001/product-detail/${product.id}`,
          priceCurrency: 'VND',
          price: product.basePrice || 0,
          availability:
            (product.stockQuantity || 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient initialProductId={numId} />
    </>
  );
}
