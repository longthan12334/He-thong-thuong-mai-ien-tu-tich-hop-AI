import { redirect } from 'next/navigation';

/** /product-detail không kèm id → đưa khách về danh sách sản phẩm */
export default function ProductDetailIndexPage() {
  redirect('/shop');
}
