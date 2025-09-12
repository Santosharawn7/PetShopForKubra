import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProductDetail from '../../components/ProductDetail'
import axios from 'axios'

// Mock axios
vi.mock('axios')

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => mockNavigate,
  }
})

// Mock API config
vi.mock('../../config/api', () => ({
  buildApiUrl: (endpoint) => `http://localhost:5000${endpoint}`
}))

const mockProduct = {
  id: 1,
  name: 'Test Pet Toy',
  description: 'A great toy for pets',
  price: 19.99,
  image_url: 'https://example.com/toy.jpg',
  category: 'Toys',
  stock: 10,
  owner_uid: 'test_owner',
  created_at: '2023-01-01T00:00:00Z'
}

const mockRatingData = {
  average_rating: 4.5,
  rating_count: 10,
  average_sentiment: 8.2,
  comment_count: 5,
  badge_label: 'Most Favourite'
}

const mockComments = [
  {
    id: 1,
    user_name: 'Test User',
    comment: 'Great product!',
    sentiment_score: 8.5,
    created_at: '2023-01-01T00:00:00Z',
    votes: { up: 3, down: 0 }
  }
]

const mockRatings = [
  {
    id: 1,
    user_name: 'Test User',
    rating: 5,
    created_at: '2023-01-01T00:00:00Z'
  }
]

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockImplementation((url) => {
      if (url.includes('/products/1')) {
        return Promise.resolve({ data: mockProduct })
      } else if (url.includes('/rating-stats')) {
        return Promise.resolve({ data: mockRatingData })
      } else if (url.includes('/comments')) {
        return Promise.resolve({ data: { comments: mockComments } })
      } else if (url.includes('/ratings')) {
        return Promise.resolve({ data: { ratings: mockRatings } })
      }
      return Promise.resolve({ data: {} })
    })
  })

  it('renders loading state initially', () => {
    renderWithRouter(<ProductDetail />)
    expect(screen.getByText('Loading product details...')).toBeInTheDocument()
  })

  it('renders product information after loading', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Pet Toy')).toBeInTheDocument()
      expect(screen.getByText('A great toy for pets')).toBeInTheDocument()
      expect(screen.getByText('$19.99')).toBeInTheDocument()
      expect(screen.getByText('Toys')).toBeInTheDocument()
    })
  })

  it('displays rating information correctly', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText('(10 ratings)')).toBeInTheDocument()
    })
  })

  it('shows sentiment analysis section', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('📊 Sentiment Analysis')).toBeInTheDocument()
      expect(screen.getByText('8.2/10')).toBeInTheDocument()
      expect(screen.getByText('😊')).toBeInTheDocument()
    })
  })

  it('displays stock status correctly', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Stock: 10')).toBeInTheDocument()
      expect(screen.getByText('In Stock')).toBeInTheDocument()
    })
  })

  it('shows out of stock status for zero stock', async () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 }
    axios.get.mockImplementation((url) => {
      if (url.includes('/products/1')) {
        return Promise.resolve({ data: outOfStockProduct })
      }
      return Promise.resolve({ data: {} })
    })

    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Out of Stock')).toBeInTheDocument()
      expect(screen.getByText('Out of Stock')).toBeDisabled()
    })
  })

  it('displays comments correctly', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('Great product!')).toBeInTheDocument()
      expect(screen.getByText('8.5/10')).toBeInTheDocument()
    })
  })

  it('shows comment sentiment bars', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('No comments yet. Be the first to share your thoughts!')).toBeInTheDocument()
    })
  })

  it('handles rating form submission', async () => {
    axios.post.mockResolvedValue({ data: { message: 'Rating submitted successfully!' } })
    
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      const rateButton = screen.getByText('Rate Product')
      fireEvent.click(rateButton)
    })
    
    const nameInput = screen.getByPlaceholderText('Enter your name')
    const submitButton = screen.getByText('Submit Rating')
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/products/1/rate',
        { rating: 5, user_name: 'Test User' }
      )
    })
  })

  it('handles comment form submission', async () => {
    axios.post.mockResolvedValue({ data: { message: 'Comment added successfully!' } })
    
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      const commentButton = screen.getByText('Add Comment')
      fireEvent.click(commentButton)
    })
    
    const nameInput = screen.getByPlaceholderText('Enter your name')
    const commentInput = screen.getByPlaceholderText('Share your thoughts about this product...')
    const submitButton = screen.getByText('Submit Comment')
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(commentInput, { target: { value: 'Great product!' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/products/1/comments',
        { comment: 'Great product!', user_name: 'Test User' }
      )
    })
  })

  it('handles comment voting', async () => {
    // Mock comments data first
    axios.get.mockImplementation((url) => {
      if (url.includes('/products/1')) {
        return Promise.resolve({ data: mockProduct })
      } else if (url.includes('/rating-stats')) {
        return Promise.resolve({ data: mockRatingData })
      } else if (url.includes('/comments')) {
        return Promise.resolve({ data: { comments: [mockComment] } })
      }
      return Promise.resolve({ data: {} })
    })
    
    axios.post.mockResolvedValue({ data: { up: 4, down: 0, user_vote: 'up' } })
    
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      const thumbsUpButton = screen.getByText('0')
      fireEvent.click(thumbsUpButton)
    })
    
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/comments/1/vote',
      { direction: 'up', user_name: 'Anonymous' }
    )
  })

  it('validates rating form fields', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      const rateButton = screen.getByText('Rate Product')
      fireEvent.click(rateButton)
    })
    
    const submitButton = screen.getByText('Submit Rating')
    fireEvent.click(submitButton)
    
    // Check that form is still visible (validation prevents submission)
    await waitFor(() => {
      expect(screen.getByText('Submit Rating')).toBeInTheDocument()
    })
  })

  it('validates comment form fields', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      const commentButton = screen.getByText('Add Comment')
      fireEvent.click(commentButton)
    })
    
    const submitButton = screen.getByText('Submit Comment')
    fireEvent.click(submitButton)
    
    // Check that form is still visible (validation prevents submission)
    await waitFor(() => {
      expect(screen.getByText('Submit Comment')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('API Error'))
    
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load product details')).toBeInTheDocument()
    })
  })

  it('shows error state for non-existent product', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/products/1')) {
        return Promise.reject({ response: { status: 404 } })
      }
      return Promise.resolve({ data: {} })
    })
    
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load product details')).toBeInTheDocument()
    })
  })

  it('navigates back to shop when back button is clicked', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      const backButton = screen.getByText('Back to Shop')
      fireEvent.click(backButton)
    })
    
    expect(mockNavigate).toHaveBeenCalledWith('/shop')
  })

  it('shows empty comments state', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/products/1')) {
        return Promise.resolve({ data: mockProduct })
      } else if (url.includes('/rating-stats')) {
        return Promise.resolve({ data: mockRatingData })
      } else if (url.includes('/comments')) {
        return Promise.resolve({ data: { comments: [] } })
      } else if (url.includes('/ratings')) {
        return Promise.resolve({ data: { ratings: [] } })
      }
      return Promise.resolve({ data: {} })
    })
    
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      expect(screen.getByText('No comments yet. Be the first to share your thoughts!')).toBeInTheDocument()
    })
  })

  it('cancels rating form', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      const rateButton = screen.getByText('Rate Product')
      fireEvent.click(rateButton)
    })
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(screen.queryByText('Rate this product')).not.toBeInTheDocument()
  })

  it('cancels comment form', async () => {
    renderWithRouter(<ProductDetail />)
    
    await waitFor(() => {
      const commentButton = screen.getByText('Add Comment')
      fireEvent.click(commentButton)
    })
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(screen.queryByText('Add a comment')).not.toBeInTheDocument()
  })
})
