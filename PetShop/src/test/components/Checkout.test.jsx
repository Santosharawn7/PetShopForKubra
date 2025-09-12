import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Checkout from '../../components/Checkout'
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
    product: {
      id: 1,
      name: 'Test Pet Toy',
      price: 19.99,
      image_url: 'https://example.com/toy.jpg'
    }
  }
]

const mockOrderResponse = {
  id: 1,
  session_id: 'test_session',
  total_amount: 39.98,
  status: 'pending'
}

describe('Checkout', () => {
  const mockOnClose = vi.fn()
  const mockOnOrderComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    axios.post.mockResolvedValue({ data: mockOrderResponse })
  })

  it('renders checkout form correctly', () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    expect(screen.getByText('Checkout')).toBeInTheDocument()
    expect(screen.getByText('Complete your order')).toBeInTheDocument()
    expect(screen.getByText('Test Pet Toy')).toBeInTheDocument()
    expect(screen.getByText('$39.98')).toBeInTheDocument()
  })

  it('displays order summary correctly', () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    expect(screen.getByText('Order Summary')).toBeInTheDocument()
    expect(screen.getByText('Test Pet Toy')).toBeInTheDocument()
    expect(screen.getByText('Qty: 2')).toBeInTheDocument()
    expect(screen.getByText('$39.98')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    const submitButton = screen.getByText('Place Order - $39.98')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please fix the validation errors below.')).toBeInTheDocument()
    })
  })

  it('validates phone number format', async () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567')
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } })

    const submitButton = screen.getByText('Place Order - $39.98')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument()
    })
  })

  it('validates postal code format', async () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    const postalInput = screen.getByPlaceholderText('10001 or K1A 0A6')
    fireEvent.change(postalInput, { target: { value: 'invalid' } })

    const submitButton = screen.getByText('Place Order - $39.98')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid postal/ZIP code')).toBeInTheDocument()
    })
  })

  it('submits order successfully with valid data', async () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByPlaceholderText('+1 (555) 123-4567'), {
      target: { value: '1234567890' }
    })
    fireEvent.change(screen.getByPlaceholderText('123 Main Street, Apt 4B'), {
      target: { value: '123 Main St' }
    })
    fireEvent.change(screen.getByPlaceholderText('New York'), {
      target: { value: 'New York' }
    })
    fireEvent.change(screen.getByPlaceholderText('NY or New York'), {
      target: { value: 'NY' }
    })
    fireEvent.change(screen.getByPlaceholderText('10001 or K1A 0A6'), {
      target: { value: '10001' }
    })
    fireEvent.change(screen.getByDisplayValue('Select Country'), {
      target: { value: 'United States' }
    })

    const submitButton = screen.getByText('Place Order - $39.98')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/orders',
        {
          session_id: 'test_session',
          shipping_address: expect.stringContaining('1234567890'),
          buyer_name: 'John Doe'
        }
      )
      expect(mockOnOrderComplete).toHaveBeenCalledWith(mockOrderResponse)
    })
  })

  it('handles order submission errors', async () => {
    axios.post.mockRejectedValue(new Error('Order failed'))
    
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByPlaceholderText('+1 (555) 123-4567'), {
      target: { value: '1234567890' }
    })
    fireEvent.change(screen.getByPlaceholderText('123 Main Street, Apt 4B'), {
      target: { value: '123 Main St' }
    })
    fireEvent.change(screen.getByPlaceholderText('New York'), {
      target: { value: 'New York' }
    })
    fireEvent.change(screen.getByPlaceholderText('NY or New York'), {
      target: { value: 'NY' }
    })
    fireEvent.change(screen.getByPlaceholderText('10001 or K1A 0A6'), {
      target: { value: '10001' }
    })
    fireEvent.change(screen.getByDisplayValue('Select Country'), {
      target: { value: 'United States' }
    })

    const submitButton = screen.getByText('Place Order - $39.98')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Order could not be placed. Please try again.')).toBeInTheDocument()
    })
  })

  it('calls onClose when close button is clicked', () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    const closeButton = screen.getByText('×')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    axios.post.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ data: mockOrderResponse }), 100)
    ))

    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByPlaceholderText('+1 (555) 123-4567'), {
      target: { value: '1234567890' }
    })
    fireEvent.change(screen.getByPlaceholderText('123 Main Street, Apt 4B'), {
      target: { value: '123 Main St' }
    })
    fireEvent.change(screen.getByPlaceholderText('New York'), {
      target: { value: 'New York' }
    })
    fireEvent.change(screen.getByPlaceholderText('NY or New York'), {
      target: { value: 'NY' }
    })
    fireEvent.change(screen.getByPlaceholderText('10001 or K1A 0A6'), {
      target: { value: '10001' }
    })
    fireEvent.change(screen.getByDisplayValue('Select Country'), {
      target: { value: 'United States' }
    })

    const submitButton = screen.getByText('Place Order - $39.98')
    fireEvent.click(submitButton)

    expect(screen.getByText('Placing Order...')).toBeInTheDocument()
    expect(screen.getByText('Place Order - $39.98')).toBeDisabled()
  })

  it('validates US postal code format', async () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    const postalInput = screen.getByPlaceholderText('10001 or K1A 0A6')
    
    // Test valid US ZIP codes
    fireEvent.change(postalInput, { target: { value: '10001' } })
    expect(screen.queryByText('Please enter a valid postal/ZIP code')).not.toBeInTheDocument()
    
    fireEvent.change(postalInput, { target: { value: '12345-6789' } })
    expect(screen.queryByText('Please enter a valid postal/ZIP code')).not.toBeInTheDocument()
  })

  it('validates Canadian postal code format', async () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    const postalInput = screen.getByPlaceholderText('10001 or K1A 0A6')
    
    // Test valid Canadian postal code
    fireEvent.change(postalInput, { target: { value: 'K1A 0A6' } })
    expect(screen.queryByText('Please enter a valid postal/ZIP code')).not.toBeInTheDocument()
  })

  it('clears validation errors when fields are updated', async () => {
    render(
      <Checkout
        cartItems={mockCartItems}
        totalPrice="39.98"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    const submitButton = screen.getByText('Place Order - $39.98')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please fix the validation errors below.')).toBeInTheDocument()
    })

    // Fill in a field
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { value: 'John Doe' }
    })

    // Error should be cleared
    expect(screen.queryByText('Full name is required')).not.toBeInTheDocument()
  })

  it('displays multiple cart items correctly', () => {
    const multipleItems = [
      ...mockCartItems,
      {
        id: 2,
        product_id: 2,
        quantity: 1,
        product: {
          id: 2,
          name: 'Pet Food',
          price: 29.99,
          image_url: 'https://example.com/food.jpg'
        }
      }
    ]

    render(
      <Checkout
        cartItems={multipleItems}
        totalPrice="69.97"
        sessionId="test_session"
        onClose={mockOnClose}
        onOrderComplete={mockOnOrderComplete}
      />
    )

    expect(screen.getByText('Test Pet Toy')).toBeInTheDocument()
    expect(screen.getByText('Pet Food')).toBeInTheDocument()
    expect(screen.getByText('$69.97')).toBeInTheDocument()
  })
})
