#!/data/data/com.termux/files/usr/bin/bash

# Script to generate PWA icons
# This creates placeholder SVG icons that can be converted to PNG

echo "Creating PWA icons..."

# Create SVG template
cat > /data/data/com.termux/files/home/public/icons/icon-template.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <text x="256" y="340" font-size="240" text-anchor="middle" fill="white" font-family="sans-serif">🔍</text>
</svg>
EOF

echo "✅ Icon template created at: public/icons/icon-template.svg"
echo ""
echo "To create PNG icons, you can:"
echo "1. Use online tool: https://realfavicongenerator.net/"
echo "2. Install ImageMagick: pkg install imagemagick"
echo "   Then convert: convert -density 300 icon-template.svg -resize 512x512 icon-512x512.png"
echo "3. Use Android Studio: Right-click res/drawable → New → Image Asset"
echo ""
echo "Or use the template SVG as is - modern browsers support SVG icons."
