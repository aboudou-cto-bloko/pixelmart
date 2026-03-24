---
name: email-templates
description: |
  Use when creating or modifying email templates for Pixel-Mart. Triggers on: email templates,
  react-email, Resend, notifications, transactional emails, or email styling. Covers the 
  react-email component library with Resend integration.
allowed-tools: [Read, Write, Grep, Glob]
---

# Email Templates for Pixel-Mart

## Stack

- **react-email**: React components for email HTML
- **Resend**: Email delivery service
- **Location**: `src/components/emails/`

## Template Structure

```
src/components/emails/
├── components/           # Shared email components
│   ├── EmailWrapper.tsx  # Base layout
│   ├── Header.tsx        # Logo + header
│   ├── Footer.tsx        # Unsubscribe + legal
│   ├── Button.tsx        # CTA button
│   └── OrderSummary.tsx  # Order details table
├── OrderConfirmation.tsx
├── OrderShipped.tsx
├── OrderDelivered.tsx
├── PayoutComplete.tsx
├── NewReview.tsx
├── WelcomeVendor.tsx
└── PasswordReset.tsx
```

## Base Email Wrapper

```tsx
// src/components/emails/components/EmailWrapper.tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
} from '@react-email/components';

interface EmailWrapperProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailWrapper({ preview, children }: EmailWrapperProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {children}
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: '40px 0',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px',
};
```

## Email Header Component

```tsx
// src/components/emails/components/Header.tsx
import { Img, Section, Text } from '@react-email/components';

export function Header() {
  return (
    <Section style={headerStyle}>
      <Img
        src="https://pixelmart.io/logo.png"
        width="150"
        height="40"
        alt="Pixel-Mart"
      />
    </Section>
  );
}

const headerStyle = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};
```

## Email Button Component

```tsx
// src/components/emails/components/Button.tsx
import { Button as EmailButton } from '@react-email/components';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  return (
    <EmailButton
      href={href}
      style={variant === 'primary' ? primaryStyle : secondaryStyle}
    >
      {children}
    </EmailButton>
  );
}

const primaryStyle = {
  backgroundColor: '#0f172a',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 24px',
  textDecoration: 'none',
};

const secondaryStyle = {
  ...primaryStyle,
  backgroundColor: '#f4f4f5',
  color: '#0f172a',
  border: '1px solid #e4e4e7',
};
```

## Order Confirmation Template

```tsx
// src/components/emails/OrderConfirmation.tsx
import {
  Section,
  Text,
  Row,
  Column,
  Hr,
} from '@react-email/components';
import { EmailWrapper } from './components/EmailWrapper';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Button } from './components/Button';

interface OrderConfirmationProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number; // centimes
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  trackingUrl: string;
}

export function OrderConfirmation({
  customerName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  deliveryFee,
  total,
  deliveryAddress,
  trackingUrl,
}: OrderConfirmationProps) {
  const formatXOF = (centimes: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(centimes / 100);

  return (
    <EmailWrapper preview={`Commande ${orderNumber} confirmée`}>
      <Header />

      <Text style={headingStyle}>
        Merci pour votre commande, {customerName} !
      </Text>

      <Text style={textStyle}>
        Votre commande <strong>#{orderNumber}</strong> a été confirmée le {orderDate}.
      </Text>

      <Section style={orderBoxStyle}>
        <Text style={sectionTitleStyle}>Détails de la commande</Text>
        
        {items.map((item, index) => (
          <Row key={index} style={itemRowStyle}>
            <Column style={{ width: '60%' }}>
              <Text style={itemNameStyle}>{item.name}</Text>
              <Text style={itemQtyStyle}>Quantité: {item.quantity}</Text>
            </Column>
            <Column style={{ width: '40%', textAlign: 'right' }}>
              <Text style={itemPriceStyle}>{formatXOF(item.price)}</Text>
            </Column>
          </Row>
        ))}

        <Hr style={dividerStyle} />

        <Row style={totalRowStyle}>
          <Column>Sous-total</Column>
          <Column style={{ textAlign: 'right' }}>{formatXOF(subtotal)}</Column>
        </Row>
        <Row style={totalRowStyle}>
          <Column>Livraison</Column>
          <Column style={{ textAlign: 'right' }}>{formatXOF(deliveryFee)}</Column>
        </Row>
        <Row style={grandTotalStyle}>
          <Column><strong>Total</strong></Column>
          <Column style={{ textAlign: 'right' }}>
            <strong>{formatXOF(total)}</strong>
          </Column>
        </Row>
      </Section>

      <Section style={addressBoxStyle}>
        <Text style={sectionTitleStyle}>Adresse de livraison</Text>
        <Text style={textStyle}>{deliveryAddress}</Text>
      </Section>

      <Section style={{ textAlign: 'center', marginTop: '32px' }}>
        <Button href={trackingUrl}>Suivre ma commande</Button>
      </Section>

      <Footer />
    </EmailWrapper>
  );
}

// Styles
const headingStyle = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: 700,
  marginBottom: '16px',
};

const textStyle = {
  color: '#52525b',
  fontSize: '14px',
  lineHeight: '24px',
};

const sectionTitleStyle = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: '16px',
};

const orderBoxStyle = {
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  marginTop: '24px',
  padding: '24px',
};

// ... more styles
```

## New Review Notification

```tsx
// src/components/emails/NewReview.tsx
import { Section, Text } from '@react-email/components';
import { EmailWrapper } from './components/EmailWrapper';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Button } from './components/Button';

interface NewReviewProps {
  vendorName: string;
  productName: string;
  rating: number;
  reviewText: string;
  customerName: string;
  dashboardUrl: string;
}

export function NewReview({
  vendorName,
  productName,
  rating,
  reviewText,
  customerName,
  dashboardUrl,
}: NewReviewProps) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <EmailWrapper preview={`Nouvel avis ${rating}★ sur ${productName}`}>
      <Header />

      <Text style={headingStyle}>Nouvel avis reçu !</Text>

      <Text style={textStyle}>
        Bonjour {vendorName}, vous avez reçu un nouvel avis sur votre produit.
      </Text>

      <Section style={reviewBoxStyle}>
        <Text style={productNameStyle}>{productName}</Text>
        <Text style={starsStyle}>{stars}</Text>
        <Text style={reviewTextStyle}>"{reviewText}"</Text>
        <Text style={customerNameStyle}>— {customerName}</Text>
      </Section>

      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button href={dashboardUrl}>Répondre à l'avis</Button>
      </Section>

      <Footer />
    </EmailWrapper>
  );
}
```

## Sending Emails (Convex Action)

```typescript
// convex/notifications/send.ts
import { action } from "../_generated/server";
import { v } from "convex/values";
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { OrderConfirmation } from '../../src/components/emails/OrderConfirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOrderConfirmation = action({
  args: {
    to: v.string(),
    customerName: v.string(),
    orderNumber: v.string(),
    orderDate: v.string(),
    items: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    subtotal: v.number(),
    deliveryFee: v.number(),
    total: v.number(),
    deliveryAddress: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${args.orderId}`;

    const html = render(
      OrderConfirmation({
        ...args,
        trackingUrl,
      })
    );

    await resend.emails.send({
      from: 'Pixel-Mart <commandes@pixelmart.io>',
      to: args.to,
      subject: `Commande #${args.orderNumber} confirmée`,
      html,
    });
  },
});
```

## Preview Emails Locally

```bash
# Install email dev server
pnpm add -D @react-email/render

# Add script to package.json
"email:dev": "email dev --dir src/components/emails"

# Run preview server
pnpm email:dev
# Opens at http://localhost:3001
```

## Email Testing

```typescript
// src/__tests__/emails/OrderConfirmation.test.tsx
import { render } from '@react-email/render';
import { describe, it, expect } from 'vitest';
import { OrderConfirmation } from '@/components/emails/OrderConfirmation';

describe('OrderConfirmation Email', () => {
  it('renders order details correctly', () => {
    const html = render(
      <OrderConfirmation
        customerName="Jean"
        orderNumber="PM-123456"
        orderDate="24 mars 2026"
        items={[{ name: 'Produit Test', quantity: 2, price: 150000 }]}
        subtotal={300000}
        deliveryFee={50000}
        total={350000}
        deliveryAddress="123 Rue Test, Cotonou"
        trackingUrl="https://pixelmart.io/orders/123"
      />
    );

    expect(html).toContain('Jean');
    expect(html).toContain('PM-123456');
    expect(html).toContain('Produit Test');
    expect(html).toContain('3 500 XOF'); // Total formatted
  });
});
```
