---
name: testing-patterns
description: |
  Use when writing tests for Pixel-Mart. Triggers on: test files, Vitest, Playwright,
  testing utilities, mocks, fixtures, or test coverage. Covers unit tests (Vitest)
  and E2E tests (Playwright) patterns specific to Convex + Next.js.
allowed-tools: [Read, Write, Bash, Grep, Glob]
---

# Testing Patterns for Pixel-Mart

## Test Structure

```
pixelmart/
├── src/
│   └── __tests__/           # Unit tests (Vitest)
│       ├── components/
│       ├── hooks/
│       └── lib/
├── convex/
│   └── __tests__/           # Convex function tests
│       ├── orders/
│       └── payments/
└── e2e/                     # E2E tests (Playwright)
    ├── fixtures/
    ├── auth.spec.ts
    ├── checkout.spec.ts
    └── vendor-dashboard.spec.ts
```

## Vitest (Unit Tests)

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'convex/_generated/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@convex': path.resolve(__dirname, './convex'),
    },
  },
});
```

### Setup File

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));
```

### Component Test Pattern

```typescript
// src/__tests__/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from '@/components/molecules/ProductCard';

const mockProduct = {
  _id: 'product_123',
  name: 'Test Product',
  price: 150000, // 1,500 XOF in centimes
  imageUrl: '/test.jpg',
  rating: 4.5,
  reviewCount: 10,
  inStock: true,
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('1 500 XOF')).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('shows out of stock badge when not in stock', () => {
    render(<ProductCard product={{ ...mockProduct, inStock: false }} />);

    expect(screen.getByText('Rupture')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<ProductCard product={mockProduct} onClick={handleClick} />);

    await userEvent.click(screen.getByRole('article'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Test Pattern

```typescript
// src/__tests__/hooks/useDeliveryFee.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDeliveryFee } from '@/hooks/useDeliveryFee';

describe('useDeliveryFee', () => {
  it('calculates fee for distance under 3km', () => {
    const { result } = renderHook(() => useDeliveryFee());

    act(() => {
      result.current.setDistance(2.5);
    });

    expect(result.current.fee).toBe(50000); // 500 XOF
  });

  it('calculates fee for distance 7-15km', () => {
    const { result } = renderHook(() => useDeliveryFee());

    act(() => {
      result.current.setDistance(10);
    });

    expect(result.current.fee).toBe(150000); // 1,500 XOF
  });
});
```

### Utility Test Pattern

```typescript
// src/__tests__/lib/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatXOF, calculateHaversineDistance } from '@/lib/format';

describe('formatXOF', () => {
  it('formats centimes to XOF currency string', () => {
    expect(formatXOF(150000)).toBe('1 500 XOF');
    expect(formatXOF(100)).toBe('1 XOF');
    expect(formatXOF(0)).toBe('0 XOF');
  });
});

describe('calculateHaversineDistance', () => {
  it('calculates distance between two points in Cotonou', () => {
    // Cotonou center to Ganhi
    const distance = calculateHaversineDistance(
      6.3654, 2.4183, // Cotonou center
      6.3550, 2.4250  // Ganhi
    );

    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(3);
  });
});
```

## Convex Function Tests

### Mocking Convex Context

```typescript
// convex/__tests__/helpers/mockContext.ts
import { vi } from 'vitest';

export function createMockQueryCtx(data: Record<string, any[]> = {}) {
  const db = {
    get: vi.fn(async (id) => {
      for (const table of Object.values(data)) {
        const item = table.find((item: any) => item._id === id);
        if (item) return item;
      }
      return null;
    }),
    query: vi.fn((table) => ({
      withIndex: vi.fn(() => ({
        filter: vi.fn(() => ({
          collect: vi.fn(async () => data[table] || []),
          first: vi.fn(async () => data[table]?.[0] || null),
        })),
        collect: vi.fn(async () => data[table] || []),
        first: vi.fn(async () => data[table]?.[0] || null),
      })),
      collect: vi.fn(async () => data[table] || []),
    })),
  };

  return { db };
}

export function createMockMutationCtx(data: Record<string, any[]> = {}) {
  const queryCtx = createMockQueryCtx(data);
  
  return {
    ...queryCtx,
    db: {
      ...queryCtx.db,
      insert: vi.fn(async (table, doc) => `${table}_new_id`),
      patch: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    },
  };
}
```

### Testing Mutations

```typescript
// convex/__tests__/orders/mutations.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createMockMutationCtx } from '../helpers/mockContext';

// Import the handler directly (not the mutation wrapper)
import { updateOrderStatusHandler } from '../../orders/mutations';

describe('updateOrderStatus', () => {
  it('allows valid transition: paid → processing', async () => {
    const ctx = createMockMutationCtx({
      orders: [{ _id: 'order_1', status: 'paid', store_id: 'store_1' }],
    });

    await updateOrderStatusHandler(ctx as any, {
      orderId: 'order_1' as any,
      newStatus: 'processing',
    });

    expect(ctx.db.patch).toHaveBeenCalledWith('order_1', expect.objectContaining({
      status: 'processing',
    }));
  });

  it('rejects invalid transition: delivered → cancelled', async () => {
    const ctx = createMockMutationCtx({
      orders: [{ _id: 'order_1', status: 'delivered' }],
    });

    await expect(
      updateOrderStatusHandler(ctx as any, {
        orderId: 'order_1' as any,
        newStatus: 'cancelled',
      })
    ).rejects.toThrow('Invalid transition');
  });
});
```

## Playwright (E2E Tests)

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Auth Fixture

```typescript
// e2e/fixtures/auth.ts
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  vendorPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'customer@test.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await use(page);
  },

  vendorPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'vendor@test.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/vendor/dashboard');
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

### E2E Test Pattern

```typescript
// e2e/checkout.spec.ts
import { test, expect } from './fixtures/auth';

test.describe('Checkout Flow', () => {
  test('customer can complete checkout with delivery', async ({ authenticatedPage: page }) => {
    // Add product to cart
    await page.goto('/products/test-product');
    await page.click('button:has-text("Ajouter au panier")');

    // Go to checkout
    await page.goto('/checkout');

    // Fill delivery address
    await page.fill('[name="address"]', '123 Rue Test, Cotonou');
    await page.waitForSelector('[data-testid="delivery-fee"]');
    
    // Verify delivery fee displayed
    const deliveryFee = await page.textContent('[data-testid="delivery-fee"]');
    expect(deliveryFee).toContain('XOF');

    // Select payment method
    await page.click('[data-testid="payment-moneroo"]');

    // Submit order
    await page.click('button:has-text("Commander")');

    // Should redirect to payment or confirmation
    await expect(page).toHaveURL(/\/(payment|confirmation)/);
  });
});
```

## Test Commands

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/__tests__/components/ProductCard.test.tsx

# Run in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run E2E tests headed (see browser)
pnpm test:e2e --headed

# Run specific E2E test
pnpm test:e2e e2e/checkout.spec.ts
```
