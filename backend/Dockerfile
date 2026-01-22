# Aşama 1: Builder
FROM golang:1.25-alpine AS builder

# Gerekli paketlerin yüklenmesi
RUN apk add --no-cache git build-base

# Çalışma dizini
WORKDIR /app

# Bağımlılık dosyalarının kopyalanması
COPY go.mod go.sum ./

# Bağımlılıkların indirilmesi
RUN go mod download

# Kaynak kodun kopyalanması
COPY . .

# Uygulamanın derlenmesi
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -o scraper .

# Aşama 2: Runner
FROM alpine:latest

# SSL sertifikaları ve Timezone verisi
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Builder aşamasından derlenmiş dosyayı kopyala
COPY --from=builder /app/scraper .
COPY .env .


# Entrypoint scriptini kopyala
COPY entrypoint.sh .
# Windows satır sonlarını Linux formatına çevir
RUN sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh

# SEED VERİTABANI:
COPY data/scraper.db /app/seed_data/scraper.db

# Data klasörü için volume oluştur
VOLUME ["/app/data"]

# Portu dışarı aç
EXPOSE 8080

# Entrypoint scriptini ayarla
ENTRYPOINT ["./entrypoint.sh"]

# Uygulamayı başlat komutu (entrypoint scriptine argüman olarak geçer)
CMD ["./scraper"]
