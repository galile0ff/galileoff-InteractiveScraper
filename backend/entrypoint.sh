#!/bin/sh
set -e

# Veritabanı dosyasının hedef konumu
target_db="/app/data/scraper.db"

# İmaj içindeki seed veritabanı
seed_db="/app/seed_data/scraper.db"

# Eğer hedefte veritabanı yoksa ve seed veritabanı mevcutsa kopyala
if [ ! -f "$target_db" ] && [ -f "$seed_db" ]; then
    echo "Veritabanı bulunamadı. Hazır veritabanı kopyalanıyor..."
    cp "$seed_db" "$target_db"
    echo "Veritabanı başarıyla oluşturuldu."
else
    echo "Mevcut veritabanı kullanılıyor."
fi

# Ana uygulamayı başlat
exec "$@"
