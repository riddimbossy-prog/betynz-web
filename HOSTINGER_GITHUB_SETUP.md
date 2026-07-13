RewriteEngine On

# Force HTTPS and use the non-www Betynz.com address.
RewriteCond %{HTTPS} !=on [OR]
RewriteCond %{HTTP_HOST} ^www\.betynz\.com$ [NC]
RewriteRule ^ https://betynz.com%{REQUEST_URI} [R=301,L]

ErrorDocument 404 /404.html

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>
