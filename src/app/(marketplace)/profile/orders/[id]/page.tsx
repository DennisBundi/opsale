'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type OrderItem = {
  id: string
  product_id: string
  product_name: string
  product_image: string | null
  size: string | null
  color: string | null
  quantity: number
  unit_price: number
}

type Order = {
  id: string
  order_number: string
  date: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
  payment_method: string
  total_amount: number
  items: OrderItem[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-gray-100 text-gray-600',
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/signin')
        return
      }
      fetch('/api/orders/customer')
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error)
          const found = (data.orders as Order[]).find((o) => o.id === orderId)
          if (!found) {
            setError('Order not found.')
          } else {
            setOrder(found)
          }
        })
        .catch(() => setError('Failed to load order.'))
        .finally(() => setLoading(false))
    })
  }, [router, orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/profile/orders" className="text-sm text-gray-500 hover:text-gray-700">
              ← My Orders
            </Link>
          </div>
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl">{error ?? 'Order not found.'}</div>
        </div>
      </div>
    )
  }

  const isCompleted = order.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/profile/orders" className="text-sm text-gray-500 hover:text-gray-700">
            ← My Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
        </div>

        {/* Order Meta Card */}
        <div className="bg-white shadow rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">
                {new Date(order.date).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-500 capitalize">
                Payment: <span className="text-gray-700 font-medium">{order.payment_method}</span>
              </p>
            </div>
            <span
              className={`text-sm font-semibold px-3 py-1.5 rounded-full capitalize ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Items Card */}
        <div className="bg-white shadow rounded-2xl p-6 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Items ({order.items.length})
          </h2>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18A1.5 1.5 0 0022.5 18.75V6.75A1.5 1.5 0 0021 5.25H3A1.5 1.5 0 001.5 6.75v12c0 .828.672 1.5 1.5 1.5z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.size && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {item.color}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Qty: {item.quantity} × KSh {item.unit_price.toLocaleString('en-KE')}
                  </p>
                  {isCompleted && (
                    <Link
                      href={`/products/${item.product_id}`}
                      className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-primary-dark hover:text-primary transition-colors"
                    >
                      Write a Review
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  )}
                </div>

                {/* Line total */}
                <p className="font-semibold text-gray-900 flex-shrink-0">
                  KSh {(item.quantity * item.unit_price).toLocaleString('en-KE')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Total */}
        <div className="bg-white shadow rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">Order Total</span>
            <span className="text-xl font-bold text-gray-900">
              KSh {order.total_amount.toLocaleString('en-KE')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
