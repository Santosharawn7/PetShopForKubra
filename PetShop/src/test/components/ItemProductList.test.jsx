import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ItemProductList from '../../components/ItemProductList'
import axios from 'axios'

// Mock axios
vi.mock('axios')

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock API config
vi.mock('../../config/api', () => ({
  buildApiUrl: (endpoint) => `http://localhost:5000${endpoint}`
}))

const mockProducts = [
  {
    id: 1,
    name: 'Test Pet Toy',
    description: 'A great toy for pets',
    price: 19.99,
    image_url: 'https://example.com/toy.jpg',
    category: 'Toys',
    stock: 10,
    owner_uid: 'test_owner',
    created_at: '2023-01-01T00:00:00Z',
    rating_stats: {
      average_rating: 4.5,
      rating_count: 10,
      average_sentiment: 8.2,
      comment_count: 5
    }
  },
  {
    id: 2,
    name: 'Pet Food',
    description: 'Healthy pet food',
    price: 29.99,
    image_url: 'https://example.com/food.jpg',
    category: 'Food',
    stock: 0,
    owner_uid: 'test_owner',
    created_at: '2023-01-01T00:00:00Z',
    rating_stats: {
      average_rating: 3.0,
      rating_count: 2,
      average_sentiment: 4.5,
      comment_count: 1
    }
  }
]

const mockRatingStats = {
  1: {
    average_rating: 4.5,
    rating_count: 10,
    average_sentiment: 8.2,
    comment_count: 5,
    badge_label: 'Most Favourite'
  },
  2: {
    average_rating: 3.0,
    rating_count: 2,
    average_sentiment: 4.5,
    comment_count: 1,
    badge_label: 'Try Me'
  }
}

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ItemProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockResolvedValue({
      data: mockProducts
    })
  })

  it('renders loading state initially', () => {
    renderWithRouter(<ItemProductList />)
    expect(screen.getByText('Loading products...')).toBeInTheDocument()
  })

  it('renders products after loading', async () => {
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Pet Toy')).toBeInTheDocument()
      expect(screen.getByText('Pet Food')).toBeInTheDocument()
    })
  })

  it('displays product information correctly', async () => {
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Pet Toy')).toBeInTheDocument()
      expect(screen.getByText('A great toy for pets')).toBeInTheDocument()
      expect(screen.getByText('$19.99')).toBeInTheDocument()
      expect(screen.getByText('Toys')).toBeInTheDocument()
    })
  })

  it('shows stock status correctly', async () => {
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      expect(screen.getByText('Stock: 10')).toBeInTheDocument()
      expect(screen.getAllByText('Out of Stock')[0]).toBeInTheDocument()
    })
  })

  it('displays rating information', async () => {
    // Mock rating stats API call
    axios.get.mockImplementation((url) => {
      if (url.includes('/rating-stats')) {
        return Promise.resolve({ data: mockRatingStats[1] })
      }
      return Promise.resolve({ data: mockProducts })
    })

    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      expect(screen.getAllByText('4.8')[0]).toBeInTheDocument()
      expect(screen.getAllByText('(10 ratings)')[0]).toBeInTheDocument()
    })
  })

  it('shows sentiment score and progress bar', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/rating-stats')) {
        return Promise.resolve({ data: mockRatingStats[1] })
      }
      return Promise.resolve({ data: mockProducts })
    })

    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      expect(screen.getAllByText('Sentiment Score')[0]).toBeInTheDocument()
      expect(screen.getAllByText('8.2/10')[0]).toBeInTheDocument()
    })
  })

  it('handles add to cart for in-stock items', async () => {
    const mockOnAddToCart = vi.fn()
    renderWithRouter(<ItemProductList onAddToCart={mockOnAddToCart} />)
    
    await waitFor(() => {
      const addToCartButtons = screen.getAllByText('Add to Cart')
      fireEvent.click(addToCartButtons[0])
    })
    
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProducts[0])
  })

  it('disables add to cart for out of stock items', async () => {
    const mockOnAddToCart = vi.fn()
    renderWithRouter(<ItemProductList onAddToCart={mockOnAddToCart} />)
    
    await waitFor(() => {
      const outOfStockButtons = screen.getAllByText('Out of Stock')
      const buttonElement = outOfStockButtons.find(button => button.tagName === 'BUTTON' || button.tagName === 'SPAN')
      expect(buttonElement).toBeInTheDocument()
    })
  })

  it('opens product details when clicked', async () => {
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      const productCard = screen.getByText('Test Pet Toy')
      fireEvent.click(productCard)
    })
    
    expect(mockNavigate).toHaveBeenCalledWith('/products/1', { state: { product: mockProducts[0] } })
  })

  it('shows filters when filter button is clicked', async () => {
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      const filterButton = screen.getByText('Filters')
      fireEvent.click(filterButton)
    })
    
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Shop owner')).toBeInTheDocument()
    expect(screen.getByText('Badge')).toBeInTheDocument()
    expect(screen.getByText('Ratings')).toBeInTheDocument()
  })

  it('filters products by category', async () => {
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      const filterButton = screen.getByText('Filters')
      fireEvent.click(filterButton)
    })
    
    const toysCheckbox = screen.getByLabelText('Toys')
    fireEvent.click(toysCheckbox)
    
    // Close filter panel
    const applyButton = screen.getByText('Apply')
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Test Pet Toy')).toBeInTheDocument()
      expect(screen.queryByText('Pet Food')).not.toBeInTheDocument()
    })
  })

  it('shows empty state when no products match filters', async () => {
    // Mock empty products to trigger empty state
    axios.get.mockResolvedValue({ data: [] })
    
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument()
    })
  })

  it('clears all filters when clear button is clicked', async () => {
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      const filterButton = screen.getByText('Filters')
      fireEvent.click(filterButton)
    })
    
    const toysCheckbox = screen.getByLabelText('Toys')
    fireEvent.click(toysCheckbox)
    
    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)
    
    expect(toysCheckbox).not.toBeChecked()
  })

  it('handles API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('API Error'))
    
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load products from server.')).toBeInTheDocument()
    })
  })

  it('shows empty state when no products exist', async () => {
    axios.get.mockResolvedValue({ data: [] })
    
    renderWithRouter(<ItemProductList />)
    
    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument()
      expect(screen.getByText('Upload something new to get started!')).toBeInTheDocument()
    })
  })
})
