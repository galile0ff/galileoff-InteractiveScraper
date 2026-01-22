# Aşama 1: Bağımlılıklar
FROM node:18-alpine AS deps
# libc6-compat bazı native paketler için gerekebilir
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Paket dosyalarını kopyala
COPY package.json package-lock.json ./ 

# Bağımlılıkları yükle
RUN npm ci

# Aşama 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js build al
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Aşama 3: Runner
# Prodüksiyon imajı, sadece gerekli dosyalara sahip
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Güvenlik için yeni bir kullanıcı oluştur
# uid ve gid belirterek yetkileri sabitliyoruz
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 galileoff



# Sadece standalone çıktı klasörünü ve static assetleri kopyala
COPY --from=builder --chown=galileoff:nodejs /app/.next/standalone ./
COPY --from=builder --chown=galileoff:nodejs /app/.next/static ./.next/static

# Kullanıcıyı değiştir
USER galileoff

# Port ayarı
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
