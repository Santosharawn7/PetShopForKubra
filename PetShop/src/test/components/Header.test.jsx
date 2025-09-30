import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Header from '../../components/Header'
import axios from 'axios'

// Mock axios
vi.mock('axios')

// Mock API config
vi.mock('../../config/api', () => ({
  buildApiUrl: (endpoint) => `http://localhost:5000${endpoint}`
}))

const mockCategories = ['Toys', 'Food', 'Accessories']

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Header', () => {
  const mockOnSearch = vi.fn()
  const mockOnCategoryChange = vi.fn()
  const mockOnCartClick = vi.fn()
  const mockOnAddProductClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockResolvedValue({ data: mockCategories })
  })

  it('renders header correctly', () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    expect(screen.getByText('🐾 Pet Paradise Store')).toBeInTheDocument()
    expect(screen.getByText('Your one-stop pet shop')).toBeInTheDocument()
    expect(screen.getByText('Add Product')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Cart')).toBeInTheDocument()
  })

  it('displays cart item count when items are in cart', () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={3}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('handles search form submission', async () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search for pet products...')
    const searchButton = screen.getByText('Search')

    fireEvent.change(searchInput, { target: { value: 'toy' } })
    fireEvent.click(searchButton)

    expect(mockOnSearch).toHaveBeenCalledWith('toy')
  })

  it('handles search input change', () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search for pet products...')
    fireEvent.change(searchInput, { target: { value: 'food' } })

    expect(searchInput.value).toBe('food')
  })

  it('handles category change', async () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    await waitFor(() => {
      const categorySelect = screen.getByDisplayValue('All Categories')
      fireEvent.change(categorySelect, { target: { value: 'Toys' } })
    })

    expect(mockOnCategoryChange).toHaveBeenCalledWith('Toys')
  })

  it('calls onCartClick when cart button is clicked', () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    const cartButton = screen.getByText('Cart')
    fireEvent.click(cartButton)

    expect(mockOnCartClick).toHaveBeenCalled()
  })

  it('calls onAddProductClick when add product button is clicked', () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    const addProductButton = screen.getByText('Add Product')
    fireEvent.click(addProductButton)

    expect(mockOnAddProductClick).toHaveBeenCalled()
  })

  it('loads categories on mount', async () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/categories')
    })
  })

  it('displays categories in dropdown', async () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('All Categories')).toBeInTheDocument()
      expect(screen.getByText('Toys')).toBeInTheDocument()
      expect(screen.getByText('Food')).toBeInTheDocument()
      expect(screen.getByText('Accessories')).toBeInTheDocument()
    })
  })

  it('handles API errors when loading categories', async () => {
    axios.get.mockRejectedValue(new Error('API Error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch categories:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('shows search button with icon on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    // On mobile, the search button should show only the icon
    const searchButton = screen.getByRole('button', { name: /search/i })
    expect(searchButton).toBeInTheDocument()
  })

  it('handles search with empty input', () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    const searchButton = screen.getByText('Search')
    fireEvent.click(searchButton)

    expect(mockOnSearch).toHaveBeenCalledWith('')
  })

  it('handles search with whitespace input', () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search for pet products...')
    const searchButton = screen.getByText('Search')

    fireEvent.change(searchInput, { target: { value: '   ' } })
    fireEvent.click(searchButton)

    expect(mockOnSearch).toHaveBeenCalledWith('   ')
  })

  it('handles category change to All Categories', async () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    await waitFor(() => {
      const categorySelect = screen.getByDisplayValue('All Categories')
      fireEvent.change(categorySelect, { target: { value: 'All Categories' } })
    })

    expect(mockOnCategoryChange).toHaveBeenCalledWith('')
  })

  it('displays decorative elements', () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    // Check for decorative elements (they should be present in the DOM)
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    renderWithRouter(
      <Header
        onSearch={mockOnSearch}
        onCategoryChange={mockOnCategoryChange}
        cartItemCount={0}
        onCartClick={mockOnCartClick}
        onAddProductClick={mockOnAddProductClick}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search for pet products...')
    expect(searchInput).toHaveAttribute('type', 'text')

    const searchButton = screen.getByText('Search')
    expect(searchButton).toHaveAttribute('type', 'submit')

    const categorySelect = screen.getByDisplayValue('All Categories')
    expect(categorySelect).toBeInTheDocument()
  })
})



