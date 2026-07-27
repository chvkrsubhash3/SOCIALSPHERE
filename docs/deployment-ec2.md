# ─────────────────────────────────────────────
# AWS EC2 Quick Deployment Guide for SocialSphere
# ─────────────────────────────────────────────

## 1. Prepare your EC2 Instance
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS
- **Instance Type**: `t3.medium` (2 vCPU, 4GB RAM) recommended minimum
- **Storage**: 20 GB GP3 SSD

## 2. Inbound Security Group Rules
Configure your AWS Security Group with the following inbound ports:

| Type | Port Range | Source | Description |
|---|---|---|---|
| HTTP | 80 | 0.0.0.0/0 | Main Web App & Nginx Reverse Proxy |
| HTTPS | 443 | 0.0.0.0/0 | Secure Web Traffic (if SSL enabled) |
| SSH | 22 | Your IP | Remote Access |
| Custom TCP | 8025 | 0.0.0.0/0 | (Optional) MailHog Web Interface |
| Custom TCP | 3001 | 0.0.0.0/0 | (Optional) Grafana Dashboard |
| Custom TCP | 9001 | 0.0.0.0/0 | (Optional) MinIO Console |

---

## 3. SSH into EC2 & Install Docker

```bash
ssh -i "your-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP

# Update system & install Docker + Docker Compose
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git

# Enable Docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

---

## 4. Deploy SocialSphere

```bash
# Clone the repository
git clone https://github.com/your-username/socialmedia.git
cd socialmedia

# Copy the EC2 template to .env
cp .env.ec2.example .env

# Update YOUR_EC2_PUBLIC_IP in .env automatically with your actual public IP:
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
sed -i "s/YOUR_EC2_PUBLIC_IP/$PUBLIC_IP/g" .env

# Launch all services via Docker Compose
docker compose up -d --build

# Run database migrations and seed data
docker compose exec backend npm run migrate
docker compose exec backend npm run seed
```

---

## 5. Accessing the Platform
Once running, visit:
- **Application**: `http://<YOUR_EC2_PUBLIC_IP>`
- **MailHog**: `http://<YOUR_EC2_PUBLIC_IP>:8025`
- **Grafana**: `http://<YOUR_EC2_PUBLIC_IP>:3001`
- **MinIO Console**: `http://<YOUR_EC2_PUBLIC_IP>:9001`
