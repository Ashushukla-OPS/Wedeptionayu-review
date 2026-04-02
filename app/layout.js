import '../wedeption-ui-kit/theme.css'
import '../styles/globals.css';
import SiteHeader from '../components/SiteHeader';
import ErrorSuppressor from '../components/ErrorSuppressor';

export const metadata = {
  title: 'Wedeption - Plan Your Dream Wedding',
  description: 'Discover premium wedding vendors, get AI-powered planning, and create unforgettable memories. Your trusted partner in planning the perfect wedding.',
  keywords: 'wedding planning, wedding vendors, wedding inspiration, wedding decor, wedding photography',
  icons: {
    icon: [
      { url: '/Photos/lOGO.png', type: 'image/png' },
    ],
    apple: [
      { url: '/Photos/lOGO.png', type: 'image/png' },
    ],
    shortcut: '/Photos/lOGO.png',
  },
  metadataBase: new URL('https://wedeption.in'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#D4AF37" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="icon" type="image/png" href="/Photos/lOGO.png" />
        <link rel="apple-touch-icon" href="/Photos/lOGO.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Razorpay script will be loaded dynamically when needed */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                const originalError = console.error;
                const originalWarn = console.warn;
                
                const shouldSuppress = function(msg) {
                  const message = (msg || '').toString();
                  return (
                    message.includes('runtime.lastError') ||
                    message.includes('message port closed') ||
                    message.includes('Extension context invalidated') ||
                    message.includes('favicon.ico') ||
                    message.includes('Unchecked runtime.lastError') ||
                    message.includes('The message port closed before a response was received')
                  );
                };
                
                console.error = function(...args) {
                  if (args.some(arg => shouldSuppress(arg))) return;
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  if (args.some(arg => shouldSuppress(arg))) return;
                  originalWarn.apply(console, args);
                };
              })();
            `,
          }}
        />
      </head>
      <body>
        <ErrorSuppressor />
        <SiteHeader />
        <main style={{ minHeight: 'calc(100vh - 73px)' }}>{children}</main>
      </body>
    </html>
  );
}
