import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Cart from '../../components/Cart'
import axios from 'axios'

// Mock axios
vi.mock('axios')

// Mock API config
vi.mock('../../config/api', () => ({
  buildApiUrl: (endpoint) => `http://localhost:5000${endpoint}`
}))

const mockCartItems = [
  {
    id: 1,
    product_id: 1,
    quantity: 2,
    session_id: 'test_session',
    product: {
      id: 1,
      name: 'Test Pet Toy',
      price: 19.99,
      image_url: 'https://example.com/toy.jpg',
      stock: 10
    }
  },
  {
    id: 2,
    product_id: 2,
    quantity: 1,
    session_id: 'test_session',
    product: {
      id: 2,
      name: 'Pet Food',
      price: 29.99,
      image_url: 'https://example.com/food.jpg',
      stock: 5
    }
  }
]

describe('Cart', () => {
  const mockOnClose = vi.fn()
  const mockOnCheckout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockResolvedValue({ data: mockCartItems })
  })

  it('renders loading state initially', () => {
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    expect(screen.getByText('Loading cart...')).toBeInTheDocument()
  })

  it('renders cart items after loading', async () => {
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Pet Toy')).toBeInTheDocument()
      expect(screen.getByText('Pet Food')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Quantity
      expect(screen.getByText('1')).toBeInTheDocument() // Quantity
    })
  })

  it('displays product information correctly', async () => {
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Pet Toy')).toBeInTheDocument()
      expect(screen.getByText('$19.99')).toBeInTheDocument()
      expect(screen.getByText('$39.98')).toBeInTheDocument() // 2 * 19.99
    })
  })

  it('calculates total price correctly', async () => {
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      // Total: (2 * 19.99) + (1 * 29.99) = 39.98 + 29.99 = 69.97
      expect(screen.getByText('$69.97')).toBeInTheDocument()
    })
  })

  it('updates quantity when quantity input changes', async () => {
    axios.put.mockResolvedValue({ data: { ...mockCartItems[0], quantity: 3 } })
    
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      const quantityInput = screen.getByDisplayValue('2')
      fireEvent.change(quantityInput, { target: { value: '3' } })
    })
    
    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/cart/1',
      { quantity: 3 }
    )
  })

  it('removes item when remove button is clicked', async () => {
    axios.delete.mockResolvedValue({ data: { message: 'Item removed from cart successfully' } })
    
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])
    })
    
    expect(axios.delete).toHaveBeenCalledWith('http://localhost:5000/api/cart/1')
  })

  it('calls onCheckout when checkout button is clicked', async () => {
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      const checkoutButton = screen.getByText('Proceed to Checkout')
      fireEvent.click(checkoutButton)
    })
    
    expect(mockOnCheckout).toHaveBeenCalledWith(mockCartItems, '69.97')
  })

  it('calls onClose when close button is clicked', async () => {
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)
    })
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows empty cart message when no items', async () => {
    axios.get.mockResolvedValue({ data: [] })
    
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
      expect(screen.getByText('Add some products to get started!')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('API Error'))
    
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load cart items')).toBeInTheDocument()
    })
  })

  it('disables checkout button when cart is empty', async () => {
    axios.get.mockResolvedValue({ data: [] })
    
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      const checkoutButton = screen.queryByText('Proceed to Checkout')
      expect(checkoutButton).not.toBeInTheDocument()
    })
  })

  it('shows product images', async () => {
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images[0]).toHaveAttribute('src', 'https://example.com/toy.jpg')
      expect(images[1]).toHaveAttribute('src', 'https://example.com/food.jpg')
    })
  })

  it('handles quantity update errors', async () => {
    axios.put.mockRejectedValue(new Error('Update failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      const quantityInput = screen.getByDisplayValue('2')
      fireEvent.change(quantityInput, { target: { value: '3' } })
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to update cart item:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('handles remove item errors', async () => {
    axios.delete.mockRejectedValue(new Error('Delete failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to remove item from cart:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('formats prices correctly', async () => {
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      expect(screen.getByText('$19.99')).toBeInTheDocument()
      expect(screen.getByText('$29.99')).toBeInTheDocument()
      expect(screen.getByText('$39.98')).toBeInTheDocument() // 2 * 19.99
      expect(screen.getByText('$69.97')).toBeInTheDocument() // Total
    })
  })

  it('shows correct item counts', async () => {
    render(<Cart sessionId="test_session" onClose={mockOnClose} onCheckout={mockOnCheckout} />)
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // First item quantity
      expect(screen.getByText('1')).toBeInTheDocument() // Second item quantity
    })
  })
})
