-- install nginx
sudo apt update
sudo apt install nginx -y

-- create new files to config rate limit on this app
sudo nano /etc/nginx/sites-available/nextjs

-- paste below config
limit_req_zone $binary_remote_addr zone=api_zone:10m rate=1r/s;
server {
    listen 80;
    server_name _;

    # Rate limit for all routes
    location / {
        limit_req zone=api_zone burst=10 nodelay;
        limit_req_status 429;  # return 429 http status when limited

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}


-- enable sites
sudo ln -s /etc/nginx/sites-available/nextjs /etc/nginx/sites-enabled/nextjs
sudo rm /etc/nginx/sites-enabled/default  # remove if still have default config files

-- check syntax and reload
sudo nginx -t
sudo systemctl reload nginx
